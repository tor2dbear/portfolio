/**
 * Terminal `ai` assistant — a rule-based, no-LLM chat mode for the terminal.
 *
 * Typing `ai` in the terminal boots a small assistant (see the boot theatre in
 * terminal-ai-data.js) that answers free-text questions about Torbjörn, the
 * projects, the writing, and the site — and can hand off to the real
 * contact/subscribe flows. It is deliberately honest that it is NOT an LLM.
 *
 * Architecture: this module owns NONE of the terminal chrome. It talks to the
 * command engine (in darkmode.js) only through the small `window.Terminal`
 * seam — print(), applyAction(), captureInput()/releaseInput(), setPrompt().
 * That single dependency is what lets the assistant be its own file (and be
 * unit-tested against a mocked Terminal), and it is the same export surface a
 * future terminal.js extraction would expose. Data comes from
 * `window.TerminalAIData`. With neither present the module is inert.
 *
 * Matching: input is folded to lower-case ASCII (å/ä/ö → a/a/o, punctuation
 * dropped) and scored against every intent's keyword list — longer keywords
 * weigh more, so "product owner" beats a stray "product". The best intent
 * above a small threshold wins; intents with an `entity` slot then look for a
 * category/title/topic to specialise the answer. Nothing matches → a fallback
 * that points back at the things it CAN do.
 */
(function () {
  "use strict";

  // Whether the assistant currently owns the prompt. Guards double-starts and
  // tells handleLine it is live.
  var active = false;

  // The last answer's identity (intent + entity), so a verbatim repeat can be
  // prefaced rather than echoed silently. repeatIndex rotates the prefaces.
  var lastKey = null;
  var repeatIndex = 0;

  function data() {
    return window.TerminalAIData || null;
  }

  function term() {
    return window.Terminal || null;
  }

  // Output language follows the document, matching the rest of the site. The
  // terminal is bilingual; default to Swedish (the site's primary) when unset.
  function lang() {
    var attr = (
      document.documentElement.getAttribute("lang") || ""
    ).toLowerCase();
    return attr.indexOf("en") === 0 ? "en" : "sv";
  }

  // Fold to a comparable form: lower-case, strip Swedish diacritics so keywords
  // can be written plain, drop punctuation, collapse whitespace. Matches the
  // keyword convention documented in terminal-ai-data.js.
  function normalize(text) {
    return String(text === null || text === undefined ? "" : text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // A keyword's weight is its word count: a multi-word phrase is a stronger
  // signal than a single stray token, so "where do you work" outranks "work".
  function keywordWeight(keyword) {
    var words = keyword.split(" ").filter(Boolean).length;
    return words > 0 ? words : 1;
  }

  // Does a single-word keyword match a word in the input? Exact word always;
  // a prefix only for keywords of 4+ chars, so "projekt" still catches the
  // inflected "projekten" while short words ("ai", "cv", "yo") can't leak into
  // longer ones ("your", "history"). Matching on raw substrings would — that
  // was the early bug: normalize() trims the word-boundary spaces off keywords.
  function wordMatches(words, kw) {
    for (var i = 0; i < words.length; i++) {
      if (words[i] === kw || (kw.length >= 4 && words[i].indexOf(kw) === 0)) {
        return true;
      }
    }
    return false;
  }

  // Score one keyword list against the normalized input. Single-word keywords
  // match on word boundaries (see wordMatches); multi-word phrases match as a
  // contiguous run, padded so the ends count as boundaries too.
  function scoreKeywords(hay, keywords) {
    var words = hay.split(" ");
    var padded = " " + hay + " ";
    var score = 0;
    for (var i = 0; i < keywords.length; i++) {
      var kw = normalize(keywords[i]);
      if (!kw) {
        continue;
      }
      var matched =
        kw.indexOf(" ") !== -1
          ? padded.indexOf(" " + kw + " ") !== -1
          : wordMatches(words, kw);
      if (matched) {
        score += keywordWeight(kw);
      }
    }
    return score;
  }

  // Sum every entity's match score for a slot kind. Lets an entity word
  // strengthen its parent intent (see scoreIntent): naming just "branding" or
  // "css" should route to projects / writing even with no generic keyword —
  // and, for "css", let writing outweigh the `code` intent that also owns it.
  function entityVocabScore(hay, kind) {
    var d = data();
    if (!d || !d.entities || !d.entities[kind]) {
      return 0;
    }
    var list = d.entities[kind];
    var total = 0;
    for (var i = 0; i < list.length; i++) {
      total += scoreKeywords(hay, list[i].match || []);
    }
    return total;
  }

  // Merge the sv + en keyword lists, deduped by normalized form. Both languages
  // are always scored (the site is bilingual and visitors mix languages), but a
  // token shared across the two lists — "css", "html", "figma" — must count
  // once, not twice, or a bilingual keyword would outweigh a real signal.
  function mergedKeywords(intent) {
    var kw = intent.keywords || {};
    var all = (kw.sv || []).concat(kw.en || []);
    var seen = {};
    var uniq = [];
    for (var i = 0; i < all.length; i++) {
      var n = normalize(all[i]);
      if (n && !seen[n]) {
        seen[n] = true;
        uniq.push(all[i]);
      }
    }
    return uniq;
  }

  // An intent with a slot also inherits its entity vocabulary's score, so
  // naming a category/topic routes to the right intent. Output language is
  // chosen separately (see lang()).
  function scoreIntent(hay, intent) {
    var score = scoreKeywords(hay, mergedKeywords(intent));
    if (intent.entity) {
      score += entityVocabScore(hay, intent.entity);
    }
    return score;
  }

  // Find the best entity in a slot vocabulary (category/title/topic). Entities
  // carry a flat `match` array; highest keyword score wins, ties break to the
  // first declared. Returns null below threshold.
  function matchEntity(hay, kind) {
    var d = data();
    if (!d || !d.entities || !d.entities[kind]) {
      return null;
    }
    var list = d.entities[kind];
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < list.length; i++) {
      var score = scoreKeywords(hay, list[i].match || []);
      if (score > bestScore) {
        bestScore = score;
        best = list[i];
      }
    }
    return bestScore > 0 ? best : null;
  }

  // Classify an input into { intent, entity, score }. Exposed for tests. A null
  // intent means "fall back". Entity is resolved only for intents that declare
  // a slot and only when the input actually names one.
  function classify(raw) {
    var d = data();
    var hay = normalize(raw);
    if (!d || !d.intents || !hay) {
      return { intent: null, entity: null, score: 0 };
    }
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < d.intents.length; i++) {
      var score = scoreIntent(hay, d.intents[i]);
      if (score > bestScore) {
        bestScore = score;
        best = d.intents[i];
      }
    }
    if (!best || bestScore < 1) {
      return { intent: null, entity: null, score: bestScore };
    }
    var entity = best.entity ? matchEntity(hay, best.entity) : null;
    return { intent: best, entity: entity, score: bestScore };
  }

  function pickLang(obj, lg) {
    if (!obj) {
      return null;
    }
    return obj[lg] || obj.sv || obj.en || null;
  }

  function printLines(lines, className) {
    var t = term();
    if (!t || !lines) {
      return;
    }
    for (var i = 0; i < lines.length; i++) {
      t.print(lines[i], { className: className });
    }
  }

  // Turn a classification into printed reply + optional handoff. An intent with
  // a matched entity prefers the entity's reply (the specific answer) over the
  // intent's generic one. A `flow` action releases the prompt first so the flow
  // — not the assistant — owns the next inputs; the assistant is done.
  function respond(raw) {
    var lg = lang();
    var d = data();
    var result = classify(raw);

    if (!result.intent) {
      lastKey = null;
      printLines(pickLang(d && d.fallback, lg), "terminal-session__out");
      return;
    }

    var entity = result.entity;
    // Key the repeat check on the exact answer (intent + entity), so asking
    // "writing" then "writing about css" isn't mistaken for a repeat.
    var key =
      result.intent.id + (entity ? ":" + (entity.id || entity.slug || "") : "");
    if (key === lastKey) {
      var prefaces = pickLang(d && d.repeatPrefaces, lg) || [];
      if (prefaces.length) {
        printLines(
          [prefaces[repeatIndex % prefaces.length]],
          "terminal-session__out"
        );
        repeatIndex += 1;
      }
    } else {
      repeatIndex = 0;
    }
    lastKey = key;

    var replyObj = entity && entity.reply ? entity.reply : result.intent.reply;
    printLines(pickLang(replyObj, lg), "terminal-session__out");

    var action = result.intent.action || null;
    if (action && action.type === "flow") {
      var t = term();
      if (t) {
        t.releaseInput();
        active = false;
        t.applyAction(action);
      }
    }
  }

  // Is this line the user asking to leave? Whole-line match against exitWords
  // so "exit" leaves but "how do i exit the matrix" does not.
  function isExit(raw) {
    var d = data();
    var words = (d && d.exitWords) || ["exit", "quit", "bye"];
    var norm = normalize(raw);
    for (var i = 0; i < words.length; i++) {
      if (norm === normalize(words[i])) {
        return true;
      }
    }
    return false;
  }

  // Reduced motion: honour both the site's own toggle and the OS preference.
  // When set, the boot lines print at once instead of staggering.
  function prefersReducedMotion() {
    if (
      document.documentElement.getAttribute("data-effect-reduced-motion") ===
      "on"
    ) {
      return true;
    }
    try {
      return (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch (e) {
      return false;
    }
  }

  // Print the boot theatre, then the greeting. Staggered via setTimeout for the
  // "loading" feel; instant under reduced motion. scrollToEnd keeps the newest
  // line and the prompt in view as they appear.
  function playBoot(onDone) {
    var d = data();
    var lg = lang();
    var t = term();
    var lines = pickLang(d && d.boot, lg) || [];
    var greeting = pickLang(d && d.greeting, lg);

    function finish() {
      if (greeting) {
        printLines([greeting], "terminal-session__out");
      }
      if (t && t.scrollToEnd) {
        t.scrollToEnd();
      }
      if (onDone) {
        onDone();
      }
    }

    if (prefersReducedMotion() || typeof window.setTimeout !== "function") {
      printLines(lines, "terminal-session__out");
      finish();
      return;
    }

    var i = 0;
    (function step() {
      if (i >= lines.length) {
        finish();
        return;
      }
      printLines([lines[i]], "terminal-session__out");
      if (t && t.scrollToEnd) {
        t.scrollToEnd();
      }
      i += 1;
      window.setTimeout(step, 260);
    })();
  }

  // The first whitespace-delimited word, lower-cased — used to spot a real
  // command typed into the chat.
  function firstWord(raw) {
    var s = String(raw === null || raw === undefined ? "" : raw).trim();
    var sp = s.indexOf(" ");
    return (sp === -1 ? s : s.slice(0, sp)).toLowerCase();
  }

  // Words the assistant answers better itself than the shell would — "help"
  // lists the assistant's topics (capabilities intent), not the command set.
  var NEVER_FORWARD = { help: true, "?": true };

  // A real command typed inside the assistant should DO the thing, not be
  // chatted at ("cv" opens the résumé; "cd works" navigates). Gate on the
  // engine's own command list so ordinary sentences stay chat, exclude the exit
  // words (handled by the assistant) and the few words it answers itself.
  function isForwardableCommand(value) {
    var t = term();
    if (!t || !value || typeof t.isCommand !== "function") {
      return false;
    }
    var word = firstWord(value);
    if (NEVER_FORWARD[word] || isExit(value)) {
      return false;
    }
    return t.isCommand(word) && typeof t.run === "function";
  }

  // Handle one submitted line while the assistant owns the prompt. A real
  // command is handed to the shell; otherwise echo it in the "you>" flow style
  // (the engine bypassed its own echo for delegates) and leave or answer.
  function handleLine(raw) {
    if (!active) {
      return;
    }
    var t = term();
    var value = String(raw === null || raw === undefined ? "" : raw).trim();

    if (isForwardableCommand(value)) {
      // Leave the assistant first, so the shell — not clanker — echoes and runs
      // the command at the restored PS1.
      t.releaseInput();
      active = false;
      t.run(value);
      return;
    }

    if (t) {
      t.print("you> " + value, { className: "terminal-session__flow" });
    }
    if (isExit(value)) {
      stop();
      return;
    }
    if (value) {
      respond(value);
    }
    if (t && t.scrollToEnd) {
      t.scrollToEnd();
    }
  }

  // Enter the assistant: take the prompt, set the "you>" label, play the boot.
  // Idempotent — a second `ai` while active does nothing. Inert if the seam or
  // data hasn't loaded (progressive enhancement).
  function start() {
    var t = term();
    var d = data();
    if (!t || !d) {
      if (t) {
        t.print("ai: not available", { className: "terminal-session__out" });
      }
      return;
    }
    if (active) {
      return;
    }
    active = true;
    lastKey = null;
    repeatIndex = 0;
    // onRelease fires whether the user typed 'exit' or left the terminal
    // entirely (exitTerminal releases every delegate) — so state can't get
    // stuck "active" after the prompt is handed back.
    t.captureInput(handleLine, function () {
      active = false;
    });
    t.setPrompt("you>", { hint: pickLang(d.promptHint, lang()) });
    playBoot();
  }

  // Leave the assistant: print the farewell and hand the prompt back to the
  // shell. releaseInput() restores the PS1 and clears the delegate.
  function stop() {
    var t = term();
    var d = data();
    if (t) {
      printLines(pickLang(d && d.farewell, lang()), "terminal-session__out");
      t.releaseInput();
      if (t.scrollToEnd) {
        t.scrollToEnd();
      }
    }
    active = false;
  }

  window.TerminalAI = {
    start: start,
    stop: stop,
    handleLine: handleLine,
    classify: classify,
    normalize: normalize,
    isActive: function () {
      return active;
    },
  };

  // Exposed for unit tests (jsdom `require`); harmless in the browser.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = window.TerminalAI;
  }
})();
