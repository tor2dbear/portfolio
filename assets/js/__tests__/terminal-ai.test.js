/**
 * The terminal `ai` assistant (terminal-ai.js + terminal-ai-data.js).
 *
 * Two layers are tested: classify() as a pure function over the intent data,
 * and the start()/handleLine() loop driven against a mocked window.Terminal —
 * the same small seam the real command engine (terminal.js) publishes. Mocking
 * that seam is exactly what letting the assistant be its own module buys us:
 * no terminal.js, no DOM chrome, just the contract.
 */

// Load the data + engine fresh each time so the module-scoped `active` flag
// never leaks between tests.
function loadAi() {
  let api;
  jest.isolateModules(() => {
    require("../terminal-ai-data.js");
    api = require("../terminal-ai.js");
  });
  return api;
}

// A stand-in for window.Terminal that records prints and remembers the input
// delegate, so a test can feed lines the way the Enter handler would.
function mockTerminal() {
  let delegate = null;
  let onRelease = null;
  const prints = [];
  const t = {
    print: jest.fn((text, opts) => {
      prints.push({ text: text, className: opts && opts.className });
    }),
    echo: jest.fn(),
    applyAction: jest.fn(),
    captureInput: jest.fn((handler, rel) => {
      delegate = handler;
      onRelease = rel;
    }),
    releaseInput: jest.fn(() => {
      const cb = onRelease;
      delegate = null;
      onRelease = null;
      if (cb) {
        cb();
      }
    }),
    setPrompt: jest.fn(),
    printChip: jest.fn((label, cmd, opts) => {
      prints.push({
        text: "[" + label + "]",
        cmd: cmd,
        chip: true,
        opts: opts,
      });
    }),
    cwd: jest.fn(() => "~"),
    scrollToEnd: jest.fn(),
    isActive: jest.fn(() => true),
    // A stand-in for the engine's command vocabulary.
    isCommand: jest.fn((word) =>
      ["cv", "cd", "ls", "cat", "open", "help", "clear", "pantone"].includes(
        String(word || "").toLowerCase()
      )
    ),
    run: jest.fn(),
  };
  return {
    t: t,
    prints: prints,
    feed: (value) => delegate && delegate(value),
    hasDelegate: () => Boolean(delegate),
    text: () => prints.map((p) => p.text).join("\n"),
  };
}

function setLang(lang) {
  document.documentElement.setAttribute("lang", lang);
}

beforeEach(() => {
  setLang("sv");
  // Reduced motion → boot prints synchronously, so tests need no fake timers.
  document.documentElement.setAttribute("data-effect-reduced-motion", "on");
  delete window.Terminal;
});

describe("classify", () => {
  test("routes a projects question to the projects intent", () => {
    const ai = loadAi();
    expect(ai.classify("vad finns det för projekt?").intent.id).toBe(
      "projects"
    );
    expect(ai.classify("show me your work").intent.id).toBe("projects");
  });

  test("resolves a category entity inside projects", () => {
    const ai = loadAi();
    const r = ai.classify("har du gjort något branding?");
    expect(r.intent.id).toBe("projects");
    expect(r.entity && r.entity.id).toBe("brand");
  });

  test("resolves a writing topic entity", () => {
    const ai = loadAi();
    const r = ai.classify("har du skrivit något om css?");
    expect(r.intent.id).toBe("writing");
    expect(r.entity && r.entity.id).toBe("css");
  });

  test("recognises contact, hire and newsletter intents", () => {
    const ai = loadAi();
    expect(ai.classify("hur når jag dig?").intent.id).toBe("contact");
    expect(ai.classify("kan jag anlita dig för ett uppdrag?").intent.id).toBe(
      "hire"
    );
    expect(ai.classify("jag vill prenumerera på nyhetsbrevet").intent.id).toBe(
      "newsletter"
    );
  });

  test("routes 'work' questions by context, not to projects", () => {
    const ai = loadAi();
    expect(ai.classify("is torbjörn available for work?").intent.id).toBe(
      "hire"
    );
    expect(ai.classify("where do torbjörn work?").intent.id).toBe(
      "current-job"
    );
    // But portfolio phrasing still reaches projects.
    expect(ai.classify("show me your work").intent.id).toBe("projects");
  });

  test("answers bio questions", () => {
    const ai = loadAi();
    expect(ai.classify("vem är du?").intent.id).toBe("who");
    expect(ai.classify("var bor du?").intent.id).toBe("location");
    expect(ai.classify("var har du pluggat?").intent.id).toBe("education");
  });

  test("is honest about not being a real AI", () => {
    const ai = loadAi();
    expect(ai.classify("är du en riktig ai?").intent.id).toBe("real-ai");
    expect(ai.classify("are you chatgpt?").intent.id).toBe("real-ai");
  });

  test("falls back when nothing matches", () => {
    const ai = loadAi();
    expect(ai.classify("qwertyuiop zxcvbnm").intent).toBeNull();
  });

  test("'do you speak X?' is a question (languages), not a switch request", () => {
    const ai = loadAi();
    // All three language-ability questions route the same way — 'swedish' used
    // to fall through to switch-swedish and silently change the site language.
    expect(ai.classify("do you speak english?").intent.id).toBe("languages");
    expect(ai.classify("do you speak swedish?").intent.id).toBe("languages");
    expect(ai.classify("do you speak german?").intent.id).toBe("languages");
    expect(ai.classify("talar du svenska?").intent.id).toBe("languages");
    // But an imperative request still switches the site (not too greedy).
    expect(ai.classify("swedish please").intent.id).toBe("switch-swedish");
    expect(ai.classify("switch to swedish").intent.id).toBe("switch-swedish");
  });

  test("routes a favourite question to the favourite intent", () => {
    const ai = loadAi();
    expect(ai.classify("any favourit essay?").intent.id).toBe("favourite");
    expect(ai.classify("vilket är ditt bästa jobb?").intent.id).toBe(
      "favourite"
    );
  });

  test("routes 'open one' to open-help, not the writing blurb", () => {
    const ai = loadAi();
    expect(ai.classify("can you open one of the text?").intent.id).toBe(
      "open-help"
    );
  });

  test("resolves a public project by name via the title slot", () => {
    const ai = loadAi();
    const utblick = ai.classify("utblick");
    expect(utblick.intent.id).toBe("projects");
    expect(utblick.entity && utblick.entity.slug).toBe("utblick-no2");

    const things = ai.classify("things in a conversation");
    expect(things.entity && things.entity.slug).toBe(
      "things-in-a-conversation"
    );
  });

  test("routes 'list them' to projects", () => {
    const ai = loadAi();
    expect(ai.classify("can you list them?").intent.id).toBe("projects");
  });

  test("does not resolve a hidden project by name", () => {
    const ai = loadAi();
    // Fastighetsgalan is hidden: true — the assistant shouldn't confirm it.
    expect(ai.classify("fastighetsgalan").intent).toBeNull();
  });

  test("normalize folds Swedish diacritics and punctuation", () => {
    const ai = loadAi();
    expect(ai.normalize("Vänner, Öländska!")).toBe("vanner olandska");
  });

  test("routes switch-language requests to the switch intents", () => {
    const ai = loadAi();
    expect(ai.classify("switch to swedish").intent.id).toBe("switch-swedish");
    expect(ai.classify("language swedish").intent.id).toBe("switch-swedish");
    expect(ai.classify("kan du byta språk till svenska?").intent.id).toBe(
      "switch-swedish"
    );
    expect(ai.classify("switch to english").intent.id).toBe("switch-english");
    expect(ai.classify("kan vi ta det på engelska?").intent.id).toBe(
      "switch-english"
    );
  });

  test("a German request is handled honestly, not routed to switch", () => {
    const ai = loadAi();
    expect(ai.classify("okej. kan du säga nånting på tyska?").intent.id).toBe(
      "german"
    );
    expect(ai.classify("switch to german").intent.id).toBe("german");
  });

  test("'do you speak X' still describes languages, not a switch", () => {
    const ai = loadAi();
    // The question about ability stays with the `languages` intent even though
    // the switch intents own the bare language names.
    expect(ai.classify("what languages do you speak?").intent.id).toBe(
      "languages"
    );
    expect(ai.classify("do you speak german?").intent.id).toBe("languages");
  });

  test("time and date questions point at the date command", () => {
    const ai = loadAi();
    expect(ai.classify("what time is it?").intent.id).toBe("time");
    expect(ai.classify("vad är klockan?").intent.id).toBe("time");
    expect(ai.classify("what date is it?").intent.id).toBe("time");
  });

  test("'how is this page built' reaches the colophon", () => {
    const ai = loadAi();
    expect(ai.classify("how is this page build?").intent.id).toBe("colophon");
    expect(ai.classify("how is this page built?").intent.id).toBe("colophon");
    expect(ai.classify("hur är den här sidan byggd?").intent.id).toBe(
      "colophon"
    );
  });
});

describe("start / handleLine loop", () => {
  test("boots, captures the prompt, and greets", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;

    ai.start();

    expect(m.t.captureInput).toHaveBeenCalled();
    expect(m.t.setPrompt).toHaveBeenCalledWith(
      "you>",
      expect.objectContaining({ hint: expect.any(String) })
    );
    expect(ai.isActive()).toBe(true);
    // The last boot line mentions it's rule-based, not an LLM (Swedish default).
    expect(m.text()).toContain("ingen LLM");
  });

  test("answers a question fed through the delegate", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("vad finns det för projekt?");

    expect(m.text()).toContain("11 projekt");
    // The user's line is echoed in the you> style.
    expect(m.text()).toContain("you> vad finns det för projekt?");
  });

  test("hands off to the contact flow and stops owning input", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("hur når jag dig?");

    expect(m.t.applyAction).toHaveBeenCalledWith({
      type: "flow",
      flow: "contact",
    });
    expect(m.t.releaseInput).toHaveBeenCalled();
    expect(ai.isActive()).toBe(false);
  });

  test("prefaces a verbatim repeat instead of echoing silently", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("vad finns det för projekt?");
    m.feed("vad finns det för projekt?");

    // The generic projects reply appears both times...
    expect(m.text().match(/11 projekt/g)).toHaveLength(2);
    // ...but the second is prefaced as a noticed repeat.
    expect(m.text()).toContain("du frågade nyss");
  });

  test("does not treat a different entity as a repeat", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("har du skrivit något?");
    m.feed("har du skrivit något om css?");

    expect(m.text()).not.toContain("du frågade nyss");
  });

  test("runs a real command and stays in the assistant", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("cd works");

    expect(m.t.run).toHaveBeenCalledWith("cd works");
    // Acknowledged, not chatted at, and the assistant stays put (no hand-off).
    expect(m.text()).toContain("visst");
    expect(m.text()).not.toContain("you> cd works");
    expect(m.t.releaseInput).not.toHaveBeenCalled();
    expect(ai.isActive()).toBe(true);
  });

  test("a switch-to-swedish request runs `lang sv` and stays put", () => {
    setLang("en");
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("switch to swedish");

    // The reply is printed, then the real command runs — the page load that
    // follows ends the session, so the assistant does not release input here.
    expect(m.text()).toContain("switching to Swedish");
    expect(m.t.run).toHaveBeenCalledWith("lang sv");
    expect(m.t.releaseInput).not.toHaveBeenCalled();
    expect(ai.isActive()).toBe(true);
  });

  test("a German request replies honestly and runs no command", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("kan du säga nånting på tyska?");

    expect(m.text().toLowerCase()).toContain("tyskan");
    expect(m.t.run).not.toHaveBeenCalled();
    expect(m.t.applyAction).not.toHaveBeenCalled();
    expect(ai.isActive()).toBe(true);
  });

  test("bare 'cv' opens the résumé instead of looping", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("cv");

    expect(m.t.run).toHaveBeenCalledWith("cv");
  });

  test("does not forward a natural sentence that starts with a command word", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("open a project"); // a request, not `open <slug>`
    m.feed("open things in a conversation?"); // a question about a project

    expect(m.t.run).not.toHaveBeenCalled();
    // The first is guided by open-help; the second resolves the project (sv).
    expect(m.text()).toContain("bläddra med");
    expect(m.text()).toContain("Things in a Conversation");
  });

  test("does not forward 'help' or a plain sentence", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("help");
    m.feed("what do you do?");

    expect(m.t.run).not.toHaveBeenCalled();
    expect(ai.isActive()).toBe(true);
  });

  test("'exit' leaves the assistant rather than forwarding", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("exit");

    expect(m.t.run).not.toHaveBeenCalled();
    expect(m.text()).toContain("hej då");
    expect(ai.isActive()).toBe(false);
  });

  test("exit prints the farewell and releases the prompt", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("exit");

    expect(m.t.releaseInput).toHaveBeenCalled();
    expect(ai.isActive()).toBe(false);
    expect(m.text()).toContain("hej då");
  });

  test("brand category doesn't volunteer hidden project names", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("har du gjort något branding?");

    expect(m.text()).not.toContain("Fastighetsgalan");
    expect(m.text()).not.toContain("Nylokal");
    expect(m.text().toLowerCase()).toContain("arbetsgivarsidorna");
  });

  test("asks for clarification on an ambiguous terse input", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("css?");

    // "css" ties code (does he know it) and writing (has he written about it).
    expect(m.text()).toContain("Menar du");
    expect(m.text()).toContain("om han kan det");
    expect(m.text()).toContain("vad han skrivit om det");
    // A follow-up that disambiguates gets a real answer, no clarify.
    m.feed("skrivit om css");
    expect(m.text()).toContain("The Grid, Inherited");
  });

  test("prints an English reply when the document is in English", () => {
    setLang("en");
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("what do you do?");

    expect(m.text()).toContain("A designer at heart");
  });

  test("start is inert when the seam is absent", () => {
    const ai = loadAi();
    expect(() => ai.start()).not.toThrow();
    expect(ai.isActive()).toBe(false);
  });

  test("prints a [report] chip on a fallback, not on a real answer", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    // A confident answer gets no chip (it answered) …
    m.feed("vad finns det för projekt?");
    expect(m.t.printChip).not.toHaveBeenCalled();

    // … but a fallback (clanker couldn't answer) does — carrying `report`.
    m.feed("qwertyuiop zxcvbnm");
    expect(m.t.printChip).toHaveBeenCalledWith(
      expect.any(String),
      "report",
      expect.any(Object)
    );
  });

  test("report() POSTs the last exchange and confirms", () => {
    const fetchMock = jest.fn(() => Promise.resolve({ ok: true }));
    window.fetch = fetchMock;
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();
    m.feed("vad finns det för projekt?");
    ai.report("borde nämna X");

    expect(fetchMock).toHaveBeenCalled();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.type).toBe("report");
    expect(body.query).toBe("vad finns det för projekt?");
    expect(body.note).toBe("borde nämna X");
    expect(body.intent).toBe("projects");
    // Confirmation printed (Swedish default).
    expect(m.text().toLowerCase()).toContain("tack");
    delete window.fetch;
  });

  test("report() with nothing asked yet says so and does not POST", () => {
    const fetchMock = jest.fn(() => Promise.resolve({ ok: true }));
    window.fetch = fetchMock;
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();
    ai.report("");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(m.text().toLowerCase()).toContain("inget att rapportera");
    delete window.fetch;
  });

  test("auto-logs an unmatched question as a miss, deduped per session", () => {
    const fetchMock = jest.fn(() => Promise.resolve({ ok: true }));
    window.fetch = fetchMock;
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("what is the meaning of life?");
    m.feed("what is the meaning of life?"); // same miss again → not re-sent
    const misses = fetchMock.mock.calls.filter(
      (c) => JSON.parse(c[1].body).type === "miss"
    );
    expect(misses).toHaveLength(1);
    expect(JSON.parse(misses[0][1].body).kind).toBe("fallback");
    delete window.fetch;
  });
});
