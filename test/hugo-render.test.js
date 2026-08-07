/**
 * Hugo template-render tests
 *
 * Fills the "no template-render tests exist at all" gap from
 * docs/testing-gaps.md. The whole JS suite runs in jsdom against assets/js and
 * the CSS suite only checks contrast, so two pure-template regressions shipped
 * with nothing able to catch them:
 *
 *   A. layouts/_default/summary-employer.html leaked template whitespace into
 *      the employer-view href query string (?view=employer\n  &ref=...).
 *   B. layouts/partials/settings-dropdown.html linked the language switcher to
 *      `hidden` (noindex) translation stubs.
 *
 * How this works: test/fixture/ is a tiny self-contained Hugo
 * site with probe layouts that render the two real templates in isolation. We
 * assemble a throwaway copy of it, inject the *current* real templates and the
 * real i18n/ dir, run `hugo`, and assert on the emitted HTML. Because the probe
 * layouts skip the site chrome, no images/CSS are processed and the build is
 * ~30ms.
 *
 * Hugo is not part of `npm install`; it is provisioned separately (CI sets it
 * up before `npm test`; locally you need it on PATH or HUGO_PATH). When it is
 * absent the suite skips rather than fails, so `npm test` stays green for
 * contributors without Hugo.
 *
 * NB: this fixture lives in test/, NOT under layouts/ — Hugo parses every file
 * under layouts/ as a template, so probe layouts and .test.js files there break
 * the production build (Go-template syntax like `{{-` in a JS comment aborts
 * `hugo --minify`). Keep all Hugo-render test material out of layouts/.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const FIXTURE_DIR = path.join(__dirname, "fixture");
const HUGO_BIN = process.env.HUGO_PATH || "hugo";

function hugoAvailable() {
  try {
    const res = spawnSync(HUGO_BIN, ["version"], { encoding: "utf8" });
    return res.status === 0;
  } catch {
    return false;
  }
}

// Parse an HTML string into a queryable document using the jsdom environment
// Jest already provides. Attribute values (crucially, href) keep any embedded
// whitespace/newlines, which is exactly what the gap-A assertion looks for.
function parse(html) {
  return new DOMParser().parseFromString(html, "text/html");
}

const describeOrSkip = hugoAvailable() ? describe : describe.skip;

if (!hugoAvailable()) {
  console.warn(
    `[hugo-render.test] Hugo not found (tried "${HUGO_BIN}"); skipping template-render tests. Set HUGO_PATH or install Hugo to run them.`
  );
}

describeOrSkip("Hugo template rendering", () => {
  let buildDir;
  let publicDir;

  beforeAll(() => {
    buildDir = fs.mkdtempSync(path.join(os.tmpdir(), "hugo-render-"));

    // 1. Copy the checked-in fixture site (config, probe layouts, stubs, content).
    fs.cpSync(FIXTURE_DIR, buildDir, { recursive: true });

    // 2. Inject the *real* templates under test so the fixture always guards
    //    the current files, not a stale copy.
    fs.cpSync(
      path.join(REPO_ROOT, "layouts/_default/summary-employer.html"),
      path.join(buildDir, "layouts/_default/summary-employer.html")
    );
    fs.cpSync(
      path.join(REPO_ROOT, "layouts/partials/settings-dropdown.html"),
      path.join(buildDir, "layouts/partials/settings-dropdown.html")
    );
    fs.cpSync(
      path.join(REPO_ROOT, "layouts/partials/terminal-manifest.html"),
      path.join(buildDir, "layouts/partials/terminal-manifest.html")
    );

    // 3. Inject the real i18n/ dir — settings-dropdown.html calls i18n on many
    //    keys and we want the real ones, not a drifting duplicate.
    fs.cpSync(path.join(REPO_ROOT, "i18n"), path.join(buildDir, "i18n"), {
      recursive: true,
    });

    publicDir = path.join(buildDir, "public");
    const res = spawnSync(
      HUGO_BIN,
      ["--source", buildDir, "--destination", publicDir],
      { encoding: "utf8" }
    );
    if (res.status !== 0) {
      throw new Error(
        `Hugo build failed (status ${res.status}):\n${res.stdout}\n${res.stderr}`
      );
    }
  });

  afterAll(() => {
    if (buildDir) {
      fs.rmSync(buildDir, { recursive: true, force: true });
    }
  });

  function readOutput(relPath) {
    return fs.readFileSync(path.join(publicDir, relPath), "utf8");
  }

  describe("summary-employer.html employer-view href (gap A)", () => {
    test("query string contains no leaked template whitespace", () => {
      const doc = parse(readOutput("employer-fixture/index.html"));
      const links = doc.querySelectorAll(
        '#employer-summaries a[href*="view=employer"]'
      );

      expect(links.length).toBeGreaterThan(0);
      links.forEach((a) => {
        const href = a.getAttribute("href");
        // The bug rendered ?view=employer\n          &ref=fixtureco\n
        expect(href).not.toMatch(/\s/);
        expect(href).toContain("?view=employer&ref=fixtureco");
      });
    });
  });

  describe("settings-dropdown.html language switcher (gap B)", () => {
    test("hidden-only translation shows no switcher and no link to the stub", () => {
      const html = readOutput("lang-hidden/index.html");
      const doc = parse(html);

      // Whole language section is suppressed when the only counterpart is hidden.
      expect(doc.querySelector("#settings .language-list")).toBeNull();
      // And nothing links to the hidden /sv/ stub.
      expect(html).not.toContain("/sv/lang-hidden/");
    });

    test("visible translation is still linked (filter is not too greedy)", () => {
      const doc = parse(readOutput("lang-visible/index.html"));

      const list = doc.querySelector("#settings .language-list");
      expect(list).not.toBeNull();

      const svOption = list.querySelector(
        '[data-language-href="/sv/lang-visible/"]'
      );
      expect(svOption).not.toBeNull();
      // A real translation link, not the "also on homepage" fallback.
      expect(list.querySelector(".language-option--fallback")).toBeNull();
    });
  });

  describe("terminal-manifest.html section/page classification", () => {
    // The manifest is site-global (per language); read it off any rendered page.
    function manifestOf(relPath) {
      const doc = parse(readOutput(relPath));
      const el = doc.querySelector('[data-js="terminal-manifest"]');
      return JSON.parse(el.textContent);
    }
    function manifest() {
      return manifestOf("lang-visible/index.html"); // English site
    }

    test("emits valid JSON mapping segments to {kind, url}", () => {
      const m = manifest();
      expect(m["employer-fixture"]).toMatchObject({
        kind: "dir",
        url: "/employer-fixture/",
      });
      expect(m["lang-visible"]).toMatchObject({ kind: "file" });
      expect(m["lang-visible"].url).toBe("/lang-visible/");
    });

    test("a section's terminal_kind param overrides the default 'dir'", () => {
      expect(manifest()["docs"]).toMatchObject({ kind: "action" });
    });

    test("widened to the full tree: a section's nested post is a file, keyed by its logical path", () => {
      const m = manifest();
      // sample-work lives at employer-fixture/sample-work/ — a depth-2 page the
      // old top-level-only manifest never emitted. It's now a file under its
      // section, keyed by the logical path (section name + tail), not flattened
      // to a bare slug.
      expect(m["employer-fixture/sample-work"]).toMatchObject({
        kind: "file",
        url: "/employer-fixture/sample-work/",
      });
      expect(m).not.toHaveProperty("sample-work");
    });

    test("exempt sections and hidden pages are left out entirely", () => {
      const m = manifest();
      expect(m).not.toHaveProperty("tools"); // terminal_kind: exempt
      expect(m).not.toHaveProperty("hidden-page"); // terminal_kind: hidden
    });

    test("a hidden page with no visible translation is left out (client-only works)", () => {
      const m = manifest();
      // employer-fixture/hidden-work sets `hidden: true` with no terminal_kind
      // and no translation — an orphan, like a client-only works project (hidden
      // in both languages). It must not leak, while its sibling stays present.
      expect(m).not.toHaveProperty("employer-fixture/hidden-work");
      expect(m).toHaveProperty("employer-fixture/sample-work");
    });

    test("a hidden writing stub is kept under its sv key but points at the visible English article", () => {
      // sv/texter/sv-note is hidden, but it's in the texter section and its
      // English translation (en/writing/en-note) is public — an English-only
      // article surfaced by the /texter/ list. The node stays under the Swedish
      // logical path, but url/title come from the English article so cat/open
      // fetch the public content, not the unpublished Swedish stub body.
      const sv = manifestOf("sv/lang-visible/index.html");
      expect(sv["texter/sv-note"]).toMatchObject({
        kind: "file",
        url: "/writing/en-note/",
        title: "EN Note",
      });
    });

    test("the translation exception is scoped to writing — a hidden page in another section is still dropped", () => {
      // sv/lang-hidden is hidden with a visible en translation, but it's NOT in
      // writing/texter, so the /texter/ fallback doesn't apply. It must stay out
      // — this is what keeps a works project hidden in only one language (whose
      // works.html list also filters it) from reappearing in ls/tree.
      const sv = manifestOf("sv/lang-visible/index.html");
      expect(sv).not.toHaveProperty("lang-hidden");
    });
  });
});
