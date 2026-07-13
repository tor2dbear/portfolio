/**
 * Terminal command engine.
 *
 * The interactive text-mode layout: the boot theatre, the command line
 * (`ls`/`cd`/`cat`/`set`/`pantone`/easter eggs), the virtual filesystem
 * mapped onto the site's nav, the interactive contact/subscribe flows, and the
 * enter/exit glue that swaps the terminal in and out of the page.
 *
 * Extracted from theme.js. It owns NONE of the theme system: it drives
 * appearance only through the `window.Theme` seam (aliased at the top of this
 * IIFE) and never reaches into theme.js's closure. It publishes the
 * `window.Terminal` seam that terminal-ai.js consumes, and `window.TerminalSlugs`
 * that terminal-nav.js re-stamps after an in-place swap. Loads AFTER theme.js
 * (so window.Theme exists) and BEFORE terminal-nav.js / terminal-ai.js.
 *
 * The theme module hands the terminal control at two points: setLayout() calls
 * window.Terminal.enterLayout() when the user switches INTO terminal (boot
 * theatre + transcript replay), and the four bridge vars that used to live in
 * theme.js (flow reset, nav api, boot runner, last-viewed url) now live here
 * as the engine's own internal state, read by the local exitTerminal().
 */

(function () {
  "use strict";

  // ==========================================================================
  // Theme seam aliases
  // Pull the high-level theme/layout API off window.Theme (published by
  // theme.js, which loads first) into local names, so the moved command
  // engine below reads exactly as it did when it lived inside theme.js's
  // closure. This single block is the only inward coupling to the theme module.
  // ==========================================================================
  var Theme = window.Theme || {};
  var setMode = Theme.setMode;
  var setTypography = Theme.setTypography;
  var setLayout = Theme.setLayout;
  var commitPaletteSelection = Theme.commitPaletteSelection;
  var setGrainEnabled = Theme.setGrainEnabled;
  var setBlendEnabled = Theme.setBlendEnabled;
  var setReducedMotionEnabled = Theme.setReducedMotionEnabled;
  var stopPantone = Theme.stopPantone;
  var activatePantone = Theme.activatePantone;
  var setCotyYear = Theme.setCotyYear;
  var advanceCotyYear = Theme.advanceCotyYear;
  var togglePantoneMode = Theme.togglePantoneMode;
  var isTerminalLayout = Theme.isTerminalLayout;
  var isPantoneModeActive = Theme.isPantoneModeActive;
  var getCurrentCotyYear = Theme.getCurrentCotyYear;
  var getCotyActions = Theme.getCotyActions;
  var PANTONE_MANUAL_TRANSITION_MS = Theme.PANTONE_MANUAL_TRANSITION_MS;

  // True when the visitor has asked for less motion — the OS setting or the
  // site's own reduce-motion toggle. Gates every terminal animation (the boot
  // theatre and the typed boot-transcript replay) down to a plain, instant
  // render.
  function terminalReducedMotion() {
    return (
      (typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) ||
      document.documentElement.getAttribute("data-effect-reduced-motion") ===
        "on"
    );
  }

  // Boot theater: a short staged print of the terminal chrome. Plays when
  // the user enters the layout and once per browser session on load —
  // never for reduced-motion users (system preference or the site toggle).
  var terminalBootTimer = null;

  function playTerminalBoot() {
    var root = document.documentElement;
    // A boot means the banner is shown fresh: un-hide it (an earlier page this
    // session may have set data-terminal-booted to hide it) and record that the
    // session has now booted, so later pages skip the banner. Done regardless
    // of reduced motion — only the staged animation below is motion-gated.
    root.removeAttribute("data-terminal-booted");
    try {
      sessionStorage.setItem("terminal-boot-played", "1");
    } catch (e) {
      /* storage unavailable — the boot simply replays next load */
    }
    if (terminalReducedMotion()) {
      return; // banner shown, but skip the staged print
    }
    root.classList.remove("terminal-booting");
    void root.offsetWidth;
    root.classList.add("terminal-booting");
    if (terminalBootTimer) {
      window.clearTimeout(terminalBootTimer);
    }
    terminalBootTimer = window.setTimeout(function () {
      root.classList.remove("terminal-booting");
    }, 2400);
  }

  // Set by the command engine's init to a reset that cancels any running flow
  // (via window.TerminalFlows) and releases the ai delegate, so exitTerminal
  // (which lives out here, unable to reach the init closure) can abort any
  // half-finished contact/subscribe flow on the way out.
  var terminalFlowReset = null;

  // Bridge to the command engine (nested in a later scope): it publishes an
  // `exitTargetUrl()` here so exit can land you where you cd'd to.
  var terminalNavApi = null;

  // Set by init to the boot-transcript runner, so entering the terminal via the
  // layout toggle (no page reload) replays the transcript just like loading a
  // page already in terminal does — otherwise the toggle showed the old styled
  // chrome while a reload showed the transcript.
  var terminalBootRunner = null;

  // The last remote page `cat` printed into the scrollback (a post/page you're
  // not on). On this site cat IS how you visit a page, so exit should land on
  // what you last read — mirroring how `cd` lands you where the cwd points.
  // Cleared by an append-only `cd`, which hands the exit target back to the cwd.
  var terminalLastViewedUrl = null;

  // Leave the terminal: back to the snapshotted layout, and restore the
  // snapshotted typography if the pairing's choice (technical) is still
  // active — a manual typography change inside the terminal is respected.
  function exitTerminal() {
    if (!isTerminalLayout()) {
      return;
    }
    // Wipe the command scrollback so it neither lingers on the way out nor
    // greets the next terminal session (it is hidden in other layouts anyway).
    var sessionLog = document.querySelector('[data-js="terminal-session"]');
    if (sessionLog) {
      sessionLog.textContent = "";
    }
    // Reset any in-progress interactive flow so re-entering starts clean.
    if (terminalFlowReset) {
      terminalFlowReset();
    }
    var previousLayout =
      localStorage.getItem("theme-layout-previous") || "column";
    if (previousLayout === "terminal") {
      previousLayout = "column";
    }
    var previousTypography = localStorage.getItem("theme-typography-previous");
    setLayout(previousLayout);
    if (localStorage.getItem("theme-typography") === "technical") {
      if (previousTypography && previousTypography !== "technical") {
        setTypography(previousTypography);
      } else if (!previousTypography) {
        // No snapshot (terminal was entered before snapshots existed, or
        // storage was cleared): fall back to the site default rather than
        // leaving the pairing's mono behind.
        setTypography("editorial");
      }
    }
    // Exit lands you where you were: the last remote page you `cat`'d (read),
    // or — if you only `cd`'d — where the live cwd points. Either way, if that's
    // a page other than the one loaded, navigate there in the restored layout
    // (append-only cat/cd moved the scrollback/prompt, not the URL).
    var exitUrl = terminalLastViewedUrl;
    if (
      !exitUrl &&
      terminalNavApi &&
      typeof terminalNavApi.exitTargetUrl === "function"
    ) {
      exitUrl = terminalNavApi.exitTargetUrl();
    }
    terminalLastViewedUrl = null;
    if (exitUrl && !terminalIsCurrentUrl(exitUrl)) {
      window.location.href = exitUrl;
    }
  }

  // Same-path test (ignoring trailing slash / query / hash) so exit doesn't
  // reload the page you're already on.
  function terminalIsCurrentUrl(url) {
    try {
      var target = new URL(url, window.location.href);
      var here = window.location.pathname.replace(/\/+$/, "");
      return target.pathname.replace(/\/+$/, "") === here;
    } catch (e) {
      return false;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    // First terminal page load of the session boots; navigations after
    // that print instantly, like a real terminal.
    if ((localStorage.getItem("theme-layout") || "column") === "terminal") {
      try {
        if (!sessionStorage.getItem("terminal-boot-played")) {
          playTerminalBoot();
        }
      } catch (e) {
        /* storage unavailable — skip the theater */
      }
    }

    // Terminal exit routes: the boot [exit] button, the ESC key (when no
    // panel/lightbox/input claims it), and literally typing "exit" + Enter.
    document
      .querySelectorAll('[data-js="terminal-exit"]')
      .forEach(function (button) {
        button.addEventListener("click", exitTerminal);
      });

    let terminalTypedBuffer = "";
    document.addEventListener("keydown", function (e) {
      if (document.documentElement.getAttribute("data-layout") !== "terminal") {
        return;
      }
      var target = e.target;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "Escape") {
        // defaultPrevented: the lightbox/settings panel already consumed this
        // very keypress to close itself — the state checks alone can't catch
        // that, since a handler registered before this one has by now removed
        // the open-marker the checks look for.
        if (
          e.defaultPrevented ||
          document.documentElement.classList.contains("lightbox-open") ||
          document.documentElement.hasAttribute("data-settings-panel-open")
        ) {
          return; // their own Escape handlers close them first
        }
        exitTerminal();
        return;
      }
      if (e.key === "Enter") {
        if (terminalTypedBuffer.endsWith("exit")) {
          exitTerminal();
        }
        terminalTypedBuffer = "";
        return;
      }
      if (
        e.key.length === 1 &&
        /[a-z]/i.test(e.key) &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        terminalTypedBuffer = (terminalTypedBuffer + e.key.toLowerCase()).slice(
          -8
        );
      }
    });

    // ======================================================================
    // Terminal command line
    // The tail's <input> is a real prompt. Tapping it focuses the field and
    // opens the on-screen keyboard (the fix that makes the terminal usable on
    // touch devices), and Enter runs a small set of commands + easter eggs.
    // Parsing is separated from side effects: runTerminalCommand() returns the
    // text to print plus an optional action, and applyTerminalAction() carries
    // it out by reusing the theme/layout functions already defined above.
    // ======================================================================
    const terminalInput = document.querySelector('[data-js="terminal-input"]');
    const terminalTail = terminalInput
      ? terminalInput.closest(".terminal-tail")
      : null;
    const terminalSession = document.querySelector(
      '[data-js="terminal-session"]'
    );

    // Clicking a cat'd [image N] token is a shortcut for a command you could
    // have typed: it echoes `open <file>` into the scrollback (frozen at the
    // current cwd, like any command) and opens the picture in the lightbox.
    // Delegated, so it covers every image printed into the append-only buffer.
    if (terminalSession) {
      terminalSession.addEventListener("click", function (e) {
        var btn = e.target.closest(".terminal-session__image");
        if (!btn) {
          return;
        }
        var file = btn.getAttribute("data-image-file") || "image";
        var src = btn.getAttribute("data-image-src");
        var alt = btn.getAttribute("data-image-alt");
        printTerminalLine(
          "open " + file,
          "terminal-session__cmd",
          currentTerminalCwd()
        );
        // Opening a fullscreen image should dismiss the mobile keyboard, so
        // blur the prompt and DON'T call scrollTerminalToEnd (it would refocus
        // the input and pop the keyboard straight back up). Scroll without
        // refocusing; the lightbox itself moves focus to its close button.
        if (terminalInput) {
          terminalInput.blur();
        }
        if (
          src &&
          window.TerminalLightbox &&
          typeof window.TerminalLightbox.openSrc === "function"
        ) {
          window.TerminalLightbox.openSrc(src, alt);
        }
        window.requestAnimationFrame(function () {
          window.scrollTo(0, document.body.scrollHeight);
        });
      });

      // Clicking any command token — a `set` chip or an `ls` entry — runs the
      // command it carries, identical to typing it (echoes and applies).
      terminalSession.addEventListener("click", function (e) {
        var token = e.target.closest("[data-cmd]");
        if (!token || !terminalSession.contains(token)) {
          return;
        }
        var cmd = token.getAttribute("data-cmd");
        if (!cmd) {
          return;
        }
        runTerminalInput(cmd);
        // A clicked directory entry "opens" the folder: follow the cd with an
        // `ls` so its listing appends right below — no reload, the scrollback
        // just grows. (A typed `cd` stays a silent move, matching a real shell;
        // the click is the navigation gesture.) Transcript mode only, where the
        // append-only session IS the page.
        if (
          document.documentElement.hasAttribute("data-terminal-transcript") &&
          token.classList.contains("terminal-session__ls-entry") &&
          /^cd\s+\S/.test(cmd)
        ) {
          runTerminalInput("ls");
        }
      });
    }

    // Session start, for `uptime` — captured when the command engine boots.
    var terminalSessionStart = Date.now();

    // Command scrollback for `history`, oldest first. Capped so a long-lived
    // tab can't grow it without bound.
    var terminalHistory = [];
    var TERMINAL_HISTORY_MAX = 100;

    // Entry labels a remote `ls` fetched, keyed by cwd segments ("works/tags").
    // An append-only `cd` moves the prompt without loading the directory, so Tab
    // completion (synchronous, reads only the loaded page + the static tree) has
    // nothing to offer there. Once you `ls` such a directory we cache what it
    // held, so completing within it works — matching how you'd naturally `ls`
    // first, then Tab.
    var terminalLsDirCache = {};

    // Literal tables — help text, Tab-completion vocabulary, cat-able
    // pseudo-files, fortunes, the easter-egg index, the konami sequence and
    // the selectable layouts — live in terminal-data.js (window.TerminalData),
    // the same data-module pattern as terminal-ai-data.js. Aliased here so the
    // engine reads exactly as before; the fallbacks keep it inert without it.
    var TD = window.TerminalData || {};
    var KONAMI_SEQUENCE = TD.KONAMI_SEQUENCE || [];
    var konamiProgress = 0;

    // Where ↑/↓ history recall currently sits (null = the live line). Reset
    // whenever the user types or runs a command.
    var terminalHistoryCursor = null;

    // The last printed output line, for `copy` with no argument.
    var lastTerminalOutput = "";

    // The most recently echoed command line element, so a `cat` that loads a
    // post can scroll the reader to the top of that output (see revealTerminalCat).
    var lastTerminalCmdLine = null;

    // Localized terminal strings, rendered per language by footer.html into
    // data-js="terminal-i18n". Present on every terminal page; the English
    // literals in terminal-data.js are the fallback (no-JS build, a missing
    // catalog, or a parse error), so the terminal never renders blank.
    var TI18N = (function () {
      var el = document.querySelector('[data-js="terminal-i18n"]');
      if (!el || !el.textContent) {
        return {};
      }
      try {
        return JSON.parse(el.textContent) || {};
      } catch (e) {
        return {};
      }
    })();

    // A newline-joined i18n block → an array of lines (edge blank lines from the
    // TOML triple-quote trimmed), or the English fallback when the catalog lacks
    // the key.
    function tiLines(value, fallback) {
      if (typeof value !== "string") {
        return fallback;
      }
      return value.replace(/^\n+|\n+$/g, "").split("\n");
    }

    // A single UI string by catalog key, with %s placeholders filled from the
    // trailing args, falling back to the English literal passed in.
    function tiText(key, fallback) {
      var v = TI18N.ui && TI18N.ui[key];
      var str = typeof v === "string" ? v : fallback;
      var args = Array.prototype.slice.call(arguments, 2);
      var i = 0;
      return str.replace(/%s/g, function () {
        return i < args.length ? args[i++] : "%s";
      });
    }

    var TERMINAL_LAYOUTS = TD.TERMINAL_LAYOUTS || [];
    const TERMINAL_HELP = tiLines(TI18N.help, TD.TERMINAL_HELP || []);

    const TERMINAL_COMMAND_NAMES = TD.TERMINAL_COMMAND_NAMES || [];

    // The `ls` flags, offered by Tab completion (`ls -⇥`). --featured lists the
    // page's cards (home's featured works); --images counts its figures; -a/-R
    // are the real ls short flags (hidden entries / recursive).
    var TERMINAL_LS_FLAGS = ["--featured", "--images", "-a", "-R"];

    // Toggleable image effects, keyed by command word. `invert` flags that the
    // command's sense is the opposite of its data-attribute: "motion on" means
    // animation on, i.e. data-effect-reduced-motion OFF. Built once, not per
    // command.
    const TERMINAL_EFFECTS = {
      grain: { attr: "data-effect-grain", set: setGrainEnabled, invert: false },
      blend: { attr: "data-effect-blend", set: setBlendEnabled, invert: false },
      motion: {
        attr: "data-effect-reduced-motion",
        set: setReducedMotionEnabled,
        invert: true,
      },
    };

    // Pseudo-files: start from the English literals, then overlay any localized
    // blocks from the catalog (readme/about/secret/config). welcome and colophon
    // aren't here — they're reproduced live from the page's own (already
    // localized) DOM by terminalWelcomeLines / terminalColophonLines.
    const TERMINAL_FILES = (function () {
      var base = TD.TERMINAL_FILES || { welcome: [], colophon: [] };
      var files = {};
      Object.keys(base).forEach(function (k) {
        files[k] = base[k];
      });
      var cat = TI18N.files || {};
      Object.keys(cat).forEach(function (k) {
        files[k] = tiLines(cat[k], files[k] || []);
      });
      return files;
    })();
    const TERMINAL_FORTUNES = TD.TERMINAL_FORTUNES || [];
    const TERMINAL_EASTER_EGGS = tiLines(
      TI18N.easterEggs,
      TD.TERMINAL_EASTER_EGGS || []
    );

    function terminalHost() {
      return (window.location && window.location.hostname) || "tor-bjorn.com";
    }

    function resolvedModeLabel() {
      return document.documentElement.getAttribute("data-mode") === "dark"
        ? "dark"
        : "light";
    }

    function paletteLabel() {
      var palette =
        document.documentElement.getAttribute("data-palette") || "standard";
      if (palette === "pantone") {
        return "pantone (" + getCurrentCotyYear() + ")";
      }
      return palette;
    }

    function neofetchLines() {
      var host = terminalHost();
      return [
        "visitor@" + host,
        "-----------------",
        "host      " + host,
        "layout    terminal",
        "mode      " + resolvedModeLabel(),
        "palette   " + paletteLabel(),
        "lang      " + (document.documentElement.getAttribute("lang") || "en"),
        "shell     tor-sh 1.0",
      ];
    }

    // "on"/"off" from an argument, otherwise "toggle".
    function onOffState(arg) {
      var value = (arg || "").toLowerCase();
      if (value === "on" || value === "enable" || value === "1") {
        return "on";
      }
      if (value === "off" || value === "disable" || value === "0") {
        return "off";
      }
      return "toggle";
    }

    // "1h 2m 3s", dropping leading zero units, for `uptime`.
    function formatUptime(totalSeconds) {
      var s = Math.max(0, Math.floor(totalSeconds));
      var h = Math.floor(s / 3600);
      var m = Math.floor((s % 3600) / 60);
      s = s % 60;
      var parts = [];
      if (h) {
        parts.push(h + "h");
      }
      if (h || m) {
        parts.push(m + "m");
      }
      parts.push(s + "s");
      return parts.join(" ");
    }

    function uptimeLine() {
      var secs = (Date.now() - terminalSessionStart) / 1000;
      return "up " + formatUptime(secs) + " · load 0.00 (it's a static site)";
    }

    function historyLines() {
      if (!terminalHistory.length) {
        return ["(no history yet)"];
      }
      return terminalHistory.map(function (entry, i) {
        var n = String(i + 1);
        while (n.length < 3) {
          n = " " + n;
        }
        return n + "  " + entry;
      });
    }

    // Full path segments for an internal href, lang prefix stripped (like
    // hrefToCwd but keeping every segment). Only root-relative "/..." links
    // count — that cleanly drops mailto:, tel:, external, and hash links.
    function terminalHrefSegments(href) {
      var raw = String(href || "");
      if (raw.charAt(0) !== "/") {
        return null;
      }
      var path = raw.replace(/[?#].*$/, "").replace(/^\/+|\/+$/g, "");
      var lang = (
        document.documentElement.getAttribute("lang") || ""
      ).toLowerCase();
      var parts = path.split("/").filter(Boolean);
      if (parts.length && parts[0].toLowerCase() === lang) {
        parts.shift();
      }
      return parts.map(function (p) {
        // Decode percent-escapes so a localized slug reads as its real name
        // (g%c3%b6teborgsaffisch → göteborgsaffisch) in listings and matches a
        // typed `cat göteborgsaffisch.md`. Fetches still use the raw href, which
        // the browser re-encodes, so the round-trip is unaffected.
        var seg = p;
        try {
          seg = decodeURIComponent(p);
        } catch (e) {
          /* malformed escape — keep the raw segment */
        }
        return seg.toLowerCase();
      });
    }

    // A small nested directory tree built from every nav + footer link path,
    // so `ls`, `tree`, `cd` and Tab completion share one data-driven model of
    // the "filesystem". Cached like terminalNavTargets — the links are static.
    var terminalDirTreeCache = null;
    function terminalDirTree() {
      if (terminalDirTreeCache) {
        return terminalDirTreeCache;
      }
      var root = { name: "~", href: terminalHomeUrl(), children: {} };
      // Seed the top level from the manifest — the authoritative list of what's
      // in ~ (including footer-only sections like legal that carry no nav link,
      // and without the noise of harvesting every footer href e.g. index.xml).
      var manifest = terminalManifest();
      Object.keys(manifest).forEach(function (seg) {
        root.children[seg] = {
          name: seg,
          href: manifest[seg].url || null,
          children: {},
        };
      });
      // Then harvest the (relative) nav links for deeper structure — a section's
      // tags/ and the like.
      var links = document.querySelectorAll(
        ".top-menu__nav a[href]:not(.terminal-quick), .top-menu__link[href]"
      );
      links.forEach(function (link) {
        var segs = terminalHrefSegments(link.getAttribute("href"));
        if (!segs || !segs.length) {
          return;
        }
        var node = root;
        segs.forEach(function (seg) {
          if (!node.children[seg]) {
            node.children[seg] = { name: seg, href: null, children: {} };
          }
          node = node.children[seg];
        });
        if (!node.href) {
          node.href = link.getAttribute("href");
        }
      });
      terminalDirTreeCache = root;
      return root;
    }

    // The current (live) working directory as lowercased path segments.
    function terminalCwdSegments() {
      return terminalSegmentsOf(currentTerminalCwd());
    }

    // The LOADED page's cwd (the frozen --terminal-cwd the server set), as
    // segments. It differs from the live cwd once you've cd'd away — which is
    // how `ls` knows the current DOM can't list here and it must fetch.
    function terminalPageCwdSegments() {
      var v = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue("--terminal-cwd")
        .trim()
        .replace(/^["']|["']$/g, "");
      return terminalSegmentsOf(v || "~");
    }

    function terminalSegmentsOf(cwd) {
      var rest = String(cwd || "").replace(/^~\/?/, "");
      return rest
        ? rest
            .split("/")
            .filter(Boolean)
            .map(function (s) {
              return s.toLowerCase();
            })
        : [];
    }

    // Resolve a path argument to absolute segments, relative to the cwd unless
    // it starts with "~" or "/". Supports "." and "..".
    function terminalResolveSegments(pathArg) {
      var arg = String(pathArg || "").trim();
      var segs;
      if (arg.charAt(0) === "~" || arg.charAt(0) === "/") {
        segs = [];
        arg = arg.replace(/^~/, "").replace(/^\/+/, "");
      } else {
        segs = terminalCwdSegments();
      }
      arg
        .split("/")
        .filter(Boolean)
        .forEach(function (part) {
          var p = part.toLowerCase();
          if (p === ".") {
            return;
          }
          if (p === "..") {
            segs.pop();
            return;
          }
          segs.push(p);
        });
      return segs;
    }

    function terminalNodeAt(segments) {
      var node = terminalDirTree();
      for (var i = 0; i < segments.length; i++) {
        node = node.children[segments[i]];
        if (!node) {
          return null;
        }
      }
      return node;
    }

    // Slugs of the current page's own content links (article / summary cards)
    // that live under the given section — so `ls` inside e.g. ~/writing lists
    // the actual posts, which the nav tree can't know about.
    function terminalPageContentSlugs(sectionSegments) {
      if (!sectionSegments.length) {
        return [];
      }
      var section = sectionSegments[0];
      var out = [];
      var seen = {};
      document
        .querySelectorAll(".article-card a[href], .summary-card a[href]")
        .forEach(function (link) {
          var segs = terminalHrefSegments(link.getAttribute("href"));
          if (!segs || segs.length < 2 || segs[0] !== section) {
            return;
          }
          var slug = segs[segs.length - 1];
          if (seen[slug]) {
            return;
          }
          seen[slug] = true;
          out.push(slug);
        });
      return out;
    }

    // List a single directory. Structural children come from the nav/footer
    // tree; for the current directory, the page's own content links are merged
    // in. Unknown path → an ls-style error; a real page whose contents can't
    // be listed from here (a different section) → a `cd` hint rather than a
    // bare empty result.
    // The terminal presents the site as a filesystem, and Hugo tells it what
    // each top-level thing IS via the manifest emitted in head.html: a section
    // is a `dir`, a standalone page a `file`, the contact form an `action`, a
    // visual tool `exempt`. Parsed once; the client no longer guesses.
    var terminalManifestCache = null;
    function terminalManifest() {
      if (terminalManifestCache) {
        return terminalManifestCache;
      }
      terminalManifestCache = {};
      var el = document.querySelector('[data-js="terminal-manifest"]');
      if (el && el.textContent) {
        try {
          terminalManifestCache = JSON.parse(el.textContent) || {};
        } catch (e) {
          /* malformed manifest — fall back to the dir default below */
        }
      }
      return terminalManifestCache;
    }

    // A top-level segment's kind. Deeper structural nodes (e.g. a section's
    // `tags/`) aren't in the manifest and default to `dir` — they list children.
    function terminalNodeKind(name) {
      var e = terminalManifest()[String(name || "").toLowerCase()];
      return (e && e.kind) || "dir";
    }

    // A top-level segment's URL from the manifest — lets the terminal reach a
    // footer-only section (legal) that has no nav link to resolve against.
    function terminalManifestUrl(name) {
      var e = terminalManifest()[String(name || "").toLowerCase()];
      return (e && e.url) || null;
    }

    // How an entry renders in a listing: dir → `name/`, file → `name.md`,
    // action → `name` (a command), exempt → `name*` (a tool you `open`).
    function terminalEntryLabel(name) {
      switch (terminalNodeKind(name)) {
        case "file":
          return name + ".md";
        case "action":
          return name;
        case "exempt":
          return name + "*";
        default:
          return name + "/";
      }
    }

    function terminalNavEntries() {
      var seen = {};
      var out = [];
      document
        .querySelectorAll(
          ".top-menu__nav a[href]:not(.terminal-quick), .terminal-prompt__host[href]"
        )
        .forEach(function (a) {
          var href = a.getAttribute("href");
          if (!href || href.charAt(0) === "#") {
            return;
          }
          var segs = terminalHrefSegments(href);
          var name = segs && segs.length ? segs[0] : "home";
          if (seen[name]) {
            return;
          }
          seen[name] = true;
          out.push(name === "home" ? "home" : terminalEntryLabel(name));
        });
      return out;
    }

    // Mirror the settings menu's actual sections (settings-dropdown.html's
    // theme-section-title headings), so `ls settings` names things the panel
    // really has: "mode" (not "theme"), no standalone "palette" (pantone lives
    // under effects), and "share".
    function terminalSettingsEntries() {
      return ["mode", "layout", "typography", "effects", "share", "language"];
    }

    // The settable keys, their options, and the current value — the model both
    // `set` (no args, rendered as clickable chips) and `set <key> <value>` work
    // from. Motion reads as its feature state (on = animated) to match
    // `set motion on/off`, not the underlying reduced-motion attribute.
    function terminalSettingsSpec() {
      var root = document.documentElement;
      var effOn = function (attr) {
        return root.getAttribute(attr) === "on";
      };
      var gridAttr = root.getAttribute("data-grid-overlay");
      return [
        {
          key: "mode",
          options: ["light", "dark", "system"],
          current: localStorage.getItem("theme-mode") || "system",
        },
        {
          key: "layout",
          options: TERMINAL_LAYOUTS,
          current: root.getAttribute("data-layout") || "column",
        },
        {
          key: "typography",
          options: TERMINAL_TYPOGRAPHY,
          current: localStorage.getItem("theme-typography") || "editorial",
        },
        { key: "language", options: ["sv", "en"], current: currentLang() },
        {
          key: "pantone",
          options: ["on", "off"],
          current:
            typeof isPantoneModeActive === "function" && isPantoneModeActive()
              ? "on"
              : "off",
        },
        {
          key: "grid",
          options: ["on", "off"],
          current: gridAttr !== null && gridAttr !== "closing" ? "on" : "off",
        },
        {
          key: "blend",
          options: ["on", "off"],
          current: effOn("data-effect-blend") ? "on" : "off",
        },
        {
          key: "grain",
          options: ["on", "off"],
          current: effOn("data-effect-grain") ? "on" : "off",
        },
        {
          key: "motion",
          options: ["on", "off"],
          current: effOn("data-effect-reduced-motion") ? "off" : "on",
        },
      ];
    }

    // Typography values `set typography <value>` accepts (mirrors the menu).
    var TERMINAL_TYPOGRAPHY = [
      "editorial",
      "refined",
      "expressive",
      "technical",
      "system",
    ];

    // A filtered `ls` view — same tool, a lens. `--featured` lists the curated
    // cards on the current page (home's featured works), harvested from that
    // page's DOM — a page's own sequence.
    function terminalHarvestFileLabels(selector) {
      var out = [];
      document.querySelectorAll(selector).forEach(function (a) {
        var segs = terminalHrefSegments(a.getAttribute("href"));
        if (!segs || segs.length < 2) {
          return;
        }
        var file = segs[segs.length - 1] + ".md";
        if (out.indexOf(file) === -1) {
          out.push(file);
        }
      });
      return out;
    }

    function terminalHarvestFiles(selector, emptyMsg) {
      var out = terminalHarvestFileLabels(selector);
      return out.length ? [out.join("  ")] : [emptyMsg];
    }

    // A harvested file view (`ls --featured`) as a clickable
    // ls-list result — each entry cats itself, same as a plain `ls`. Falls back
    // to a plain "(empty)" line when nothing matched.
    function terminalHarvestResult(input, selector, emptyMsg) {
      var labels = terminalHarvestFileLabels(selector);
      if (!labels.length) {
        return { echo: input, lines: [emptyMsg], action: null };
      }
      return {
        echo: input,
        lines: [],
        action: {
          type: "ls-list",
          tokens: labels.slice(0, 40).map(function (label) {
            return { label: label, cmd: terminalEntryCmd(label) };
          }),
          more: Math.max(0, labels.length - 40),
        },
      };
    }

    // The project meta (role / details / client) as "label: value" lines,
    // appended to a `cat` post so its front-matter details come along. Read from
    // the given root (the live #main, or a fetched post's doc). Details is a <dl>
    // of pairs → one line each ("year: 2016"); role and client are text
    // paragraphs → joined onto their section's line.
    function terminalInfoLinesFrom(root) {
      var out = [];
      (root || document)
        .querySelectorAll(".project-info__section")
        .forEach(function (sec) {
          var title = sec.querySelector(".project-info__title");
          if (!title) {
            return;
          }
          var label = title.textContent.trim().toLowerCase();
          var items = sec.querySelectorAll(".project-info__item");
          if (items.length) {
            items.forEach(function (item) {
              var dt = item.querySelector(".project-info__label");
              var dd = item.querySelector(".project-info__value");
              if (dt && dd) {
                out.push(
                  dt.textContent.trim().toLowerCase() +
                    ": " +
                    dd.textContent.trim().replace(/\s+/g, " ")
                );
              }
            });
            return;
          }
          var texts = sec.querySelectorAll(".project-info__text");
          if (texts.length) {
            var joined = Array.prototype.map
              .call(texts, function (t) {
                return t.textContent.trim().replace(/\s+/g, " ");
              })
              .filter(Boolean)
              .join(" — ");
            if (joined) {
              out.push(label + ": " + joined);
            }
          }
        });
      return out;
    }

    // Serialize an element's inline content back to markdown source: emphasis
    // keeps **/*, code keeps backticks, <br> becomes a newline, everything else
    // is its text. So a cat'd .md reads like the file you'd actually open.
    function terminalInlineMarkdown(node) {
      var out = "";
      var kids = node.childNodes;
      for (var i = 0; i < kids.length; i++) {
        var n = kids[i];
        if (n.nodeType === 3) {
          out += n.nodeValue;
        } else if (n.nodeType === 1) {
          var t = n.tagName.toLowerCase();
          if (t === "br") {
            out += "\n";
          } else if (t === "strong" || t === "b") {
            out += "**" + terminalInlineMarkdown(n).trim() + "**";
          } else if (t === "em" || t === "i") {
            out += "*" + terminalInlineMarkdown(n).trim() + "*";
          } else if (t === "code") {
            out += "`" + terminalInlineMarkdown(n).trim() + "`";
          } else if (t === "a") {
            // Keep links as markdown [text](href); the cat printer turns them
            // into clickable tokens (the printer needs the href to route them).
            var href = n.getAttribute("href") || "";
            var label = terminalInlineMarkdown(n).trim();
            out += href && label ? "[" + label + "](" + href + ")" : label;
          } else {
            out += terminalInlineMarkdown(n);
          }
        }
      }
      return out;
    }

    // Extract a cat'able rendering of a fetched post/page as an ordered list of
    // TOKENS — {text} for a prose line, {image, n, file, src, alt} for a figure
    // (a terminal can't paint an image, so it prints a clickable [image N] token
    // that opens the real picture). Walks the readable content root in document
    // order, skipping the chrome a `cat` shouldn't dump (breadcrumbs, tags,
    // related), then appends the project meta (role/details/client) so `cat`
    // shows the whole file — the info you can't otherwise reach once a post is a
    // file you never `cd` into. `base` resolves relative image URLs (the fetch
    // URL). Returns [] if there's no content root.
    function terminalExtractPostLines(doc, base, rootSelector) {
      var root = rootSelector
        ? doc.querySelector(rootSelector)
        : doc.querySelector("#main .content.post") ||
          doc.querySelector("#main .content.page") ||
          doc.querySelector("#main .content");
      if (!root) {
        return [];
      }
      var baseUrl;
      try {
        baseUrl = new URL(base || "/", window.location.href);
      } catch (e) {
        baseUrl = window.location.href;
      }
      // Related items and post tags have no wrapping container — they're
      // BEM-classed siblings inside .content.post — so match by class prefix.
      var SKIP =
        ".application-breadcrumb, .project-info, [class*='related-'], " +
        ".works-section, .works-post__tags, .post-tags-wrap, .lang-notice, nav";
      var tokens = [];
      var imageN = 0;
      var prevBlock = null;
      // A blank line separates blocks — the terminal's version of a margin, and
      // exactly how the blocks sit in the .md source. Consecutive list items and
      // consecutive images stay tight (no blank between them): a real list has
      // no gap between rows, and stacked [image N] tokens read as one plate.
      var blockBreak = function (kind) {
        var tight =
          (kind === "li" && prevBlock === "li") ||
          (kind === "figure" && prevBlock === "figure");
        if (tokens.length && !tight) {
          tokens.push({ text: "" });
        }
        prevBlock = kind;
      };
      var nodes = root.querySelectorAll(
        "h1, h2, h3, h4, p, blockquote, li, figure, img"
      );
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (el.closest(SKIP)) {
          continue;
        }
        var tag = el.tagName.toLowerCase();
        if (tag === "figure" || tag === "img") {
          // A bare img inside a figure is already counted by the figure.
          if (tag === "img" && el.closest("figure")) {
            continue;
          }
          blockBreak("figure");
          imageN += 1;
          var img = tag === "img" ? el : el.querySelector("img");
          var cap = el.querySelector && el.querySelector("figcaption");
          var label =
            (img && img.getAttribute("alt")) ||
            (cap ? cap.textContent.trim() : "");
          // Prefer the figure's data-lightbox (the full-res URL the on-page
          // lightbox uses); fall back to the <img> src. The filename (for the
          // `open <file>` echo) comes from the img src.
          var fileSrc = img ? img.getAttribute("src") || "" : "";
          var lbSrc =
            (tag === "figure" && el.getAttribute("data-lightbox")) || fileSrc;
          var file =
            (fileSrc || lbSrc || "")
              .split("?")[0]
              .split("/")
              .filter(Boolean)
              .pop() || "image-" + imageN;
          // Strip Hugo's image-processing suffix (foo_hu_<hash>.jpg → foo.jpg)
          // so the echoed `open <file>` reads like the source filename.
          file = file.replace(/_hu[_a-f0-9]*(\.[a-z0-9]+)$/i, "$1");
          var src = "";
          if (lbSrc) {
            try {
              src = new URL(lbSrc, baseUrl).href;
            } catch (e) {
              src = lbSrc;
            }
          }
          tokens.push({
            image: true,
            n: imageN,
            file: file,
            src: src,
            alt: label,
          });
          continue;
        }
        // A caption's text is carried by its figure token above; a paragraph
        // nested in a blockquote/li is carried by that container's text.
        if (
          el.closest("figure") ||
          (tag === "p" && el.closest("blockquote, li"))
        ) {
          continue;
        }
        // Map the block back to its markdown syntax: headings get their #'s,
        // blockquotes a >, list items a -. Inline emphasis/code is preserved by
        // the serializer; <br>-separated lines (e.g. the CV's one-<p> rows)
        // print one per line, the quote's > repeating on each.
        var headingLevel = { h1: 1, h2: 2, h3: 3, h4: 4 }[tag] || 0;
        var prefix = "";
        if (headingLevel) {
          prefix = new Array(headingLevel + 1).join("#") + " ";
        } else if (tag === "blockquote") {
          prefix = "> ";
        } else if (tag === "li") {
          prefix = "- ";
        }
        var parts = terminalInlineMarkdown(el)
          .split("\n")
          .map(function (part) {
            return part.replace(/[ \t]+/g, " ").trim();
          })
          .filter(Boolean);
        // An empty block (a blank <p> some layouts emit around image runs)
        // contributes no text — skip it entirely, BEFORE the separator, so it
        // can't leave a phantom blank line. That stray blank is what doubled the
        // gap before/after an image run when such a <p> bracketed it.
        if (!parts.length) {
          continue;
        }
        blockBreak(tag);
        parts.forEach(function (part) {
          tokens.push({ text: prefix + part });
        });
      }
      // Append the project meta as its own trailing block — cat shows the whole
      // file, so the role/details/client you set in front matter come along.
      var meta = terminalInfoLinesFrom(root);
      if (meta.length && tokens.length) {
        tokens.push({ text: "" });
      }
      meta.forEach(function (line) {
        tokens.push({ text: line });
      });
      return tokens;
    }

    // A directory's entry labels, kind-formatted (dir → `name/`, file →
    // `name.md`, action → `name`, exempt → `name*`). Shared by the text `ls`
    // and the clickable `ls` so the two can never list different things.
    function terminalLsEntryLabels(node, targetSegs, isCwd, showHidden) {
      var entries = Object.keys(node.children)
        .sort()
        .map(function (k) {
          return terminalEntryLabel(node.children[k].name);
        });
      if (isCwd) {
        // The page's own content (posts) are FILES: a post is a .md you `cat`,
        // not a directory you `cd` into — so it reads like real `ls` and the
        // prompt stays in the section when you open one.
        terminalPageContentSlugs(targetSegs).forEach(function (slug) {
          var entry = slug + ".md";
          if (
            entries.indexOf(entry) === -1 &&
            entries.indexOf(slug + "/") === -1
          ) {
            entries.push(entry);
          }
        });
      }
      if (showHidden) {
        entries = [".secret", ".config"].concat(entries);
      }
      return entries;
    }

    // The command a clicked `ls` entry runs, derived from its label's kind
    // suffix: `name/` → cd, `name.md` → cat, `name*` (exempt tool) → open,
    // `.hidden` → cat the pseudo-file, a bare word (action) → run it.
    function terminalEntryCmd(label) {
      var l = String(label || "");
      if (l.charAt(l.length - 1) === "/") {
        return "cd " + l.slice(0, -1);
      }
      // A post file, possibly a tag-term symlink (`slug.md@`) — cat the real .md.
      if (/\.md@?$/.test(l)) {
        return "cat " + l.replace(/@$/, "");
      }
      if (l.charAt(l.length - 1) === "*") {
        return "open " + l.slice(0, -1);
      }
      if (l.charAt(0) === ".") {
        return "cat " + l.slice(1);
      }
      return l;
    }

    function terminalLsOne(pathArg, showHidden) {
      // nav/ and settings/ are global menus, reachable from any cwd — match the
      // raw argument (~/nav, nav/, nav) before resolving relative to the cwd.
      var rawArg = String(pathArg || "")
        .replace(/^~\/?/, "")
        .replace(/^\/+|\/+$/g, "")
        .toLowerCase();
      if (rawArg === "nav") {
        return [terminalNavEntries().join("  ")];
      }
      if (rawArg === "settings") {
        return [
          terminalSettingsEntries().join("  "),
          "→ view/change with 'set' · share this look with 'share'",
        ];
      }
      // `ls featured` — the curated selection the home page prints — is a view,
      // harvested from the page's cards (so the header's `ls 'featured'` line is
      // reproducible by typing it).
      if (rawArg === "featured") {
        return terminalHarvestFiles(
          ".summary-card a[href], .article-card a[href]",
          "(nothing featured here)"
        );
      }
      var targetSegs = terminalResolveSegments(pathArg);
      var node = terminalNodeAt(targetSegs);
      if (!node) {
        return [
          tiText(
            "lsAccess",
            "ls: cannot access '%s': No such file or directory",
            pathArg
          ),
        ];
      }
      var isCwd = targetSegs.join("/") === terminalCwdSegments().join("/");
      var entries = terminalLsEntryLabels(node, targetSegs, isCwd, showHidden);
      if (!entries.length) {
        // A real page (has an href) that we're not currently on: its contents
        // live on that page, so point there instead of printing nothing.
        if (node.href && !isCwd && node.name !== "~") {
          return ["(cd " + node.name + " to list it)"];
        }
        return []; // genuinely empty — real `ls` prints nothing
      }
      var MAX = 40;
      var lines = [entries.slice(0, MAX).join("  ")];
      if (entries.length > MAX) {
        lines.push("… (" + (entries.length - MAX) + " more)");
      }
      return lines;
    }

    // `ls [path...]`: with 0 or 1 paths, list that directory. With several,
    // print a `path:`-headed block per directory, blank-line separated, like
    // real `ls`. Flags (e.g. -a) apply to every path.
    function terminalLsLines(paths, showHidden) {
      if (paths.length <= 1) {
        return terminalLsOne(paths[0] || "", showHidden);
      }
      var out = [];
      paths.forEach(function (path, i) {
        if (i > 0) {
          out.push("");
        }
        out.push(path + ":");
        terminalLsOne(path, showHidden).forEach(function (line) {
          out.push(line);
        });
      });
      return out;
    }

    // Recursive `ls -R`: per-directory blocks (a `path:` header, then that
    // directory's children), walked depth-first from the given node. This is
    // what the footer sitemap prints under its `ls -R ~/` prompt, so typing it
    // reproduces the map (the flat, single-level `ls` only ever shows one dir).
    function terminalLsRecursiveLines(node, path) {
      var out = [];
      function walk(n, p) {
        var keys = Object.keys(n.children).sort();
        out.push(p + ":");
        if (keys.length) {
          out.push(
            keys
              .map(function (k) {
                return n.children[k].name + "/";
              })
              .join("  ")
          );
        }
        out.push("");
        keys.forEach(function (k) {
          walk(n.children[k], p + "/" + n.children[k].name);
        });
      }
      walk(node, path);
      if (out.length && out[out.length - 1] === "") {
        out.pop();
      }
      return out;
    }

    // Whole-tree view for `tree`, drawn with ├──/└── connectors.
    function terminalTreeLines() {
      var root = terminalDirTree();
      var lines = ["~"];
      function walk(node, prefix) {
        var keys = Object.keys(node.children).sort();
        keys.forEach(function (key, i) {
          var last = i === keys.length - 1;
          lines.push(
            prefix +
              (last ? "└── " : "├── ") +
              terminalEntryLabel(node.children[key].name)
          );
          walk(node.children[key], prefix + (last ? "    " : "│   "));
        });
      }
      walk(root, "");
      return lines;
    }

    // Contact links harvested from the footer (mailto + LinkedIn), so the
    // `social`/`email`/`copy email` commands always match the real footer and
    // the current language.
    function terminalContactLinks() {
      var out = [];
      document
        .querySelectorAll(".footer-contact a[href]")
        .forEach(function (link) {
          var href = link.getAttribute("href");
          if (!href) {
            return;
          }
          var kind =
            href.indexOf("mailto:") === 0
              ? "email"
              : /linkedin/i.test(href)
              ? "linkedin"
              : "link";
          out.push({ kind: kind, href: href });
        });
      return out;
    }

    // A speech bubble + cow for `cowsay`, text clamped to the phone width.
    function terminalCowsay(text) {
      var msg = String(text || "").trim() || "moo";
      if (msg.length > 30) {
        msg = msg.slice(0, 29) + "…";
      }
      var bar = new Array(msg.length + 3).join("-");
      return [
        " " + bar,
        "< " + msg + " >",
        " " + bar,
        "        \\   ^__^",
        "         \\  (oo)\\_______",
        "            (__)\\       )\\/\\",
        "                ||----w |",
        "                ||     ||",
      ];
    }

    // Resolve a `cat` target to its pseudo-file lines, or null if there's no
    // such "file".
    // The footer-meta row (©, status, legal links) is the site's colophon — it
    // prints on the home tour under a `cat colophon` prompt, so typing it must
    // reproduce it. Harvest the live footer (status items → KEY=value like the
    // footer's own CSS; everything else → its visible text, sans the sr-only
    // labels). Falls back to the static colophon when no footer is in the DOM.
    function terminalColophonLines() {
      var list = document.querySelector(".footer-meta__list");
      if (!list) {
        return TERMINAL_FILES.colophon.slice();
      }
      var out = [];
      list.querySelectorAll(".footer-meta__item").forEach(function (item) {
        var cat = item.querySelector("[data-category]");
        if (cat) {
          out.push(
            cat.getAttribute("data-category").toUpperCase() +
              "=" +
              cat.textContent.replace(/\s+/g, " ").trim()
          );
          return;
        }
        var clone = item.cloneNode(true);
        clone
          .querySelectorAll(".sr-only, .footer-meta__label")
          .forEach(function (n) {
            n.parentNode.removeChild(n);
          });
        var text = clone.textContent.replace(/\s+/g, " ").trim();
        if (text) {
          out.push(text);
        }
      });
      return out.length ? out : TERMINAL_FILES.colophon.slice();
    }

    // The newsletter blurb the footer prints under `cat 'newsletter.txt'` —
    // harvested from the live footer so typing it reproduces what's shown.
    function terminalNewsletterLines() {
      var desc = document.querySelector(".footer-newsletter__description");
      if (desc) {
        var text = desc.textContent.replace(/\s+/g, " ").trim();
        if (text) {
          return [text, "", "subscribe with: subscribe"];
        }
      }
      return ["a short, occasional newsletter.", "subscribe with: subscribe"];
    }

    // welcome.txt is the home intro (the hero, in prose). Read the localized
    // copy Hugo emits into a hidden element so the boot's `cat welcome.txt`
    // prints it in the visitor's language, not the hardcoded English fallback.
    function terminalWelcomeLines() {
      var el = document.querySelector('[data-js="terminal-welcome"]');
      if (el) {
        var lines = el.textContent
          .replace(/^\n+|\n+$/g, "")
          .split("\n")
          .map(function (line) {
            return line.replace(/\s+$/, "");
          });
        if (lines.length && lines.join("").trim()) {
          return lines;
        }
      }
      return TERMINAL_FILES.welcome.slice();
    }

    function terminalFile(name) {
      var key = String(name || "")
        .toLowerCase()
        .replace(/^\.+/, "")
        .replace(/\.(txt|md)$/, "");
      if (key === "secrets") {
        key = "secret";
      }
      // colophon, newsletter and welcome are live blocks, reproduced so typing
      // the `cat …` the chrome prints shows exactly what's on the page.
      if (key === "colophon") {
        return terminalColophonLines();
      }
      if (key === "newsletter") {
        return terminalNewsletterLines();
      }
      if (key === "welcome") {
        return terminalWelcomeLines();
      }
      return TERMINAL_FILES[key] || null;
    }

    // One-line man description, pulled from the help table so the two never
    // drift apart. Matches the first word of each "  cmd   desc" help row.
    function terminalManPage(topic) {
      var want = String(topic || "").toLowerCase();
      var found = null;
      TERMINAL_HELP.forEach(function (row) {
        if (found) {
          return;
        }
        var trimmed = row.trim();
        var word = trimmed.split(/\s+/)[0];
        if (word === want) {
          found = trimmed.slice(word.length).trim() || null;
        }
      });
      return found;
    }

    // Resolved hex/colour values for a few key palette tokens, for `colour`.
    function terminalColourLines() {
      var styles = window.getComputedStyle(document.documentElement);
      var swatches = [
        ["paper", "--surface-page"],
        ["ink", "--surface-ink-strong"],
        ["accent", "--surface-accent"],
      ];
      var lines = ["palette: " + paletteLabel()];
      swatches.forEach(function (pair) {
        var value = (styles.getPropertyValue(pair[1]) || "").trim();
        lines.push("  " + pair[0] + "  " + (value || "—"));
      });
      return lines;
    }

    // The home link the terminal prompt already points at (falls back to root).
    function terminalHomeUrl() {
      var host = document.querySelector(".terminal-prompt__host[href]");
      return (host && host.getAttribute("href")) || "/";
    }

    // Map the nav's pages to `cd` targets, keyed by both URL slug and link text
    // (so `cd writing` and `cd essays` both resolve if that's the label). Built
    // once — the nav is static for the page's lifetime.
    var terminalNavTargetsCache = null;
    function terminalNavTargets() {
      if (terminalNavTargetsCache) {
        return terminalNavTargetsCache;
      }
      var map = {};
      // Exclude the statusbar quick-toggles (:not(.terminal-quick)): the
      // language toggle is an <a> to the *other* language's URL, whose slug
      // collides with the current page's and would overwrite the real target.
      var links = document.querySelectorAll(
        ".top-menu__nav a[href]:not(.terminal-quick), .top-menu__link[href]"
      );
      links.forEach(function (link) {
        var href = link.getAttribute("href");
        if (!href || href.charAt(0) === "#") {
          return;
        }
        var path = href.replace(/[?#].*$/, "").replace(/\/+$/, "");
        var slug = path.split("/").filter(Boolean).pop();
        if (slug) {
          map[slug.toLowerCase()] = href;
        }
        var text = (link.textContent || "").trim().toLowerCase();
        if (text) {
          map[text] = href;
        }
      });
      terminalNavTargetsCache = map;
      return map;
    }

    // A typed `cd <post>` should reach the same pages `ls` lists — the content
    // cards (works/writing posts) the nav tree can't know about. Resolve the
    // path to absolute segments (relative to cwd), then match a content-card
    // link by its full segments, so cd and ls agree on what exists.
    // The slug of the page currently loaded (last path segment, language prefix
    // stripped) — so the boot transcript's `cat <slug>.md` on a post/about reads
    // the live #main instead of re-fetching the page it's already on.
    function terminalCurrentPageSlug() {
      var path = window.location.pathname.replace(/[?#].*$/, "");
      var segs = path.split("/").filter(Boolean);
      var lang = (
        document.documentElement.getAttribute("lang") || ""
      ).toLowerCase();
      if (segs.length && segs[0].toLowerCase() === lang) {
        segs.shift();
      }
      if (!segs.length) {
        return "";
      }
      // Decode so a localized slug matches the decoded names cat/ls now use
      // (see terminalHrefSegments) — else `cat <slug>.md` on the page you're on
      // wouldn't recognise itself.
      var slug = segs[segs.length - 1];
      try {
        slug = decodeURIComponent(slug);
      } catch (e) {
        /* malformed escape — keep the raw segment */
      }
      return slug.toLowerCase();
    }

    function terminalContentTargetHref(dest) {
      var wanted = terminalResolveSegments(dest);
      if (!wanted.length) {
        return null;
      }
      var wantedKey = wanted.join("/");
      // A bare slug (length 1) — e.g. a featured card the home page lists as
      // `slug.md`, whose real home is `/works/slug/` — matches a card by its
      // last path segment: the visitor named the file, not its section path. A
      // qualified path (~/works/slug) still matches in full.
      var bare = wanted.length === 1;
      var match = null;
      document
        .querySelectorAll(".article-card a[href], .summary-card a[href]")
        .forEach(function (link) {
          if (match) {
            return;
          }
          var segs = terminalHrefSegments(link.getAttribute("href"));
          if (!segs || !segs.length) {
            return;
          }
          var hit = bare
            ? segs[segs.length - 1] === wantedKey
            : segs.join("/") === wantedKey;
          if (hit) {
            match = link.getAttribute("href");
          }
        });
      return match;
    }

    function resolveCdTarget(dest) {
      var key = String(dest || "")
        .replace(/^\/+|\/+$/g, "")
        .toLowerCase();
      if (!key) {
        return terminalHomeUrl();
      }
      if (key === "home" || key === "~") {
        return terminalHomeUrl();
      }
      var targets = terminalNavTargets();
      // Nav/footer directories first; then the current page's own content
      // cards (so `cd` reaches any post `ls` just listed); then the manifest URL
      // (so a footer-only section like legal resolves even without a nav link).
      return (
        targets[key] ||
        terminalContentTargetHref(dest) ||
        terminalManifestUrl(key) ||
        null
      );
    }

    // The URL for a cwd's segments — the section's nav href as the base, then
    // the deeper path appended (so ~/works/tags/experimental → /works/tags/
    // experimental/). Language prefix rides along in the base. Used to fetch a
    // nested directory the append-only prompt sits in but hasn't loaded.
    function terminalCwdUrl(segs) {
      if (!segs || !segs.length) {
        return terminalHomeUrl();
      }
      var base = resolveCdTarget(segs[0]);
      if (!base) {
        return null;
      }
      return (
        base.replace(/\/+$/, "") +
        (segs.length > 1 ? "/" + segs.slice(1).join("/") : "") +
        "/"
      );
    }

    // Languages from the settings language selector, keyed by code. The current
    // language's radio has no data-language-href; every other one carries the
    // translated page's URL (or a homepage fallback).
    function terminalLanguages() {
      var map = {};
      document
        .querySelectorAll(".language-option input[data-language-code]")
        .forEach(function (input) {
          var code = (
            input.getAttribute("data-language-code") || ""
          ).toLowerCase();
          if (!code) {
            return;
          }
          map[code] = {
            href: input.getAttribute("data-language-href"),
            name: (
              input.getAttribute("data-language-name") || ""
            ).toLowerCase(),
          };
        });
      return map;
    }

    function currentLang() {
      return (document.documentElement.getAttribute("lang") || "en")
        .slice(0, 2)
        .toLowerCase();
    }

    var LANG_ALIASES = {
      en: "en",
      english: "en",
      sv: "sv",
      svenska: "sv",
      swedish: "sv",
    };

    // Returns { echo, lines, action }. `echo` is the command as typed (printed
    // with the prompt), `lines` are output rows, `action` (or null) is applied
    // separately. Kept free of DOM mutation so it is straightforward to test.
    // Split a command line into words, honouring single/double quotes so a
    // quoted filename with spaces (or one the chrome prints as `cat 'x.txt'`)
    // parses as one argument — surrounding quotes stripped, like a real shell.
    function terminalTokenize(input) {
      var raw = input.match(/'[^']*'|"[^"]*"|\S+/g) || [];
      return raw.map(function (tok) {
        var q = tok.charAt(0);
        if ((q === "'" || q === '"') && tok.charAt(tok.length - 1) === q) {
          return tok.slice(1, -1);
        }
        return tok;
      });
    }

    function runTerminalCommand(raw) {
      var input = String(raw === null || raw === undefined ? "" : raw).trim();
      if (!input) {
        return { echo: "", lines: [], action: null };
      }
      var parts = terminalTokenize(input);
      var cmd = parts[0].toLowerCase();
      var args = parts.slice(1);
      var rest = input.slice(parts[0].length).trim();

      switch (cmd) {
        case "help":
        case "?":
          return { echo: input, lines: TERMINAL_HELP.slice(), action: null };
        case "exit":
        case "quit":
        case "logout":
          return { echo: input, lines: [], action: { type: "exit" } };
        case "clear":
          return { echo: "", lines: [], action: { type: "clear" } };
        case "dark":
        case "light":
        case "system":
          return {
            echo: input,
            lines: ["mode → " + cmd],
            action: { type: "mode", mode: cmd },
          };
        case "pantone": {
          var sub = (args[0] || "").toLowerCase();
          if (sub === "off" || sub === "stop") {
            return {
              echo: input,
              lines: ["pantone: colour-of-the-year off"],
              action: { type: "pantone", state: "off" },
            };
          }
          if (sub === "on" || sub === "start") {
            return {
              echo: input,
              lines: [
                "pantone: colour-of-the-year on (" + getCurrentCotyYear() + ")",
              ],
              action: { type: "pantone", state: "on" },
            };
          }
          if (sub === "next" || sub === "prev" || sub === "previous") {
            var step = sub === "next" ? 1 : -1;
            return {
              echo: input,
              lines: ["pantone: " + (step > 0 ? "next" : "previous") + " year"],
              action: { type: "pantone", state: "step", step: step },
            };
          }
          if (/^\d{4}$/.test(sub)) {
            var wanted = parseInt(sub, 10);
            var actions = getCotyActions();
            var entries =
              actions && typeof actions.getEntries === "function"
                ? actions.getEntries()
                : null;
            if (
              entries &&
              entries.length &&
              !entries.some(function (entry) {
                return Number(entry.year) === wanted;
              })
            ) {
              var years = entries
                .map(function (entry) {
                  return entry.year;
                })
                .join(", ");
              return {
                echo: input,
                lines: ["pantone: no year " + wanted + " — try: " + years],
                action: null,
              };
            }
            return {
              echo: input,
              lines: ["pantone: year → " + wanted],
              action: { type: "pantone", state: "year", year: wanted },
            };
          }
          if (sub) {
            return {
              echo: input,
              lines: [
                "pantone: unknown option '" +
                  sub +
                  "' — try on, off, next, prev, or a year",
              ],
              action: null,
            };
          }
          return {
            echo: input,
            lines: ["pantone: colour-of-the-year toggled"],
            action: { type: "pantone", state: "toggle" },
          };
        }
        case "grid": {
          var gridState = onOffState(args[0]);
          return {
            echo: input,
            lines: ["grid: " + gridState],
            action: { type: "grid", state: gridState },
          };
        }
        case "grain":
        case "blend":
        case "motion": {
          var effectState = onOffState(args[0]);
          return {
            echo: input,
            lines: [cmd + ": " + effectState],
            action: { type: "effect", effect: cmd, state: effectState },
          };
        }
        case "cd": {
          var dest = args[0] || "~";
          var destKey = dest.replace(/\/+$/, "").toLowerCase();
          if (
            dest === "~" ||
            dest === "/" ||
            dest === ".." ||
            destKey === "home"
          ) {
            // Append-only: cd just moves you (changes the prompt). It doesn't
            // load a page or print anything — like a real shell. You `ls`/`cat`
            // to see things, and nothing above the prompt ever changes.
            return {
              echo: input,
              lines: [],
              action: { type: "chdir", cwd: "~" },
            };
          }
          // nav/ and settings/ are menus, not places — list them, don't enter.
          if (destKey === "nav" || destKey === "settings") {
            return {
              echo: input,
              lines: [
                "cd: " +
                  destKey +
                  " is a menu, not a directory — try: ls " +
                  destKey +
                  "/",
              ],
              action: null,
            };
          }
          // A path into a section's tags/ hierarchy. `<section>/tags` (the
          // index) and `<section>/tags/<tag>` (a term) are directories you cd
          // into; a post reached through a tag (`…/tags/<tag>/<slug>`) is a file
          // whose real home is the section — cat it.
          var cdSegs = terminalResolveSegments(dest);
          if (
            cdSegs.length >= 2 &&
            cdSegs[1] === "tags" &&
            terminalNodeKind(cdSegs[0]) === "dir"
          ) {
            if (cdSegs.length <= 3) {
              return {
                echo: input,
                lines: [],
                action: { type: "chdir", cwd: "~/" + cdSegs.join("/") },
              };
            }
            var cdTagSlug = cdSegs[cdSegs.length - 1].replace(
              /\.(md|txt)$/i,
              ""
            );
            return {
              echo: input,
              lines: [
                "cd: not a directory: " +
                  dest +
                  " — try: cat " +
                  cdTagSlug +
                  ".md",
              ],
              action: null,
            };
          }
          // A known top-level thing — classify by its manifest kind. Only a
          // `dir` (a section) is somewhere you cd into; a file/action/tool is
          // reached by cat/run/open, so point there instead of pretending.
          var navHref = terminalNavTargets()[destKey];
          var inManifest = Object.prototype.hasOwnProperty.call(
            terminalManifest(),
            destKey
          );
          if (navHref || inManifest) {
            var destKind = terminalNodeKind(destKey);
            if (destKind === "file") {
              return {
                echo: input,
                lines: [
                  "cd: not a directory: " +
                    dest +
                    " — try: cat " +
                    destKey +
                    ".md",
                ],
                action: null,
              };
            }
            if (destKind === "action") {
              return {
                echo: input,
                lines: [
                  "cd: " +
                    destKey +
                    " is a command, not a directory — just run: " +
                    destKey,
                ],
                action: null,
              };
            }
            if (destKind === "exempt") {
              return {
                echo: input,
                lines: [
                  "cd: " +
                    destKey +
                    " is a visual tool — open it: open " +
                    destKey,
                ],
                action: null,
              };
            }
            // A directory — cd moves you into it (prompt only).
            return {
              echo: input,
              lines: [],
              action: {
                type: "chdir",
                cwd: hrefToCwd(navHref || "/" + destKey),
              },
            };
          }
          // A post is a file — you cat it, you don't cd into it.
          var postKey = destKey.replace(/\.(md|txt)$/i, "");
          if (terminalContentTargetHref(postKey)) {
            return {
              echo: input,
              lines: [
                "cd: not a directory: " +
                  dest +
                  " — try: cat " +
                  postKey +
                  ".md",
              ],
              action: null,
            };
          }
          return {
            echo: input,
            lines: ["cd: no such file or directory: " + dest],
            action: null,
          };
        }
        case "lang":
        case "language": {
          var languages = terminalLanguages();
          var available = Object.keys(languages);
          var here = currentLang();
          var wanted = (args[0] || "").toLowerCase();
          if (!wanted) {
            return {
              echo: input,
              lines: [
                "language: " + here,
                "available: " + (available.join(", ") || here),
              ],
              action: null,
            };
          }
          var langTarget = LANG_ALIASES[wanted] || wanted;
          if (!languages[langTarget]) {
            return {
              echo: input,
              lines: [
                "lang: unknown language '" +
                  wanted +
                  "' — try: " +
                  (available.join(", ") || here),
              ],
              action: null,
            };
          }
          if (langTarget === here) {
            return {
              echo: input,
              lines: ["language: already " + here],
              action: null,
            };
          }
          if (!languages[langTarget].href) {
            return {
              echo: input,
              lines: ["lang: " + langTarget + " unavailable for this page"],
              action: null,
            };
          }
          // Switch language by loading the translated page. cd:false so the
          // navigation doesn't print a spurious `cd` echo (same directory,
          // different language).
          return {
            echo: input,
            lines: [],
            action: {
              type: "navigate",
              url: languages[langTarget].href,
              cd: false,
            },
          };
        }
        case "ai":
          // The free-text assistant lives in terminal-ai.js; applyTerminalAction
          // starts it (and reports if the module didn't load).
          return {
            echo: input,
            lines: [],
            action: { type: "ai-start" },
          };
        case "report":
          // Flag the assistant's last answer (typed `report`, or the [report]
          // chip) so a bad reply becomes a GitHub issue to improve the intents.
          // The assistant owns the last exchange, so hand it the optional note.
          return {
            echo: input,
            lines: [],
            action: { type: "ai-report", note: args.join(" ") },
          };
        case "contact":
          return {
            echo: input,
            lines: [],
            action: { type: "flow", flow: "contact" },
          };
        case "subscribe":
          return {
            echo: input,
            lines: [],
            action: { type: "flow", flow: "subscribe" },
          };
        case "echo":
          return { echo: input, lines: [rest], action: null };
        case "whoami":
          return {
            echo: input,
            lines: tiLines(TI18N.ui && TI18N.ui.whoami, [
              "visitor",
              "(not logged in — but welcome anyway)",
            ]),
            action: null,
          };
        case "date":
          return {
            echo: input,
            lines: [new Date().toString()],
            action: null,
          };
        case "pwd":
          return {
            echo: input,
            lines: [(window.location && window.location.pathname) || "/"],
            action: null,
          };
        case "neofetch":
        case "screenfetch":
          return {
            echo: input,
            lines: neofetchLines(),
            action: { type: "art" },
          };
        case "sudo":
          if (args.join(" ").toLowerCase() === "make me a sandwich") {
            return { echo: input, lines: ["okay. 🥪"], action: null };
          }
          return {
            echo: input,
            lines: [
              "permission denied: nice try 😏",
              "(this incident has been reported)",
            ],
            action: null,
          };
        case "coffee":
        case "brew":
          return {
            echo: input,
            lines: ["HTTP 418 — I'm a teapot ☕"],
            action: null,
          };
        case "make":
          if ((args[0] || "").toLowerCase() === "coffee") {
            return {
              echo: input,
              lines: ["HTTP 418 — I'm a teapot ☕"],
              action: null,
            };
          }
          if (args.join(" ").toLowerCase() === "me a sandwich") {
            return {
              echo: input,
              lines: ["what? make it yourself."],
              action: null,
            };
          }
          return {
            echo: input,
            lines: [
              "make: *** no rule to make target '" + (args[0] || "") + "'.",
            ],
            action: null,
          };
        case "ls":
        case "dir": {
          // Long filter flags (--featured/--images) are separate lenses;
          // short flags (-a) reveal hidden entries. Keep them apart so "--featured"
          // (which contains an "a") isn't misread as -a.
          var lsLong = args.filter(function (a) {
            return a.indexOf("--") === 0;
          });
          var lsShowHidden = args.some(function (a) {
            return a.charAt(0) === "-" && a.charAt(1) !== "-" && /a/.test(a);
          });
          var lsRecursive = args.some(function (a) {
            return a.charAt(0) === "-" && a.charAt(1) !== "-" && /R/.test(a);
          });
          var lsPaths = args.filter(function (a) {
            return a.charAt(0) !== "-";
          });
          // `ls -R` walks the whole tree from the given dir (default ~), the
          // recursive listing the footer sitemap is labelled with.
          if (lsRecursive) {
            var lsRSegs = lsPaths.length
              ? terminalResolveSegments(lsPaths[0])
              : [];
            var lsRNode = terminalNodeAt(lsRSegs);
            if (!lsRNode) {
              return {
                echo: input,
                lines: [
                  tiText(
                    "lsAccess",
                    "ls: cannot access '%s': No such file or directory",
                    lsPaths[0]
                  ),
                ],
                action: null,
              };
            }
            return {
              echo: input,
              lines: terminalLsRecursiveLines(
                lsRNode,
                lsRSegs.length ? "~/" + lsRSegs.join("/") : "~"
              ),
              action: null,
              paged: { preview: TERMINAL_PAGE_SIZE },
            };
          }
          if (lsLong.indexOf("--featured") !== -1) {
            return terminalHarvestResult(
              input,
              ".summary-card a[href], .article-card a[href]",
              "(nothing featured here)"
            );
          }
          if (lsLong.indexOf("--images") !== -1) {
            var figs = document.querySelectorAll(
              ".content figure[data-lightbox]"
            ).length;
            return {
              echo: input,
              lines: [figs ? figs + " images" : "(no images here)"],
              action: null,
            };
          }
          // Append-only: listing the section (or a nested tags dir) you've cd'd
          // into but haven't loaded (cd only moved the prompt) — fetch it and
          // print below, without touching anything above.
          if (!lsPaths.length && !lsLong.length) {
            var lsSegs = terminalCwdSegments();
            // You've cd'd away from the loaded page (live cwd ≠ page cwd), so the
            // current DOM can't list here → fetch that path and print it below.
            if (
              lsSegs.length &&
              lsSegs.join("/") !== terminalPageCwdSegments().join("/")
            ) {
              var lsUrl = terminalCwdUrl(lsSegs);
              if (lsUrl) {
                return {
                  echo: input,
                  lines: [],
                  action: {
                    type: "remote-ls",
                    url: lsUrl,
                    cwd: "~/" + lsSegs.join("/"),
                  },
                };
              }
            }
          }
          // A plain single-directory listing renders as clickable entries (dir
          // → cd, file → cat, tool → open). Scoped to this common case; the
          // special views (nav/settings/featured), multi-path blocks, hidden and
          // recursive listings stay as text above.
          if (lsPaths.length <= 1 && !lsLong.length && !lsShowHidden) {
            var lsTokRaw = String(lsPaths[0] || "")
              .replace(/^~\/?/, "")
              .replace(/^\/+|\/+$/g, "")
              .toLowerCase();
            if (
              lsTokRaw !== "nav" &&
              lsTokRaw !== "settings" &&
              lsTokRaw !== "featured"
            ) {
              var lsTokSegs = terminalResolveSegments(lsPaths[0] || "");
              var lsTokNode = terminalNodeAt(lsTokSegs);
              if (lsTokNode) {
                var lsTokLabels = terminalLsEntryLabels(
                  lsTokNode,
                  lsTokSegs,
                  lsTokSegs.join("/") === terminalCwdSegments().join("/"),
                  false
                );
                if (lsTokLabels.length) {
                  return {
                    echo: input,
                    lines: [],
                    action: {
                      type: "ls-list",
                      tokens: lsTokLabels.slice(0, 40).map(function (label) {
                        return { label: label, cmd: terminalEntryCmd(label) };
                      }),
                      more: Math.max(0, lsTokLabels.length - 40),
                    },
                  };
                }
              }
            }
          }
          return {
            echo: input,
            lines: terminalLsLines(lsPaths, lsShowHidden),
            action: null,
          };
        }
        case "cv": {
          // A shortcut that prints just the résumé section of the about page —
          // "part of about" (it's inside about.md), but reachable on its own.
          // Append-only, like cat: fetch about and print only its .about-cv.
          var cvUrl = resolveCdTarget("about");
          if (!cvUrl) {
            return {
              echo: input,
              lines: ["cv: about page not found"],
              action: null,
            };
          }
          return {
            echo: input,
            lines: [],
            action: {
              type: "remote-cat",
              url: cvUrl,
              name: "cv.md",
              root: ".about-cv",
            },
          };
        }
        case "tree":
          return {
            echo: input,
            lines: terminalTreeLines(),
            action: null,
            paged: { preview: TERMINAL_PAGE_SIZE },
          };
        case "cat": {
          if (!args.length) {
            return {
              echo: input,
              lines: ["usage: cat <file> — try 'cat readme'"],
              action: null,
            };
          }
          // A trailing @ is the symlink marker `ls` prints in a tag dir — not
          // part of the name, so drop it before resolving.
          var catName = args[0]
            .replace(/@$/, "")
            .replace(/\.(md|txt)$/i, "")
            .toLowerCase();
          // An explicit `.txt` is a text blurb (readme, the newsletter/colophon
          // footer blocks) — resolve it as a pseudo-file BEFORE a same-named
          // page (e.g. `cat newsletter.txt` is the blurb; `cat newsletter.md`
          // is the page). Bare/`.md` names fall through to the page resolver.
          if (/\.txt$/i.test(args[0])) {
            var txtLines = terminalFile(args[0]);
            if (txtLines) {
              return { echo: input, lines: txtLines.slice(), action: null };
            }
          }
          // A section is a directory — you ls it, you don't cat it.
          if (
            terminalNodeKind(catName) === "dir" &&
            terminalManifest()[catName]
          ) {
            return {
              echo: input,
              lines: [
                tiText(
                  "catIsDir",
                  "cat: %s: Is a directory — try: ls %s/",
                  catName,
                  catName
                ),
              ],
              action: null,
            };
          }
          // The page you're already on: read its #main straight from the live
          // DOM rather than re-fetching it (the boot transcript's `cat <slug>.md`
          // on a post/about). Synchronous, so the content is there at once — no
          // blank flash while a fetch round-trips.
          if (
            catName &&
            catName === terminalCurrentPageSlug() &&
            document.querySelector("#main .content.post, #main .content.page")
          ) {
            return {
              echo: input,
              lines: [],
              action: { type: "cat-local", name: args[0] },
            };
          }
          // Real page first: a content post, or a readable page (about.md,
          // newsletter.md). Append-only: cat PRINTS the file into the buffer
          // (fetch + extract text) — nothing above changes. (`open` still loads
          // the real page, as the escape hatch.)
          var catHref =
            terminalContentTargetHref(catName) || resolveCdTarget(catName);
          if (catHref) {
            return {
              echo: input,
              lines: [],
              action: { type: "remote-cat", url: catHref, name: args[0] },
            };
          }
          // Otherwise a pseudo-file (readme, colophon, secret, config, …).
          var fileLines = terminalFile(args[0]);
          if (fileLines) {
            return { echo: input, lines: fileLines.slice(), action: null };
          }
          // cwd-relative fallback: a file in a section you've cd'd into but not
          // loaded — its card lives on the remote section page, not this DOM, so
          // the DOM lookups above miss it (the same file `ls` prints by fetching
          // the section). Build the URL from the section base + slug, the way
          // remote-ls does, and let remote-cat fetch it (a 404 → No such file).
          var catSegs = terminalResolveSegments(catName);
          if (catSegs.length >= 2) {
            var catBase = resolveCdTarget(catSegs[0]);
            if (catBase) {
              // A post reached through a tag path is a symlink — its real file
              // lives in the section, so cat resolves to <section>/<slug>, not
              // the literal .../tags/<tag>/<slug> (which 404s).
              var catRest =
                catSegs.indexOf("tags") !== -1
                  ? [catSegs[catSegs.length - 1]]
                  : catSegs.slice(1);
              return {
                echo: input,
                lines: [],
                action: {
                  type: "remote-cat",
                  url:
                    catBase.replace(/\/+$/, "") + "/" + catRest.join("/") + "/",
                  name: args[0],
                },
              };
            }
          }
          return {
            echo: input,
            lines: [
              tiText(
                "catMissing",
                "cat: %s: No such file or directory",
                args[0]
              ),
            ],
            action: null,
          };
        }
        case "open": {
          if (!args.length) {
            return {
              echo: input,
              lines: ["usage: open <name> — a section or a post"],
              action: null,
            };
          }
          // An absolute URL (an external link clicked in a cat'd page) opens
          // directly — a new tab for http(s), the handler app for mailto:/tel:.
          if (/^(https?:|mailto:|tel:)/i.test(args[0])) {
            return {
              echo: input,
              lines: [],
              action: { type: "open-external", url: args[0] },
            };
          }
          // A general "go there": resolves a section OR a post (resolveCdTarget
          // already falls through to content files) and navigates.
          var openName = args[0].replace(/\/$/, "").replace(/\.(md|txt)$/i, "");
          var openHref = resolveCdTarget(openName);
          if (!openHref) {
            return {
              echo: input,
              lines: ["open: no such file or directory: " + args[0]],
              action: null,
            };
          }
          return {
            echo: input,
            lines: [],
            action: { type: "navigate", url: openHref },
          };
        }
        case "man": {
          var topic = (args[0] || "").toLowerCase();
          if (!topic) {
            return {
              echo: input,
              lines: ["what manual page do you want?", "try: man help"],
              action: null,
            };
          }
          var page = terminalManPage(topic);
          if (!page) {
            return {
              echo: input,
              lines: ["No manual entry for " + topic],
              action: null,
            };
          }
          return { echo: input, lines: [topic + " — " + page], action: null };
        }
        case "uname":
          if (args.indexOf("-a") !== -1) {
            return {
              echo: input,
              lines: [
                "tor-sh 1.0 " +
                  terminalHost() +
                  " terminal " +
                  resolvedModeLabel() +
                  " " +
                  currentLang(),
              ],
              action: null,
            };
          }
          return { echo: input, lines: ["tor-sh"], action: null };
        case "colour":
        case "color":
          return { echo: input, lines: terminalColourLines(), action: null };
        case "fortune": {
          var pick = Math.floor(Math.random() * TERMINAL_FORTUNES.length);
          return {
            echo: input,
            lines: [TERMINAL_FORTUNES[pick]],
            action: null,
          };
        }
        case "history":
          return {
            echo: input,
            lines: historyLines(),
            action: null,
            paged: { preview: TERMINAL_PAGE_SIZE },
          };
        case "uptime":
          return { echo: input, lines: [uptimeLine()], action: null };
        case "top":
        case "htop":
          return {
            echo: input,
            lines: [
              "  PID  CPU  MEM  CMD",
              "    1   0%   ok  tor-sh",
              "   42   0%   ok  curiosity",
              "  418   0%    —  coffee (defunct)",
            ],
            action: null,
          };
        case "vim":
        case "vi":
          return {
            echo: input,
            lines: [
              "entering vim… only kidding.",
              "to leave, type 'exit' — you're safe here.",
            ],
            action: null,
          };
        case "nano":
          return {
            echo: input,
            lines: ["nano: nothing to edit here.", "type 'exit' to leave."],
            action: null,
          };
        case "emacs":
          return {
            echo: input,
            lines: [
              "emacs: a fine OS, missing an editor.",
              "type 'exit' to leave.",
            ],
            action: null,
          };
        case ":q":
        case ":q!":
        case ":wq":
        case ":wq!":
        case ":x":
          return {
            echo: input,
            lines: ["(you can just type 'exit')"],
            action: { type: "exit" },
          };
        case "rm": {
          var rmArgs = args.join(" ");
          if (
            /-[a-z]*r/i.test(rmArgs) &&
            /(^|\s)(\/|~|\*|\/\*|\.)(\s|$)/.test(rmArgs)
          ) {
            return {
              echo: input,
              lines: ["nice try — it's all in git 😏"],
              action: null,
            };
          }
          if (!args.length) {
            return {
              echo: input,
              lines: ["rm: missing operand"],
              action: null,
            };
          }
          return {
            echo: input,
            lines: [
              "rm: cannot remove '" +
                args[args.length - 1] +
                "': read-only site",
            ],
            action: null,
          };
        }
        case "git": {
          var gitSub = (args[0] || "").toLowerCase();
          var gitReplies = {
            blame: ["git blame: you — last touched just now 😄"],
            commit: ["nothing to commit, working tree clean ✨"],
            push: ["Everything up-to-date."],
            pull: ["Already up to date."],
            status: [
              "On branch main.",
              "nothing to commit, working tree clean",
            ],
            log: ["read the real log: type 'cd writing'"],
          };
          if (!gitSub) {
            return {
              echo: input,
              lines: ["usage: git <command> — try 'git status'"],
              action: null,
            };
          }
          if (gitReplies[gitSub]) {
            return {
              echo: input,
              lines: gitReplies[gitSub].slice(),
              action: null,
            };
          }
          return {
            echo: input,
            lines: ["git: '" + gitSub + "' is not a git command."],
            action: null,
          };
        }
        case "npm":
        case "yarn":
        case "pnpm": {
          var pkgSub = (args[0] || "").toLowerCase();
          if (pkgSub === "install" || pkgSub === "i" || pkgSub === "add") {
            // Print the "working" line now, then reveal the punchline a beat
            // later so it reads like a job that ran before it fell over.
            return {
              echo: input,
              lines: ["resolving 4271 dependencies…"],
              action: {
                type: "defer",
                delay: 900,
                lines: ["done. (kidding — it's vanilla JS)"],
              },
            };
          }
          return {
            echo: input,
            lines: [cmd + ": this site ships no node_modules."],
            action: null,
          };
        }
        case "hello":
        case "hi":
        case "hey":
          return {
            echo: input,
            lines: ["hey 👋", "type 'help' to see what I can do."],
            action: null,
          };
        case "konami":
          return {
            echo: input,
            lines: ["konami: party mode 🌈"],
            action: { type: "konami" },
          };
        // ---- Group A: visitor utilities ----------------------------------
        case "hire":
          return {
            echo: input,
            lines: ["let's build something. starting a message…"],
            action: { type: "flow", flow: "contact" },
          };
        case "social":
        case "links": {
          var contacts = terminalContactLinks();
          if (!contacts.length) {
            return {
              echo: input,
              lines: ["no links here — try 'contact'"],
              action: null,
            };
          }
          return {
            echo: input,
            lines: contacts.map(function (c) {
              return c.kind + ": " + c.href.replace(/^mailto:/, "");
            }),
            action: null,
          };
        }
        case "email": {
          var mail = terminalContactLinks().filter(function (c) {
            return c.kind === "email";
          })[0];
          return {
            echo: input,
            lines: [
              mail
                ? mail.href.replace(/^mailto:/, "")
                : "no email on file — try 'contact'",
            ],
            action: null,
          };
        }
        case "resume":
        case "cv": {
          var aboutUrl = resolveCdTarget("about");
          if (!aboutUrl) {
            return {
              echo: input,
              lines: ["resume: about page not found"],
              action: null,
            };
          }
          return {
            echo: input,
            lines: ["opening about → CV…"],
            action: { type: "navigate", url: aboutUrl },
          };
        }
        // ---- Group B: builder tools --------------------------------------
        case "layout":
        case "theme": {
          var wantedLayout = (args[0] || "").toLowerCase();
          var nowLayout =
            document.documentElement.getAttribute("data-layout") || "column";
          if (!wantedLayout) {
            return {
              echo: input,
              lines: [
                "layout: " + nowLayout,
                "available: " + TERMINAL_LAYOUTS.join(", "),
              ],
              action: null,
            };
          }
          if (TERMINAL_LAYOUTS.indexOf(wantedLayout) === -1) {
            return {
              echo: input,
              lines: [
                "layout: unknown '" +
                  wantedLayout +
                  "' — try: " +
                  TERMINAL_LAYOUTS.join(", "),
              ],
              action: null,
            };
          }
          if (wantedLayout === nowLayout) {
            return {
              echo: input,
              lines: ["layout: already " + wantedLayout],
              action: null,
            };
          }
          return {
            echo: input,
            lines: ["layout → " + wantedLayout],
            action: { type: "layout", layout: wantedLayout },
          };
        }
        case "set": {
          // A git-config-style settings verb: `set` lists current values, `set
          // <key> <value>` changes one. Mostly a thin dispatcher onto the
          // existing command grammar (so validation lives in one place); only
          // typography needs its own handling (no standalone command for it).
          var setKey = (args[0] || "").toLowerCase();
          var setVal = args.slice(1).join(" ").toLowerCase();
          if (!setKey) {
            return {
              echo: input,
              lines: [],
              action: { type: "settings-list" },
            };
          }
          // Delegate to the equivalent command, keeping the `set …` echo so the
          // scrollback shows what was actually typed.
          var setDelegate = function (cmd) {
            var res = runTerminalCommand(cmd);
            res.echo = input;
            return res;
          };
          switch (setKey) {
            case "mode":
              if (["dark", "light", "system"].indexOf(setVal) === -1) {
                return {
                  echo: input,
                  lines: ["set mode: try dark, light or system"],
                  action: null,
                };
              }
              return setDelegate(setVal);
            case "layout":
              return setDelegate("layout " + setVal);
            case "lang":
            case "language":
              return setDelegate("lang " + setVal);
            case "pantone":
            case "grid":
            case "blend":
            case "grain":
            case "motion":
              return setDelegate(setKey + " " + setVal);
            case "type":
            case "typography":
              if (TERMINAL_TYPOGRAPHY.indexOf(setVal) === -1) {
                return {
                  echo: input,
                  lines: [
                    "set typography: try " + TERMINAL_TYPOGRAPHY.join(", "),
                  ],
                  action: null,
                };
              }
              return {
                echo: input,
                lines: ["typography → " + setVal],
                action: { type: "typography", typography: setVal },
              };
            default:
              return {
                echo: input,
                lines: [
                  "set: unknown setting '" + setKey + "' — run 'set' to list",
                ],
                action: null,
              };
          }
        }
        case "share": {
          var shareUrl =
            window.ThemeShare &&
            typeof window.ThemeShare.buildUrl === "function"
              ? window.ThemeShare.buildUrl()
              : (window.location && window.location.href) || "";
          if (!shareUrl) {
            return {
              echo: input,
              lines: ["share: nothing to share here"],
              action: null,
            };
          }
          return {
            echo: input,
            lines: ["copied a link to this exact look — paste it anywhere"],
            action: { type: "copy", text: shareUrl },
          };
        }
        case "debug":
        case "env": {
          var root = document.documentElement;
          var effectState = function (attr) {
            return root.getAttribute(attr) === "on" ? "on" : "off";
          };
          return {
            echo: input,
            lines: [
              "mode       " +
                (localStorage.getItem("theme-mode") || "system") +
                " (" +
                resolvedModeLabel() +
                ")",
              "palette    " + paletteLabel(),
              "layout     " + (root.getAttribute("data-layout") || "column"),
              "typography " +
                (localStorage.getItem("theme-typography") || "editorial"),
              "grain      " + effectState("data-effect-grain"),
              "blend      " + effectState("data-effect-blend"),
              "motion     " +
                (effectState("data-effect-reduced-motion") === "on"
                  ? "reduced"
                  : "full"),
              "lang       " + currentLang(),
              "pantone    " + getCurrentCotyYear(),
            ],
            action: null,
          };
        }
        case "reset":
          return {
            echo: input,
            lines: ["reset: theme restored to defaults"],
            action: { type: "reset" },
          };
        case "copy": {
          var copyWhat = (args[0] || "").toLowerCase();
          var copyText = "";
          if (copyWhat === "email") {
            var copyMail = terminalContactLinks().filter(function (c) {
              return c.kind === "email";
            })[0];
            copyText = copyMail ? copyMail.href.replace(/^mailto:/, "") : "";
          } else if (copyWhat === "url" || copyWhat === "link") {
            copyText = (window.location && window.location.href) || "";
          } else if (copyWhat) {
            copyText = rest;
          } else {
            copyText = lastTerminalOutput || "";
          }
          if (!copyText) {
            return {
              echo: input,
              lines: ["copy: nothing to copy — try 'copy email' or 'copy url'"],
              action: null,
            };
          }
          return {
            echo: input,
            lines: [
              "copied: " +
                (copyText.length > 30 ? copyText.slice(0, 29) + "…" : copyText),
            ],
            action: { type: "copy", text: copyText },
          };
        }
        // ---- Group C: classic unix eggs ----------------------------------
        case "sl":
          return {
            echo: input,
            lines: [
              "        _____      . . .",
              "   ____/ tor \\_______________",
              "  |___________________________|",
              "   (O)   (O)   (O)   (O)   (O) ",
              "  choo choo — you typed ls wrong",
            ],
            action: null,
          };
        case "xyzzy":
          return { echo: input, lines: ["Nothing happens."], action: null };
        case "42":
        case "answer":
          return {
            echo: input,
            lines: ["the answer to life, the universe & everything: 42"],
            action: null,
          };
        case "moo":
          return {
            echo: input,
            lines: [
              "         (__)",
              "         (oo)",
              "   /------\\/ ",
              "  / |    ||  ",
              " *  /\\---/\\  ",
              "    ~~   ~~  ",
              "…has this terminal mooed today?",
            ],
            action: null,
          };
        case "ping": {
          var pingHost = args[0] || terminalHost();
          return {
            echo: input,
            lines: [
              "PING " + pingHost + " — pong 🏓",
              "1 packet transmitted, 1 received, 0.42 ms",
            ],
            action: null,
          };
        }
        // ---- Group D: design / ASCII eggs --------------------------------
        case "cowsay":
          return { echo: input, lines: terminalCowsay(rest), action: null };
        case "logo":
        case "ascii": {
          var logoLines = terminalArtLines();
          return {
            echo: input,
            lines: logoLines.length ? logoLines : ["(no logo art here)"],
            action: null,
          };
        }
        case "weather": {
          var weatherLoc = rest || "Göteborg";
          return {
            echo: input,
            lines: [
              weatherLoc + ": ⛅ +17°C, light breeze",
              "(source: vibes, not a real API)",
            ],
            action: null,
          };
        }
        case "matrix":
          return { echo: input, lines: [], action: { type: "matrix" } };
        case "easteregg":
        case "eastereggs":
          return {
            echo: input,
            lines: TERMINAL_EASTER_EGGS.slice(),
            action: null,
          };
        default:
          return {
            echo: input,
            lines: [
              tiText("notFound", "%s: command not found — try 'help'", cmd),
            ],
            action: null,
          };
      }
    }

    // Party mode: a root attribute CSS hangs a playful hue-cycle off. Toggled
    // by the `konami` command and by the arrow-key Konami code at the prompt.
    //
    // The guard collapses a synchronous burst of calls into a single toggle.
    // In the browser this is a no-op — one handler fires once. It matters under
    // test, where re-requiring the module re-runs its DOMContentLoaded init and
    // stacks duplicate prompt handlers that would otherwise all toggle for one
    // keypress; the flag lives on `window` so every stacked copy shares it, and
    // clears on the next microtask so genuine later toggles still register.
    function toggleKonami() {
      if (window.__konamiToggling) {
        return;
      }
      window.__konamiToggling = true;
      window.Promise.resolve().then(function () {
        window.__konamiToggling = false;
      });
      var root = document.documentElement;
      if (root.getAttribute("data-konami") === "on") {
        root.removeAttribute("data-konami");
      } else {
        root.setAttribute("data-konami", "on");
      }
    }

    // A typed cd can only swap in place for a same-origin target.
    function isSameOriginUrl(href) {
      try {
        return (
          new URL(href, window.location.href).origin === window.location.origin
        );
      } catch (err) {
        return false;
      }
    }

    // Full-reload navigation — the click-path behaviour: stash the `cd` echo so
    // the destination prints it above its first prompt, then load. The fallback
    // for every typed nav that can't (or shouldn't) swap in place.
    function fullReloadNavigate(action) {
      if (action.cd !== false) {
        stashTerminalCd(currentTerminalCwd(), hrefToCwd(action.url));
      }
      try {
        window.location.assign(action.url);
      } catch (err) {
        window.location.href = action.url;
      }
    }

    // Typed navigation. Clicks still full-reload (see the click handler below);
    // only typed cd/resume/home reach here. Swap in place when we can — terminal
    // layout, same-origin, a real directory (home stays a full reload, it's a
    // CSS-bundled page), not a language switch (cd:false) — and hand off to
    // terminal-nav.js, which makes the final call after fetching (it declines
    // special pages it can only detect from the response). If it declines, isn't
    // present, or nothing qualifies, fall back to a full reload. The command
    // echo already printed to the scrollback, so an in-place swap needs no extra
    // output; on fallback the reload wipes it and the stash reprints it on top.
    function navigateTerminal(action) {
      var cwd = hrefToCwd(action.url);
      // In transcript mode the page content (#main) is hidden — it's just the
      // boot transcript's data source — so an in-place #main swap would paint
      // nothing. A `navigate` (open/lang) instead does a full load; the
      // destination re-runs its own boot transcript, keeping the session model.
      var canSwap =
        !document.documentElement.hasAttribute("data-terminal-transcript") &&
        action.cd !== false &&
        isTerminalLayout() &&
        cwd !== "~" &&
        isSameOriginUrl(action.url) &&
        window.TerminalNav &&
        typeof window.TerminalNav.go === "function";
      if (!canSwap) {
        fullReloadNavigate(action);
        return;
      }
      window.TerminalNav.go(action.url, { cwd: cwd }).then(function (swapped) {
        if (!swapped) {
          fullReloadNavigate(action);
        }
      });
    }

    // Render a fetched directory listing by what the cwd IS:
    //  - a tags index (~/works/tags)     → the tags, as `<tag>/` dirs
    //  - a tag term (~/works/tags/<tag>)  → the posts, as `<slug>.md@` symlinks
    //    (their canonical file lives up in the section, not here)
    //  - a section (~/works)              → the posts as `<slug>.md`, plus a
    //    `tags/` entry when the page links to a tag index
    function terminalRemoteLsEntries(doc, cwd) {
      var segs = String(cwd || "")
        .replace(/^~\/?/, "")
        .split("/")
        .filter(Boolean);
      var tagsIdx = segs.indexOf("tags");
      var isTagsIndex = segs.length > 0 && segs[segs.length - 1] === "tags";
      var isTerm = tagsIdx !== -1 && tagsIdx < segs.length - 1;
      var out = [];
      var seen = {};
      var add = function (entry, key) {
        if (!seen[key]) {
          seen[key] = 1;
          out.push(entry);
        }
      };

      if (isTagsIndex) {
        doc.querySelectorAll('a[href*="/tags/"]').forEach(function (a) {
          var hs = terminalHrefSegments(a.getAttribute("href"));
          var ti = hs ? hs.indexOf("tags") : -1;
          // Only a term link tags/<tag> (the tag the last segment).
          if (ti === -1 || ti !== hs.length - 2) {
            return;
          }
          var tag = hs[hs.length - 1];
          if (tag && tag !== "index" && tag !== "page") {
            add(tag + "/", tag);
          }
        });
        return out;
      }

      doc
        .querySelectorAll(".summary-card a[href], .article-card a[href]")
        .forEach(function (a) {
          var hs = terminalHrefSegments(a.getAttribute("href"));
          if (!hs || hs.length < 2) {
            return;
          }
          var slug = hs[hs.length - 1];
          if (slug === "tags") {
            return;
          }
          // In a tag term the post's real file is up in the section, so it's a
          // symlink (marked with @), not a copy. In the section it's the file.
          add(isTerm ? slug + ".md@" : slug + ".md", slug);
        });

      // A section lists its own `tags/` directory only when it actually has
      // one — i.e. the page links to `<section>/tags/`. Works has real tag term
      // pages; writing uses `?tag=` filters, so it correctly gets no tags/.
      if (!isTerm && segs.length) {
        var section = segs[0];
        var hasTags = false;
        doc.querySelectorAll('a[href*="/tags"]').forEach(function (a) {
          var hs = terminalHrefSegments(a.getAttribute("href"));
          if (hs && hs.length === 2 && hs[0] === section && hs[1] === "tags") {
            hasTags = true;
          }
        });
        if (hasTags) {
          add("tags/", "tags");
        }
      }
      return out;
    }

    function applyTerminalAction(action) {
      if (!action) {
        return;
      }
      switch (action.type) {
        case "konami":
          toggleKonami();
          break;
        case "layout":
          // Leaving the terminal for another layout wipes the scrollback so it
          // doesn't leak into the destination (same as exitTerminal).
          if (
            action.layout &&
            action.layout !== "terminal" &&
            isTerminalLayout() &&
            terminalSession
          ) {
            terminalSession.textContent = "";
          }
          setLayout(action.layout);
          break;
        case "reset":
          if (
            typeof isPantoneModeActive === "function" &&
            isPantoneModeActive()
          ) {
            stopPantone();
          }
          setMode("system");
          commitPaletteSelection("standard", { toast: false });
          setTypography("editorial");
          setGrainEnabled(false, { silent: true });
          setBlendEnabled(false, { silent: true });
          setReducedMotionEnabled(false, { silent: true });
          break;
        case "copy":
          try {
            if (
              window.navigator &&
              window.navigator.clipboard &&
              typeof window.navigator.clipboard.writeText === "function"
            ) {
              window.navigator.clipboard.writeText(action.text);
            }
          } catch (err) {
            /* clipboard unavailable — the confirmation line already printed */
          }
          break;
        case "matrix":
          runTerminalMatrix();
          break;
        case "exit":
          exitTerminal();
          break;
        case "clear":
          if (terminalSession) {
            terminalSession.textContent = "";
          }
          break;
        case "mode":
          setMode(action.mode);
          break;
        case "typography":
          setTypography(action.typography);
          break;
        case "settings-list":
          printTerminalSettingsList();
          break;
        case "ls-list":
          printTerminalLsList(action.tokens, action.more);
          break;
        case "pantone":
          if (action.state === "off") {
            stopPantone();
          } else if (action.state === "on") {
            if (!isPantoneModeActive()) {
              activatePantone({ playing: false, resetYear: true });
            }
          } else if (action.state === "year") {
            if (!isPantoneModeActive()) {
              activatePantone({ playing: false, resetYear: false });
            }
            setCotyYear(action.year, {
              fromUser: true,
              transitionDuration: PANTONE_MANUAL_TRANSITION_MS,
            });
          } else if (action.state === "step") {
            if (!isPantoneModeActive()) {
              activatePantone({ playing: false, resetYear: false });
            }
            advanceCotyYear(action.step, {
              fromUser: true,
              transitionDuration: PANTONE_MANUAL_TRANSITION_MS,
            });
          } else {
            togglePantoneMode();
          }
          break;
        case "grid": {
          var gridBtn = document.querySelector('[data-js="grid-toggle"]');
          if (!gridBtn) {
            break;
          }
          // "closing" means the overlay is animating out — treat it as off, the
          // same as grid-overlay.js's own open() guard, so a mid-close toggle
          // isn't misread as on.
          var gridAttr =
            document.documentElement.getAttribute("data-grid-overlay");
          var gridOn = gridAttr !== null && gridAttr !== "closing";
          if (action.state === "toggle" || (action.state === "on") !== gridOn) {
            gridBtn.click();
          }
          break;
        }
        case "effect": {
          var effect = TERMINAL_EFFECTS[action.effect];
          if (!effect) {
            break;
          }
          // `feature` is what the command word means (grain/blend present, or
          // motion playing). For motion that is the inverse of the underlying
          // data-effect-reduced-motion attribute, so `motion on` restores
          // animation rather than suppressing it.
          var attrOn =
            document.documentElement.getAttribute(effect.attr) === "on";
          var featureOn = effect.invert ? !attrOn : attrOn;
          var targetFeature =
            action.state === "on"
              ? true
              : action.state === "off"
              ? false
              : !featureOn;
          effect.set(effect.invert ? !targetFeature : targetFeature);
          break;
        }
        case "navigate":
          if (action.url) {
            navigateTerminal(action);
          }
          break;
        case "open-external":
          // http(s) opens in a new tab so the terminal session survives;
          // mailto:/tel: hand off to the OS handler via a same-tab assignment.
          try {
            if (/^https?:/i.test(action.url)) {
              window.open(action.url, "_blank", "noopener");
            } else {
              window.location.href = action.url;
            }
          } catch (e) {
            /* popup blocked or unsupported scheme — nothing to do */
          }
          break;
        case "chdir":
          // Append-only cd: move the LIVE prompt only. --terminal-live-cwd
          // drives the bottom input's PS1; --terminal-cwd (the frozen page cwd)
          // is left untouched, so every history prompt above — header, tour
          // lines, scrollback — stays where it ran. No fetch, no swap, no jump.
          document.documentElement.style.setProperty(
            "--terminal-live-cwd",
            '"' + (action.cwd || "~") + '"'
          );
          // cd hands the exit target back to the cwd (see exitTerminal): a move
          // supersedes whatever page you last read.
          terminalLastViewedUrl = null;
          break;
        case "remote-ls":
          // Append-only ls: fetch the section you've cd'd into and print its
          // files into the scrollback below — nothing above moves.
          if (typeof window.fetch !== "function") {
            printTerminalLine(
              "ls: cannot reach " + action.url,
              "terminal-session__out"
            );
            break;
          }
          window
            .fetch(action.url, { credentials: "same-origin" })
            .then(function (res) {
              return res.ok ? res.text() : Promise.reject();
            })
            .then(function (html) {
              var doc = new DOMParser().parseFromString(html, "text/html");
              var files = terminalRemoteLsEntries(doc, action.cwd);
              if (files.length) {
                // Remember what this directory held, so Tab completion works in
                // it even though the `cd` never loaded its page.
                terminalLsDirCache[terminalSegmentsOf(action.cwd).join("/")] =
                  files;
                // Clickable, like the local `ls` — each post cats itself, each
                // tag dir cds into it.
                printTerminalLsList(
                  files.map(function (label) {
                    return { label: label, cmd: terminalEntryCmd(label) };
                  })
                );
              } else if (doc.querySelector(".content.post, .content.page")) {
                // A readable page (about, a post) is a FILE, not a listing —
                // point at cat instead of a bare "(empty)" that hides how to
                // reach it.
                var lsSlug = String(action.cwd || "")
                  .split("/")
                  .filter(Boolean)
                  .pop();
                printTerminalLine(
                  "ls: " +
                    (lsSlug || "this") +
                    " is a file, not a directory — try: cat " +
                    (lsSlug || "it") +
                    ".md",
                  "terminal-session__out"
                );
              } else {
                printTerminalLine("(empty)", "terminal-session__out");
              }
              scrollTerminalToEnd();
            })
            .catch(function () {
              printTerminalLine(
                "ls: cannot reach " + action.url,
                "terminal-session__out"
              );
              scrollTerminalToEnd();
            });
          break;
        case "remote-cat": {
          // Append-only cat: fetch the post and print its readable text
          // (images as [image N] tokens) into the scrollback below — nothing
          // above the prompt changes. `open` is the escape hatch to the page.
          var catLabel = action.name || action.url;
          // Captured now, before the async fetch resolves, so the reveal lands
          // on THIS command's echo even if another prints meanwhile.
          var catCmdLine = lastTerminalCmdLine;
          if (typeof window.fetch !== "function") {
            printTerminalLine(
              "cat: cannot reach " + action.url,
              "terminal-session__out"
            );
            break;
          }
          window
            .fetch(action.url, { credentials: "same-origin" })
            .then(function (res) {
              // A 404 means the guessed cwd-relative path doesn't exist — a
              // genuine "No such file", distinct from a network failure.
              if (!res.ok) {
                var notFound = new Error("not found");
                notFound.notFound = true;
                throw notFound;
              }
              return res.text();
            })
            .then(function (html) {
              var doc = new DOMParser().parseFromString(html, "text/html");
              printTerminalCatTokens(
                terminalExtractPostLines(doc, action.url, action.root),
                catLabel
              );
              // Reading a page IS visiting it here — so exit lands on it.
              terminalLastViewedUrl = action.url;
              revealTerminalCat(catCmdLine);
            })
            .catch(function (err) {
              printTerminalLine(
                err && err.notFound
                  ? tiText(
                      "catMissing",
                      "cat: %s: No such file or directory",
                      catLabel
                    )
                  : tiText(
                      "catUnreachable",
                      "cat: cannot reach %s",
                      action.url
                    ),
                "terminal-session__out"
              );
              scrollTerminalToEnd();
            });
          break;
        }
        case "cat-local": {
          // The current page's own file: read #main directly instead of
          // re-fetching the page you're already on (the boot transcript's
          // `cat <slug>.md` on a post/about). Synchronous, so no blank flash
          // while a fetch round-trips.
          var localCmdLine = lastTerminalCmdLine;
          printTerminalCatTokens(
            terminalExtractPostLines(document, window.location.href, null),
            action.name
          );
          // A user `cat` of the current page lands the reader at the top of the
          // output; the boot transcript's own cat-local doesn't (it stays at the
          // banner while the replay runs).
          if (
            !document.documentElement.hasAttribute("data-terminal-replaying")
          ) {
            revealTerminalCat(localCmdLine);
          }
          break;
        }
        case "flow":
          if (window.TerminalFlows) {
            window.TerminalFlows.start(action.flow);
          }
          break;
        case "ai-start":
          if (
            window.TerminalAI &&
            typeof window.TerminalAI.start === "function"
          ) {
            window.TerminalAI.start();
          } else {
            printTerminalLine("ai: not available", "terminal-session__out");
          }
          break;
        case "ai-report":
          // The assistant owns the last exchange and prints its own bilingual
          // confirmation; `report` outside a chat (nothing to flag) is handled
          // there too.
          if (
            window.TerminalAI &&
            typeof window.TerminalAI.report === "function"
          ) {
            window.TerminalAI.report(action.note || "");
          } else {
            printTerminalLine(
              "report: nothing to report",
              "terminal-session__out"
            );
          }
          break;
        case "defer":
          // Print follow-up lines after a delay, so a command can fake a job
          // running before its punchline. Skip if the terminal was left in
          // the meantime.
          if (action.lines && action.lines.length) {
            window.setTimeout(function () {
              if (!isTerminalLayout()) {
                return;
              }
              action.lines.forEach(function (line) {
                printTerminalLine(line, "terminal-session__out");
              });
              scrollTerminalToEnd();
            }, action.delay || 600);
          }
          break;
        default:
          break;
      }
    }

    function printTerminalLine(text, className, frozenCwd) {
      if (!terminalSession) {
        return null;
      }
      var line = document.createElement("span");
      line.className = "terminal-session__line " + className;
      line.textContent = text;
      // Freeze the prompt's cwd on an echoed command so the scrollback keeps
      // the directory it ran at — a later `cd` moves only the live prompt, not
      // the history above (matching the pending-cd echo's own inline override).
      if (frozenCwd) {
        line.style.setProperty("--terminal-cwd", '"' + frozenCwd + '"');
      }
      terminalSession.appendChild(line);
      // Remember the last *output* row, so `copy` with no argument grabs it.
      if (className.indexOf("terminal-session__out") !== -1) {
        lastTerminalOutput = text;
      }
      return line;
    }

    // A cat'd image prints as a clickable [image N] token: a terminal can't
    // paint the picture, but the token carries the real image URL and filename,
    // so clicking it echoes `open <file>` and opens the picture in the lightbox
    // (see the terminalSession click handler). Keyboard-reachable as a button.
    function printTerminalImageLine(tok) {
      if (!terminalSession) {
        return;
      }
      var line = document.createElement("span");
      line.className = "terminal-session__line terminal-session__out";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "terminal-session__image";
      btn.textContent =
        "[image " + tok.n + (tok.alt ? ": " + tok.alt : "") + "]";
      btn.setAttribute("data-image-src", tok.src || "");
      btn.setAttribute("data-image-file", tok.file || "");
      btn.setAttribute("data-image-alt", tok.alt || "");
      line.appendChild(btn);
      terminalSession.appendChild(line);
    }

    // The command a clicked markdown link runs: an internal link cats the post
    // it points at (its last path segment, .md) — you read it inline, like
    // clicking a featured card; an external link (or mailto/tel) opens directly.
    function terminalLinkCmd(url) {
      var u;
      try {
        u = new URL(url, window.location.href);
      } catch (e) {
        return "open " + url;
      }
      if (u.origin === window.location.origin) {
        var segs = u.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
        var lang = (
          document.documentElement.getAttribute("lang") || ""
        ).toLowerCase();
        if (segs.length && segs[0].toLowerCase() === lang) {
          segs.shift();
        }
        var slug = segs.length ? segs[segs.length - 1] : "";
        return slug ? "cat " + slug + ".md" : "open " + u.pathname;
      }
      return "open " + url;
    }

    // Print a prose line, turning any markdown [text](url) into a clickable
    // token (URL hidden, like the ls/set chips) that runs terminalLinkCmd on
    // click. Plain lines take the fast textContent path.
    var TERMINAL_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
    function printTerminalProseLine(text) {
      if (!terminalSession) {
        return;
      }
      TERMINAL_LINK_RE.lastIndex = 0;
      if (!TERMINAL_LINK_RE.test(text)) {
        printTerminalLine(text, "terminal-session__out");
        return;
      }
      var line = document.createElement("span");
      line.className = "terminal-session__line terminal-session__out";
      TERMINAL_LINK_RE.lastIndex = 0;
      var last = 0;
      var m;
      while ((m = TERMINAL_LINK_RE.exec(text))) {
        if (m.index > last) {
          line.appendChild(document.createTextNode(text.slice(last, m.index)));
        }
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "terminal-session__link";
        btn.textContent = m[1];
        btn.setAttribute("data-cmd", terminalLinkCmd(m[2]));
        line.appendChild(btn);
        last = m.index + m[0].length;
      }
      if (last < text.length) {
        line.appendChild(document.createTextNode(text.slice(last)));
      }
      terminalSession.appendChild(line);
      lastTerminalOutput = text;
    }

    // Print a cat'd file's extracted tokens (text lines + [image N] tokens),
    // or an "(empty)" note. Shared by remote-cat (fetched) and cat-local (the
    // current page read straight from #main).
    function printTerminalCatTokens(tokens, label) {
      if (!tokens || !tokens.length) {
        printTerminalLine(
          "cat: " + (label || "file") + ": (empty)",
          "terminal-session__out"
        );
        return;
      }
      tokens.forEach(function (tok) {
        if (tok.image) {
          printTerminalImageLine(tok);
        } else {
          printTerminalProseLine(tok.text);
        }
      });
    }

    // `set` (no args) prints the settings as clickable chip rows — the settings
    // panel rendered as terminal output. Each option is a button carrying the
    // exact `set <key> <value>` it runs (see the terminalSession click handler),
    // so clicking is the same as typing it; the current value is marked. This is
    // the OSC-8-style clickable-output convention (`ls --hyperlink`), and it is
    // what unifies the panel with the command — one truth, click or type.
    // A screenful before the pager kicks in, for long text dumps (tree, ls -R,
    // history). `set` passes its own smaller preview (the main axes).
    var TERMINAL_PAGE_SIZE = 12;

    // Append pre-built row elements with a `less`/`more`-style pager: past a
    // preview count, show a dim clickable "--More--" that reveals the rest
    // inline (a tap on mobile, a click on desktop). Only kicks in when it hides
    // more than a single row — otherwise it'd trade one line for the marker.
    function appendTerminalRowsPaged(rows, preview) {
      if (!terminalSession) {
        return;
      }
      if (rows.length <= preview + 1) {
        rows.forEach(function (row) {
          terminalSession.appendChild(row);
        });
        return;
      }
      rows.slice(0, preview).forEach(function (row) {
        terminalSession.appendChild(row);
      });
      var rest = rows.slice(preview);
      var more = document.createElement("button");
      more.type = "button";
      more.className =
        "terminal-session__line terminal-session__out terminal-session__more";
      more.textContent = tiText(
        "pagerMore",
        "--More--  +%s more · tap",
        rest.length
      );
      more.addEventListener("click", function () {
        var frag = document.createDocumentFragment();
        rest.forEach(function (row) {
          frag.appendChild(row);
        });
        // Reveal in place — grow the buffer where the marker sat, don't jump.
        more.parentNode.insertBefore(frag, more);
        more.remove();
      });
      terminalSession.appendChild(more);
    }

    // Plain text lines, paged.
    function printTerminalLinesPaged(lines, preview) {
      var rows = (lines || []).map(function (line) {
        var row = document.createElement("span");
        row.className = "terminal-session__line terminal-session__out";
        row.textContent = line;
        return row;
      });
      appendTerminalRowsPaged(rows, preview);
    }

    function printTerminalSettingsList() {
      if (!terminalSession) {
        return;
      }
      var rows = terminalSettingsSpec().map(function (setting) {
        var line = document.createElement("span");
        line.className =
          "terminal-session__line terminal-session__out terminal-session__settings-row";
        var label = document.createElement("span");
        label.className = "terminal-session__settings-key";
        label.textContent = setting.key;
        line.appendChild(label);
        setting.options.forEach(function (opt) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "terminal-session__setting";
          if (opt === setting.current) {
            btn.classList.add("is-current");
            btn.setAttribute("aria-current", "true");
          }
          btn.textContent = opt;
          btn.setAttribute("data-cmd", "set " + setting.key + " " + opt);
          line.appendChild(btn);
        });
        return line;
      });
      var hint = document.createElement("span");
      hint.className = "terminal-session__line terminal-session__out";
      hint.textContent = tiText(
        "setHint",
        "click a value or type: set <name> <value>"
      );
      rows.push(hint);
      // Preview the main axes (mode, layout, typography, language); the effect
      // toggles + hint fold under the pager so the boot `set` stays compact.
      appendTerminalRowsPaged(rows, 4);
    }

    // A plain `ls` listing as clickable entries — clicking runs the entry's
    // command (cd/cat/open). Same clickable-output convention as the settings
    // chips (OSC-8 / `ls --hyperlink`); the entries flow-wrap on a phone.
    function printTerminalLsList(tokens, more) {
      if (!terminalSession) {
        return;
      }
      var line = document.createElement("span");
      line.className =
        "terminal-session__line terminal-session__out terminal-session__settings-row";
      (tokens || []).forEach(function (tok) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "terminal-session__setting terminal-session__ls-entry";
        btn.textContent = tok.label;
        btn.setAttribute("data-cmd", tok.cmd);
        line.appendChild(btn);
      });
      terminalSession.appendChild(line);
      if (more) {
        var moreLine = document.createElement("span");
        moreLine.className = "terminal-session__line terminal-session__out";
        moreLine.textContent = "… (" + more + " more)";
        terminalSession.appendChild(moreLine);
      }
    }

    // A short, bounded "digital rain" burst for `matrix` — a few deferred
    // frames of random glyph rows, then it stops. No persistent interval, so
    // nothing outlives the terminal or fights reduced motion.
    function runTerminalMatrix() {
      var GLYPHS = "01ﾊﾋﾎｱｲｳｴｵｶｷｸ日ﾘｦ";
      var FRAMES = 3;
      var step = 0;
      function row() {
        var s = "";
        for (var i = 0; i < 30; i++) {
          s += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        }
        return s;
      }
      function frame() {
        if (!isTerminalLayout()) {
          return;
        }
        for (var r = 0; r < 4; r++) {
          printTerminalLine(row(), "terminal-session__out");
        }
        scrollTerminalToEnd();
        step += 1;
        if (step < FRAMES) {
          window.setTimeout(frame, 220);
        } else {
          window.setTimeout(function () {
            if (isTerminalLayout()) {
              printTerminalLine("wake up… 🟢", "terminal-session__out");
              scrollTerminalToEnd();
            }
          }, 220);
        }
      }
      frame();
    }

    // Record a command in the ↑/↓ recall ring before it runs, so `history`
    // includes itself — matching a real shell — and reset the recall cursor to
    // the live line. Shared by the typed command line and the boot replay.
    function recordTerminalHistory(raw) {
      terminalHistoryCursor = null;
      var trimmed = String(raw === null || raw === undefined ? "" : raw).trim();
      if (trimmed) {
        terminalHistory.push(trimmed);
        if (terminalHistory.length > TERMINAL_HISTORY_MAX) {
          terminalHistory.shift();
        }
      }
    }

    // Print a command's output rows (neofetch art first, if any) and apply its
    // action. The echo line is printed by the caller — the instant path prints
    // it up front, the typed replay types it in — so this covers only what a
    // real terminal streams *after* Enter.
    function printTerminalResultOutput(result) {
      var artLines =
        result.action && result.action.type === "art" ? terminalArtLines() : [];
      artLines.forEach(function (line) {
        printTerminalLine(
          line,
          "terminal-session__out terminal-session__out--art"
        );
      });
      if (result.paged) {
        // Long text dumps (tree, ls -R, history) page past a screenful.
        printTerminalLinesPaged(result.lines || [], result.paged.preview);
      } else {
        (result.lines || []).forEach(function (line) {
          printTerminalLine(line, "terminal-session__out");
        });
      }
      applyTerminalAction(result.action);
    }

    // Run one command through the engine and print it into the scrollback
    // exactly as a typed line would look: the frozen echo, then the output /
    // side effects. Factored out of runTerminalInput so the boot transcript can
    // replay the same path (opts.focus:false — a fresh page load must not steal
    // focus and pop the mobile keyboard; the reduced-motion boot uses this to
    // print the whole session at once, while the animated boot types it in via
    // playTerminalTranscript below).
    function emitTerminalCommand(raw, opts) {
      opts = opts || {};
      if (opts.history !== false) {
        recordTerminalHistory(raw);
      }
      var result = runTerminalCommand(raw);
      if (result.echo) {
        // Freeze the echo at the cwd it ran at. applyTerminalAction (below,
        // inside printTerminalResultOutput) is what performs an append-only
        // `cd`, so reading the cwd now — before it runs — captures where the
        // command was actually typed. Kept so a `cat` that loads a post can
        // land the reader at this line (the top of the file), not the prompt.
        lastTerminalCmdLine = printTerminalLine(
          result.echo,
          "terminal-session__cmd",
          currentTerminalCwd()
        );
      }
      printTerminalResultOutput(result);
      if (opts.focus !== false) {
        // Keep the newest output and the prompt in view; refocus so the mobile
        // keyboard stays up for the next command.
        scrollTerminalToEnd();
      }
    }

    function runTerminalInput(raw) {
      emitTerminalCommand(raw, { focus: true });
    }

    // Boot transcript: on a terminal page load, replay a curated sequence of
    // REAL commands into the scrollback (home: `ls`, `set`, `cat welcome.txt`,
    // `ls works/ --featured`) so the page reads as a genuine session — identical
    // to having typed them, and recallable with ↑. The sequence is declared per
    // page by Hugo (data-terminal-boot on <html>); each entry runs through the
    // same emitTerminalCommand path as a typed line. Runs once per load.
    function terminalBootCommands() {
      var raw = document.documentElement.getAttribute("data-terminal-boot");
      if (!raw) {
        return [];
      }
      return raw
        .split(";")
        .map(function (cmd) {
          return cmd.trim();
        })
        .filter(Boolean);
    }

    // Fill the banner's "Last login: …" line — the transcript-mode stand-in for
    // the hidden host/boot-ok meta. Shows the PREVIOUS visit's time (classic
    // shell behaviour), computed once and cached per session so it's stable
    // across page navigations and rotates on the next visit; the pseudo-tty is
    // likewise stable per session. First-ever visit shows the current time.
    function terminalStampLastLogin() {
      var el = document.querySelector('[data-js="terminal-lastlogin"]');
      if (!el) {
        return;
      }
      var line = null;
      try {
        line = sessionStorage.getItem("terminal-login-line");
      } catch (e) {
        /* sessionStorage unavailable — recompute (still shows a valid line) */
      }
      if (!line) {
        var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var mons = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        var pad = function (n) {
          return (n < 10 ? "0" : "") + n;
        };
        var prev = null;
        try {
          prev = Number(localStorage.getItem("terminal-last-login")) || null;
        } catch (e) {
          /* localStorage unavailable — fall back to now */
        }
        var d = prev ? new Date(prev) : new Date();
        var tty = null;
        try {
          tty = sessionStorage.getItem("terminal-tty");
        } catch (e) {
          /* ignore */
        }
        if (!tty) {
          var n = Math.floor(Math.random() * 1000);
          tty = "ttys" + (n < 10 ? "00" : n < 100 ? "0" : "") + n;
        }
        line =
          "Last login: " +
          days[d.getDay()] +
          " " +
          mons[d.getMonth()] +
          " " +
          pad(d.getDate()) +
          " " +
          pad(d.getHours()) +
          ":" +
          pad(d.getMinutes()) +
          " on " +
          tty;
        try {
          sessionStorage.setItem("terminal-login-line", line);
          sessionStorage.setItem("terminal-tty", tty);
          localStorage.setItem("terminal-last-login", String(Date.now()));
        } catch (e) {
          /* storage unavailable — the line still renders, just not persisted */
        }
      }
      el.textContent = line;
    }

    function runTerminalBootTranscript() {
      if (
        !terminalSession ||
        // Only into an empty scrollback — so a load-in-terminal and a
        // toggle-to-terminal each replay once, but never on top of an existing
        // session (a layout toggle mid-session keeps what you'd typed).
        terminalSession.childNodes.length ||
        !isTerminalLayout() ||
        document.documentElement.hasAttribute("data-terminal-exempt")
      ) {
        // No replay on this call — clear the pre-paint flag so the live prompt
        // (hidden while replaying) is never left withheld.
        document.documentElement.removeAttribute("data-terminal-replaying");
        return;
      }
      var commands = terminalBootCommands();
      if (!commands.length) {
        return;
      }
      // Signal the CSS that the transcript owns the view: the server-rendered
      // header chrome, page content (now the transcript's data source) and
      // footer sitemap hide, leaving the banner + scrollback + live prompt.
      // Gated on this attr so a JS failure that never reaches here leaves the
      // plain readable page visible rather than a blank screen. (head.html sets
      // it pre-paint too, to avoid a flash of the un-hidden page.)
      document.documentElement.setAttribute("data-terminal-transcript", "1");
      terminalStampLastLogin();
      if (terminalReducedMotion()) {
        // Motion off: print the whole session at once, as a real terminal
        // streams output instantly — including the live prompt, so clear the
        // replay flag that withholds it.
        commands.forEach(function (cmd) {
          emitTerminalCommand(cmd, { focus: false });
        });
        document.documentElement.removeAttribute("data-terminal-replaying");
        return;
      }
      // Motion on: replay it as a live session — each command typed at the
      // prompt, then its output streamed — so the terminal reads as though it
      // is being keyed in. The old CSS boot theatre staged the *server chrome*,
      // which the transcript hides (its animations now fire on display:none
      // elements); this replay is the animation.
      playTerminalTranscript(commands);
    }

    // Replay pacing: the hold on the banner before the first command types (so
    // the mark registers before the transcript scrolls it up), then the
    // per-character type speed and the beat between commands.
    var TERMINAL_REPLAY_START_MS = 700;
    var TERMINAL_REPLAY_TYPE_MS = 26;
    var TERMINAL_REPLAY_GAP_MS = 180;

    // Follow the replay by tracking the bottom WITHOUT focusing the input —
    // focus would pop the mobile keyboard mid-replay, the very thing the
    // focus:false boot avoids. scrollTo is a no-op while the session still fits
    // (so the banner stays put), and only starts following once it overflows.
    function scrollReplayToEnd() {
      window.scrollTo(0, document.body.scrollHeight);
    }

    // Type each command's echo at the prompt one character at a time, then — on
    // the last character — run it and stream its output, then move to the next.
    // A steady block cursor trails the text while it types and is dropped when
    // the command runs, leaving a DOM identical to the instant path's echo line.
    function playTerminalTranscript(commands) {
      var root = document.documentElement;
      // Withhold the live prompt (CSS hides it) until the session has printed —
      // it hasn't "arrived" yet. Idempotent with the pre-paint flag head.html
      // sets, and set here too for the toggle path (no reload, no pre-paint).
      root.setAttribute("data-terminal-replaying", "1");
      function runCommand(index) {
        if (index >= commands.length) {
          // Session fully printed — reveal the live prompt, ready for input.
          root.removeAttribute("data-terminal-replaying");
          scrollReplayToEnd();
          return;
        }
        var raw = commands[index];
        recordTerminalHistory(raw);
        var result = runTerminalCommand(raw);
        // Freeze the echo's cwd now, before printTerminalResultOutput's
        // applyTerminalAction can move it (an append-only `cd`).
        var cwd = currentTerminalCwd();

        function runOutput() {
          printTerminalResultOutput(result);
          scrollReplayToEnd();
          window.setTimeout(function () {
            runCommand(index + 1);
          }, TERMINAL_REPLAY_GAP_MS);
        }

        if (!result.echo) {
          // A silent command (nothing to type) — stream its output and move on.
          runOutput();
          return;
        }

        var line = document.createElement("span");
        line.className = "terminal-session__line terminal-session__cmd";
        line.style.setProperty("--terminal-cwd", '"' + cwd + '"');
        var typed = document.createTextNode("");
        var cursor = document.createElement("span");
        cursor.className = "terminal-session__cursor";
        line.appendChild(typed);
        line.appendChild(cursor);
        terminalSession.appendChild(line);
        scrollReplayToEnd();

        var text = result.echo;
        var i = 0;
        (function typeChar() {
          if (i < text.length) {
            i += 1;
            typed.data = text.slice(0, i);
            window.setTimeout(typeChar, TERMINAL_REPLAY_TYPE_MS);
            return;
          }
          // Command runs: collapse to a plain echo line (dropping the cursor,
          // matching the instant path's DOM), then stream its output.
          line.textContent = text;
          runOutput();
        })();
      }
      // Hold on the banner first, so the mark reads before the transcript types
      // in and scrolls it up.
      window.setTimeout(function () {
        runCommand(0);
      }, TERMINAL_REPLAY_START_MS);
    }

    // The boot banner's small block-curl, reused as neofetch art when present.
    function terminalArtLines() {
      var art = document.querySelector(".terminal-boot__art--sm");
      if (!art || !art.textContent) {
        return [];
      }
      return art.textContent.replace(/^\n+|\n+$/g, "").split("\n");
    }

    function scrollTerminalToEnd() {
      if (terminalInput && isTerminalLayout()) {
        window.requestAnimationFrame(function () {
          window.scrollTo(0, document.body.scrollHeight);
          terminalInput.focus();
        });
      }
    }

    // A `cat` that loads a post prints a whole document, so ending at the prompt
    // below it (scrollTerminalToEnd) strands the reader past everything they
    // just opened. Instead, land at the TOP of that output — the echoed command
    // line — like opening the file in a pager, and dismiss the keyboard (this is
    // a read, not typing). A brief tint flash on the command line marks where
    // the new content begins; the live prompt sits below, reachable via ⌄.
    function revealTerminalCat(cmdLine) {
      if (!isTerminalLayout()) {
        return;
      }
      if (terminalInput) {
        terminalInput.blur();
      }
      if (!cmdLine || typeof cmdLine.scrollIntoView !== "function") {
        scrollTerminalToEnd();
        return;
      }
      window.requestAnimationFrame(function () {
        cmdLine.scrollIntoView({ block: "start" });
      });
      if (!terminalReducedMotion()) {
        cmdLine.classList.remove("terminal-session__cmd--reveal");
        void cmdLine.offsetWidth; // reflow so a re-cat replays the flash
        cmdLine.classList.add("terminal-session__cmd--reveal");
      }
    }

    // ----------------------------------------------------------------------
    // Interactive prompt flows (contact, subscribe) live in terminal-flows.js,
    // published as window.TerminalFlows. While a flow runs it owns Enter (fed
    // its steps one at a time), checked BEFORE the ai delegate below so a flow
    // the assistant hands off to still owns input until it finishes. This guard
    // is what the input handlers test; it's a no-op (false) if that module
    // isn't loaded.
    // ----------------------------------------------------------------------
    function flowActive() {
      return !!(window.TerminalFlows && window.TerminalFlows.isActive());
    }

    // ----------------------------------------------------------------------
    // Input delegate (the `ai` assistant)
    // A registered delegate takes over Enter the way a flow does, but for an
    // open-ended chat rather than a fixed wizard. Checked AFTER flowActive() in
    // the key handler, so a flow the assistant hands off to (contact/subscribe)
    // still owns input until it finishes. Published to terminal-ai.js via the
    // window.Terminal seam below; leaving the terminal releases it (exit reset).
    // ----------------------------------------------------------------------
    var terminalInputDelegate = null;
    var terminalInputDelegateRelease = null;

    function captureTerminalInput(handler, onRelease) {
      terminalInputDelegate = typeof handler === "function" ? handler : null;
      terminalInputDelegateRelease =
        typeof onRelease === "function" ? onRelease : null;
    }

    function releaseTerminalInput() {
      var onRelease = terminalInputDelegateRelease;
      terminalInputDelegate = null;
      terminalInputDelegateRelease = null;
      setFlowPrompt(null);
      if (onRelease) {
        onRelease();
      }
    }

    // The prompt is shown verbatim; field steps pass "email>", the confirm step
    // passes its full question. Pass null to restore the shell PS1. The label is
    // set on BOTH the tail (so the hint's ::after can switch) and the prompt
    // span (so its ::before can read the label via attr() — attr() only sees the
    // pseudo-element's own element, not an ancestor).
    function setFlowPrompt(prompt, hint) {
      if (!terminalTail) {
        return;
      }
      var promptEl = terminalTail.querySelector(".terminal-tail__prompt");
      if (prompt) {
        terminalTail.setAttribute("data-flow-label", prompt);
        // The trailing hint defaults to a flow's abort word; the `ai` assistant
        // passes its own ("type exit to leave") through the seam.
        terminalTail.setAttribute(
          "data-flow-hint",
          hint || "type cancel to abort"
        );
        if (promptEl) {
          promptEl.setAttribute("data-flow-label", prompt);
        }
      } else {
        terminalTail.removeAttribute("data-flow-label");
        terminalTail.removeAttribute("data-flow-hint");
        if (promptEl) {
          promptEl.removeAttribute("data-flow-label");
        }
      }
    }

    // Let the top-level exitTerminal() abort a flow AND release the `ai`
    // delegate when leaving the terminal, so re-entering starts clean and the
    // assistant's own state (via its onRelease) can't get stuck active.
    terminalFlowReset = function () {
      if (window.TerminalFlows) {
        window.TerminalFlows.cancel();
      }
      releaseTerminalInput();
    };

    function syncTerminalInputSize() {
      if (!terminalInput) {
        return;
      }
      terminalInput.size = Math.max(1, terminalInput.value.length);
      if (terminalTail) {
        terminalTail.classList.toggle("is-typing", terminalInput.value !== "");
      }
    }

    // Track the Konami code as it's typed into the prompt. Non-destructive:
    // it only watches keys, then tidies the stray "b"/"a" once it completes.
    function advanceKonami(e) {
      var key = String(e.key || "").toLowerCase();
      if (key === KONAMI_SEQUENCE[konamiProgress]) {
        konamiProgress += 1;
        if (konamiProgress === KONAMI_SEQUENCE.length) {
          konamiProgress = 0;
          if (terminalInput) {
            terminalInput.value = "";
            syncTerminalInputSize();
          }
          toggleKonami();
          printTerminalLine("konami: party mode 🌈", "terminal-session__out");
          scrollTerminalToEnd();
        }
      } else {
        // Let a mistyped key restart the sequence if it's the first step.
        konamiProgress = key === KONAMI_SEQUENCE[0] ? 1 : 0;
      }
    }

    // ↑/↓ history recall: walk terminalHistory, oldest→newest, restoring an
    // empty line past the newest entry. `dir` is -1 for ↑ (older), +1 for ↓.
    function terminalRecallHistory(dir) {
      if (!terminalInput || !terminalHistory.length) {
        return;
      }
      if (terminalHistoryCursor === null) {
        terminalHistoryCursor = terminalHistory.length;
      }
      terminalHistoryCursor = Math.max(
        0,
        Math.min(terminalHistory.length, terminalHistoryCursor + dir)
      );
      terminalInput.value = terminalHistory[terminalHistoryCursor] || "";
      syncTerminalInputSize();
      var end = terminalInput.value.length;
      try {
        terminalInput.setSelectionRange(end, end);
      } catch (err) {
        /* selection API unavailable — value is still set */
      }
    }

    // Tab completion: complete the command word, or a cd/ls/open path fragment
    // against the current directory's children. Single match fills; multiple
    // print the candidates.
    function terminalCompleteInput() {
      if (!terminalInput) {
        return;
      }
      var value = terminalInput.value;
      var parts = value.split(/\s+/);
      var candidates;
      var frag;
      if (parts.length <= 1) {
        frag = (parts[0] || "").toLowerCase();
        candidates = TERMINAL_COMMAND_NAMES.filter(function (name) {
          return name.indexOf(frag) === 0;
        });
      } else {
        var verb = parts[0].toLowerCase();
        frag = (parts[parts.length - 1] || "").toLowerCase();
        if (verb === "set") {
          // `set ⇥` completes the setting keys; `set <key> ⇥` completes that
          // key's values — Tab is the terminal-true way to discover what `set`
          // can do (alongside `set` with no args and `man set`).
          var spec = terminalSettingsSpec();
          if (parts.length === 2) {
            candidates = spec
              .map(function (s) {
                return s.key;
              })
              .filter(function (k) {
                return k.indexOf(frag) === 0;
              });
          } else if (parts.length === 3) {
            var setEntry = spec.filter(function (s) {
              return s.key === parts[1].toLowerCase();
            })[0];
            candidates = setEntry
              ? setEntry.options.filter(function (o) {
                  return o.indexOf(frag) === 0;
                })
              : [];
          } else {
            return;
          }
        } else if (verb === "ls" && frag.charAt(0) === "-") {
          // `ls -⇥` completes the flags (--featured/--images/-a/-R)
          // and short flags — the same discovery Tab gives `set`.
          candidates = TERMINAL_LS_FLAGS.filter(function (flag) {
            return flag.indexOf(frag) === 0;
          });
        } else if (
          verb !== "cd" &&
          verb !== "ls" &&
          verb !== "open" &&
          verb !== "cat"
        ) {
          return;
        } else {
          var cwdSegs = terminalCwdSegments();
          var node = terminalNodeAt(cwdSegs);
          candidates = node
            ? Object.keys(node.children).filter(function (name) {
                return name.indexOf(frag) === 0;
              })
            : [];
          // cat/open reach the page's posts too — complete them as .md files.
          if (verb === "cat" || verb === "open") {
            terminalPageContentSlugs(cwdSegs).forEach(function (slug) {
              var file = slug + ".md";
              if (file.indexOf(frag) === 0 && candidates.indexOf(file) === -1) {
                candidates.push(file);
              }
            });
          }
          // A directory you `cd`'d into but never loaded isn't in the tree or
          // the live DOM — but if you `ls`'d it, its entries are cached. Offer
          // dir names to cd, and (for cat/open) its files as .md, stripping the
          // classify markers (`/`, `@`) so they complete like real names.
          (terminalLsDirCache[cwdSegs.join("/")] || []).forEach(function (
            label
          ) {
            if (/\/$/.test(label)) {
              var dir = label.slice(0, -1).toLowerCase();
              if (dir.indexOf(frag) === 0 && candidates.indexOf(dir) === -1) {
                candidates.push(dir);
              }
            } else if (
              (verb === "cat" || verb === "open") &&
              /\.md@?$/i.test(label)
            ) {
              var file = label.replace(/@$/, "").toLowerCase();
              if (file.indexOf(frag) === 0 && candidates.indexOf(file) === -1) {
                candidates.push(file);
              }
            }
          });
        }
      }
      if (candidates.length === 1) {
        parts[parts.length - 1] = candidates[0];
        terminalInput.value = parts.join(" ") + (parts.length === 1 ? " " : "");
        syncTerminalInputSize();
      } else if (candidates.length > 1) {
        printTerminalLine(candidates.join("  "), "terminal-session__out");
        scrollTerminalToEnd();
      }
    }

    // ^C: abort the current line — echo the caret marker, end any running flow,
    // clear the input and the history cursor. Shared by the keydown handler and
    // the mobile key bar (the on-screen keyboard has no Ctrl key).
    function terminalCancelLine() {
      if (!terminalInput) {
        return;
      }
      printTerminalLine("^C", "terminal-session__out");
      if (flowActive()) {
        window.TerminalFlows.cancel();
      }
      terminalInput.value = "";
      terminalHistoryCursor = null;
      syncTerminalInputSize();
      scrollTerminalToEnd();
    }

    if (terminalInput) {
      // Typing invalidates the history-recall position.
      terminalInput.addEventListener("input", function () {
        terminalHistoryCursor = null;
        syncTerminalInputSize();
      });
      terminalInput.addEventListener("keydown", function (e) {
        advanceKonami(e);
        // Ctrl shortcuts: ^L clear screen, ^U clear line, ^C cancel line.
        if (e.ctrlKey && !e.altKey && !e.metaKey) {
          var ctrlKey = (e.key || "").toLowerCase();
          if (ctrlKey === "l") {
            e.preventDefault();
            if (terminalSession) {
              terminalSession.textContent = "";
            }
            return;
          }
          if (ctrlKey === "u") {
            e.preventDefault();
            terminalInput.value = "";
            terminalHistoryCursor = null;
            syncTerminalInputSize();
            return;
          }
          if (ctrlKey === "c") {
            e.preventDefault();
            terminalCancelLine();
            return;
          }
        }
        if (e.key === "Tab") {
          e.preventDefault();
          if (!flowActive()) {
            terminalCompleteInput();
          }
          return;
        }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          if (!flowActive() && terminalHistory.length) {
            e.preventDefault();
            terminalRecallHistory(e.key === "ArrowUp" ? -1 : 1);
          }
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          var value = terminalInput.value;
          terminalInput.value = "";
          syncTerminalInputSize();
          if (flowActive()) {
            window.TerminalFlows.handleLine(value);
            scrollTerminalToEnd();
          } else if (terminalInputDelegate) {
            // The `ai` assistant owns the prompt: hand it the line (it echoes
            // and answers itself), then keep the newest output in view.
            terminalInputDelegate(value);
            scrollTerminalToEnd();
          } else {
            runTerminalInput(value);
          }
        } else if (e.key === "Escape") {
          if (flowActive()) {
            // Escape aborts an in-progress flow rather than leaving — clear the
            // half-typed value too, so it isn't run as a command on next Enter.
            e.preventDefault();
            terminalInput.value = "";
            syncTerminalInputSize();
            printTerminalLine("^C", "terminal-session__out");
            window.TerminalFlows.cancel();
            scrollTerminalToEnd();
          } else if (terminalInputDelegate) {
            // Escape leaves the assistant (like ^C on a flow), back to the shell
            // prompt — without leaving the terminal itself.
            e.preventDefault();
            terminalInput.value = "";
            syncTerminalInputSize();
            printTerminalLine("^C", "terminal-session__out");
            releaseTerminalInput();
            scrollTerminalToEnd();
          } else if (
            e.defaultPrevented ||
            document.documentElement.classList.contains("lightbox-open") ||
            document.documentElement.hasAttribute("data-settings-panel-open")
          ) {
            // An open overlay owns this Escape — let it close first, exactly as
            // the global handler defers.
            return;
          } else if (terminalInput.value === "") {
            // Empty prompt + Escape leaves the terminal, matching the global
            // handler (which ignores events targeting inputs).
            terminalInput.blur();
            exitTerminal();
          }
        }
      });
      syncTerminalInputSize();
    }

    // ----------------------------------------------------------------------
    // Mobile key bar (accessory row)
    // The round-4 keyboard fundamentals — ↑/↓ history recall, Tab completion,
    // ^C — ride keys the on-screen keyboard doesn't have, so on touch (the
    // primary context) they're unreachable. This bar surfaces them as tappable
    // buttons while the prompt is focused, pinned just above the keyboard, plus
    // a ⌄ jump-to-prompt. Purely additive: with no bar (or no JS) the terminal
    // works exactly as before, just without recall/completion on mobile.
    // ----------------------------------------------------------------------
    var terminalKeybar = document.querySelector('[data-js="terminal-keybar"]');
    if (terminalKeybar && terminalInput) {
      // Each button reuses a handler already built above — the bar is only a
      // touch surface for them, never a second implementation.
      var KEYBAR_ACTIONS = {
        prev: function () {
          terminalRecallHistory(-1);
        },
        next: function () {
          terminalRecallHistory(1);
        },
        tab: function () {
          if (!flowActive()) {
            terminalCompleteInput();
          }
        },
        cancel: terminalCancelLine,
        bottom: scrollTerminalToEnd,
      };

      // Track the on-screen keyboard: with position:fixed;bottom:0 the bar sits
      // BEHIND the keyboard on iOS Safari (plain fixed positions against the
      // layout viewport, which the keyboard doesn't shrink). Translate it up by
      // the overlap — layout viewport minus the visual viewport — so it rides on
      // top of the keyboard. No visualViewport API → leave it pinned to the
      // bottom (still usable, just possibly overlapped).
      function positionKeybar() {
        var vv = window.visualViewport;
        if (!vv) {
          return;
        }
        var overlap = window.innerHeight - vv.height - vv.offsetTop;
        terminalKeybar.style.transform =
          "translateY(" + -Math.max(0, overlap) + "px)";
      }

      // Publish the bar's height so the prompt can reserve space for this fixed
      // overlay (terminal.css: --terminal-keybar-h). offsetHeight is 0 when the
      // bar is display:none (desktop / blurred), which zeroes the reservation.
      function updateKeybarSpace() {
        document.documentElement.style.setProperty(
          "--terminal-keybar-h",
          (terminalKeybar.offsetHeight || 0) + "px"
        );
      }

      // Keep focus on the input: a button that stole focus would close the
      // keyboard. preventDefault on pointerdown stops the field from blurring,
      // so the tap runs its action with the keyboard still up (and the bar,
      // which hides on blur, still on screen to receive the click).
      terminalKeybar.addEventListener("pointerdown", function (e) {
        if (e.target.closest("[data-keybar]")) {
          e.preventDefault();
        }
      });

      terminalKeybar.addEventListener("click", function (e) {
        var button = e.target.closest("[data-keybar]");
        if (!button) {
          return;
        }
        var action = KEYBAR_ACTIONS[button.getAttribute("data-keybar")];
        if (action) {
          action();
          // Belt-and-braces: keep the keyboard up even if a browser dropped
          // focus despite the pointerdown guard above.
          terminalInput.focus();
        }
      });

      // Shown only while the prompt is focused; CSS gates it to coarse pointers
      // so desktop (which has the real keys) never sees it.
      terminalInput.addEventListener("focus", function () {
        terminalKeybar.classList.add("is-visible");
        positionKeybar();
        updateKeybarSpace();
      });
      terminalInput.addEventListener("blur", function () {
        terminalKeybar.classList.remove("is-visible");
        document.documentElement.style.setProperty(
          "--terminal-keybar-h",
          "0px"
        );
      });

      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", function () {
          positionKeybar();
          updateKeybarSpace();
        });
        window.visualViewport.addEventListener("scroll", positionKeybar);
      }
    }

    // Floating jump-to-prompt button: appears (on any device) once the live
    // prompt scrolls out of view, so a long cat output doesn't strand you far
    // from the input. Clicking drops back to the prompt (scroll + focus). Driven
    // by an IntersectionObserver on the prompt; a scroll-listener fallback keeps
    // it working where IntersectionObserver is missing.
    var terminalJump = document.querySelector('[data-js="terminal-jump"]');
    if (terminalJump && terminalTail) {
      terminalJump.addEventListener("click", function () {
        // Focus synchronously inside the tap so iOS brings up the on-screen
        // keyboard: scrollTerminalToEnd focuses inside requestAnimationFrame,
        // which lands a frame later and loses the user-gesture, so iOS then
        // suppresses the keyboard. Focus here, then scroll onto the prompt.
        if (terminalInput && isTerminalLayout()) {
          terminalInput.focus();
        }
        scrollTerminalToEnd();
      });
      var setJumpVisible = function (promptInView) {
        // While the boot replay withholds the prompt it's display:none, which
        // the observer reads as "out of view" — don't let that surface the jump
        // button mid-boot.
        if (
          isTerminalLayout() &&
          !promptInView &&
          !document.documentElement.hasAttribute("data-terminal-replaying")
        ) {
          terminalJump.classList.add("is-visible");
        } else {
          terminalJump.classList.remove("is-visible");
        }
      };
      if (typeof window.IntersectionObserver === "function") {
        new window.IntersectionObserver(
          function (entries) {
            setJumpVisible(entries[entries.length - 1].isIntersecting);
          },
          { root: null, threshold: 0 }
        ).observe(terminalTail);
      } else {
        window.addEventListener("scroll", function () {
          var rect = terminalTail.getBoundingClientRect();
          setJumpVisible(
            rect.top < (window.innerHeight || 0) && rect.bottom > 0
          );
        });
      }
    }

    // ----------------------------------------------------------------------
    // Nav "cd" feedback
    // A full page load gives almost no signal that navigation happened. So a
    // nav click (or a typed `cd`) reads like running `cd <page>`: we stash the
    // command, and the destination page prints it as the first scrollback line
    // above its own `~/cwd$ ls nav/` prompt — the real cd→ls sequence, with no
    // scroll and no boot theater. Purely additive; navigation is never delayed.
    // ----------------------------------------------------------------------
    const TERMINAL_CD_KEY = "terminal-cd";

    function currentTerminalCwd() {
      // The LIVE working directory drives the bottom prompt and command
      // resolution. It falls back to --terminal-cwd (the frozen page cwd) until
      // the first append-only `cd` sets --terminal-live-cwd.
      var style = window.getComputedStyle(document.documentElement);
      var value = (
        style.getPropertyValue("--terminal-live-cwd") ||
        style.getPropertyValue("--terminal-cwd")
      )
        .trim()
        .replace(/^["']|["']$/g, "");
      return value || "~";
    }

    // Derive a page's cwd (~ or ~/segment) from a link href, mirroring the
    // per-page logic in head.html (strip origin, query/hash, and lang prefix).
    function hrefToCwd(href) {
      var path = String(href || "")
        .replace(/^[a-z]+:\/\/[^/]+/i, "")
        .replace(/[?#].*$/, "")
        .replace(/^\/+|\/+$/g, "");
      var lang = (
        document.documentElement.getAttribute("lang") || ""
      ).toLowerCase();
      var parts = path.split("/").filter(Boolean);
      if (parts.length && parts[0].toLowerCase() === lang) {
        parts.shift();
      }
      return parts.length ? "~/" + parts[0] : "~";
    }

    function stashTerminalCd(fromCwd, targetCwd) {
      if (fromCwd === targetCwd) {
        return; // same directory — nothing to echo
      }
      try {
        sessionStorage.setItem(
          TERMINAL_CD_KEY,
          JSON.stringify({ from: fromCwd, cmd: "cd " + targetCwd })
        );
      } catch (e) {
        /* sessionStorage unavailable — skip the echo */
      }
    }

    // Print any pending `cd` as scrollback above this page's first prompt.
    function printPendingTerminalCd() {
      if (!isTerminalLayout()) {
        return;
      }
      var raw;
      try {
        raw = sessionStorage.getItem(TERMINAL_CD_KEY);
        sessionStorage.removeItem(TERMINAL_CD_KEY);
      } catch (e) {
        return;
      }
      if (!raw) {
        return;
      }
      var data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        return;
      }
      if (!data || !data.cmd) {
        return;
      }
      var container = document.querySelector(".top-menu__container");
      var anchor = container
        ? container.querySelector(":scope > .terminal-prompt")
        : null;
      if (!container || !anchor) {
        return;
      }
      var line = document.createElement("span");
      line.className = "terminal-prompt terminal-prompt--cd";
      line.setAttribute("aria-hidden", "true");
      // Override the prompt's cwd to where we came from, so CSS renders the
      // exact PS1 (responsive compact form included) for that directory.
      line.style.setProperty("--terminal-cwd", '"' + data.from + '"');
      line.innerHTML =
        '<span class="terminal-prompt__user"></span>' +
        '<span class="terminal-prompt__host-plain"></span>' +
        '<span class="terminal-prompt__cwd"></span>' +
        '<span class="terminal-prompt__cmd"></span>';
      line.querySelector(".terminal-prompt__cmd").textContent = data.cmd;
      container.insertBefore(line, anchor);
    }

    // Nav clicks that change page read as `cd <page>` on the next screen.
    document.addEventListener("click", function (e) {
      if (
        !isTerminalLayout() ||
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      var link =
        e.target && e.target.closest
          ? e.target.closest(
              // Skip the statusbar quick-toggles — the language toggle switches
              // language, not directory, so it must not print a `cd` echo.
              ".top-menu__nav a[href]:not(.terminal-quick), " +
                ".terminal-prompt__host[href]"
            )
          : null;
      if (!link) {
        return;
      }
      var href = link.getAttribute("href");
      if (!href || href.charAt(0) === "#") {
        return;
      }
      stashTerminalCd(currentTerminalCwd(), hrefToCwd(href));
    });

    printPendingTerminalCd();

    // Posts are files: stamp each content card's title link with its slug so the
    // terminal CSS can render it as `slug.md` (an ls-row filename) instead of the
    // human title. The title stays in the DOM for screen readers + other layouts;
    // terminal.css just hides it and shows the slug. Re-run after an in-place nav.
    function terminalStampSlugs() {
      document
        .querySelectorAll(
          ".summary-card__title a[href], .article-card__title a[href], " +
            ".related-items__item .type-headline-4 a[href]"
        )
        .forEach(function (link) {
          var segs = terminalHrefSegments(link.getAttribute("href"));
          if (!segs || !segs.length) {
            return;
          }
          var slug = segs[segs.length - 1];
          // A taxonomy/section card (e.g. works' "tags") is a directory, not a
          // file — render it slug/ instead of slug.md. A post isn't in the
          // manifest, so it correctly falls through to a .md file.
          var slugEntry = terminalManifest()[slug];
          if (slug === "tags" || (slugEntry && slugEntry.kind === "dir")) {
            link.setAttribute("data-dir", slug);
          } else {
            link.setAttribute("data-slug", slug);
          }
        });
    }
    terminalStampSlugs();
    window.TerminalSlugs = { refresh: terminalStampSlugs };

    // Replay the page's boot transcript into the scrollback (after slugs are
    // stamped, so any card-derived output is ready). This is what fills the
    // terminal on load now — the server chrome/content it reads from is hidden.
    // Publish it so entering terminal via the toggle (no reload) replays it too.
    terminalBootRunner = runTerminalBootTranscript;
    runTerminalBootTranscript();

    // ----------------------------------------------------------------------
    // Public terminal seam (window.Terminal)
    // The minimal surface an external module needs to live inside the terminal
    // without reaching into this closure: write to the scrollback, run one of
    // the actions applyTerminalAction already understands, take/release the
    // prompt, and read the cwd. terminal-ai.js is the first consumer; this is
    // also the export surface a future terminal.js extraction would expose.
    // ----------------------------------------------------------------------
    window.Terminal = {
      print: function (text, opts) {
        opts = opts || {};
        printTerminalLine(
          String(text === null || text === undefined ? "" : text),
          opts.className || "terminal-session__out",
          opts.cwd
        );
      },
      echo: function (command) {
        printTerminalLine(
          String(command === null || command === undefined ? "" : command),
          "terminal-session__cmd",
          currentTerminalCwd()
        );
      },
      // Print a single clickable chip (bracketed), carrying the command it runs
      // on click via the delegated [data-cmd] handler. Used by terminal-ai.js
      // for the [report] affordance; same convention as the ls/set chips.
      printChip: function (label, cmd, opts) {
        opts = opts || {};
        if (!terminalSession) {
          return;
        }
        var line = document.createElement("span");
        line.className = "terminal-session__line terminal-session__out";
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "terminal-session__link" +
          (opts.className ? " " + opts.className : "");
        btn.textContent =
          "[" +
          String(label === null || label === undefined ? "" : label) +
          "]";
        btn.setAttribute(
          "data-cmd",
          String(cmd === null || cmd === undefined ? "" : cmd)
        );
        line.appendChild(btn);
        terminalSession.appendChild(line);
      },
      applyAction: function (action) {
        applyTerminalAction(action);
      },
      // Run a raw command line through the shell (echo + parse + apply), for a
      // real command typed inside the `ai` assistant. isCommand lets the caller
      // gate on the engine's own command vocabulary so ordinary sentences that
      // merely start with a command-like word aren't forwarded.
      run: function (raw) {
        runTerminalInput(String(raw === null || raw === undefined ? "" : raw));
      },
      isCommand: function (word) {
        return (
          TERMINAL_COMMAND_NAMES.indexOf(
            String(word === null || word === undefined ? "" : word)
              .trim()
              .toLowerCase()
          ) !== -1
        );
      },
      // Called by the theme module's setLayout() when the user switches INTO
      // the terminal layout (no page reload): play the boot theatre and replay
      // the page's boot transcript into the freshly-emptied scrollback. The
      // replay is deferred a tick so setLayout's applyLayout has flipped
      // data-layout to terminal first (runTerminalBootTranscript checks it).
      enterLayout: function () {
        playTerminalBoot();
        if (terminalBootRunner) {
          window.setTimeout(terminalBootRunner, 0);
        }
      },
      captureInput: captureTerminalInput,
      releaseInput: releaseTerminalInput,
      setPrompt: function (label, opts) {
        setFlowPrompt(label || null, opts && opts.hint);
      },
      cwd: currentTerminalCwd,
      scrollToEnd: scrollTerminalToEnd,
      isActive: isTerminalLayout,
    };

    // Publish the exit target for the top-level exitTerminal(): if you've cd'd
    // away (live cwd ≠ the loaded page's cwd), exit navigates to that page in
    // the restored layout. An in-place action (open) leaves live === page, so
    // this returns null and exit just drops back to the current URL.
    terminalNavApi = {
      exitTargetUrl: function () {
        var live = terminalCwdSegments();
        var page = terminalPageCwdSegments();
        if (!live.length || live.join("/") === page.join("/")) {
          return null;
        }
        return terminalCwdUrl(live);
      },
    };

    // Terminal layout: statusbar quick toggle that shows the resolved mode as
    // a bracketed word; clicking flips light/dark (an explicit choice, so it
    // replaces "system"). The label tracks every mode change via the
    // theme:mode-changed event, including system-preference flips.
    const terminalModeToggle = document.querySelector(
      '[data-js="terminal-mode-toggle"]'
    );
    if (terminalModeToggle) {
      const syncTerminalModeLabel = function () {
        const resolved =
          document.documentElement.getAttribute("data-mode") === "dark"
            ? "dark"
            : "light";
        const label =
          terminalModeToggle.getAttribute("data-label-" + resolved) || resolved;
        // Brackets live in the text (not pseudo-elements) so they hug the
        // label with no flex-item gaps.
        terminalModeToggle.textContent = "[" + label + "]";
      };
      syncTerminalModeLabel();
      window.addEventListener("theme:mode-changed", syncTerminalModeLabel);
      terminalModeToggle.addEventListener("click", function () {
        setMode(
          document.documentElement.getAttribute("data-mode") === "dark"
            ? "light"
            : "dark"
        );
      });
    }
  });
})();
