/**
 * The terminal `ai` assistant (terminal-ai.js + terminal-ai-data.js).
 *
 * Two layers are tested: classify() as a pure function over the intent data,
 * and the start()/handleLine() loop driven against a mocked window.Terminal —
 * the same small seam the real command engine (darkmode.js) publishes. Mocking
 * that seam is exactly what letting the assistant be its own module buys us:
 * no darkmode.js, no DOM chrome, just the contract.
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

  test("does not resolve a hidden project by name", () => {
    const ai = loadAi();
    // Fastighetsgalan is hidden: true — the assistant shouldn't confirm it.
    expect(ai.classify("fastighetsgalan").intent).toBeNull();
  });

  test("normalize folds Swedish diacritics and punctuation", () => {
    const ai = loadAi();
    expect(ai.normalize("Vänner, Öländska!")).toBe("vanner olandska");
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

  test("bare 'cv' opens the résumé instead of looping", () => {
    const ai = loadAi();
    const m = mockTerminal();
    window.Terminal = m.t;
    ai.start();

    m.feed("cv");

    expect(m.t.run).toHaveBeenCalledWith("cv");
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
});
