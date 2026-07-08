/**
 * Layout spacing guard
 *
 * Locks in the "composition spacing goes through the --layout-* contract" rule so
 * it can't silently regress: section/hero padding and the article inter-card
 * margin must read layout tokens (not raw --spacing), the fluid clamps must use
 * the shared range, and the block-rhythm family must scale via --layout-block-scale.
 * See docs/layout-dimension-plan.md ("layout-tied vs constant").
 */

const fs = require("fs");
const path = require("path");

const CSS_ROOT = path.resolve(__dirname, "../");
const read = (rel) => fs.readFileSync(path.join(CSS_ROOT, rel), "utf8");

// Grab the body of the first FLAT rule (no nested braces) whose selector matches.
function flatRuleBody(css, selectorRegexSrc) {
  const m = css.match(new RegExp(selectorRegexSrc + "\\s*\\{([^{}]*)\\}"));
  return m ? m[1] : null;
}
const declaration = (body, prop) => {
  const m =
    body &&
    body.match(new RegExp("(?:^|[;{\\s])" + prop + "\\s*:\\s*([^;]+);"));
  return m ? m[1].trim() : null;
};

describe("layout spacing contract", () => {
  test("fluid range + block-scale knob are defined once in semantic.css", () => {
    const semantic = read("tokens/semantic.css");
    expect(semantic).toMatch(/--fluid-floor:/);
    expect(semantic).toMatch(/--fluid-span:/);
    // Composition density is its own knob, defaulting to prose rhythm.
    expect(semantic).toMatch(
      /--layout-block-scale:\s*var\(--layout-prose-rhythm\)/
    );
  });

  test("block-rhythm tokens scale via --layout-block-scale (not raw / not prose)", () => {
    const semantic = read("tokens/semantic.css");
    for (const token of [
      "--layout-block-gap",
      "--layout-title-gap",
      "--layout-label-gap",
      "--layout-card-gap",
    ]) {
      const def = declaration(semantic, token);
      expect(def).toBeTruthy();
      expect(def).toContain("--layout-block-scale");
    }
  });

  test("every layout's section/hero rhythm is a fluid clamp on the shared range", () => {
    const files = [
      "tokens/semantic.css", // column default
      "dimensions/layout/editorial.css",
      "dimensions/layout/index.css",
      "dimensions/layout/terminal.css",
    ];
    for (const file of files) {
      const css = read(file);
      for (const token of ["--layout-section-rhythm", "--layout-hero-rhythm"]) {
        const def = declaration(css, token);
        expect(`${file} ${token} → ${def}`).toMatch(/clamp\(/);
        // endpoints must ride the --spacing-* scale, interpolation the shared range
        expect(def).toContain("var(--spacing-");
        expect(def).toContain("var(--fluid-floor)");
        expect(def).toContain("var(--fluid-span)");
      }
    }
  });

  test("home section/hero padding reads the layout tokens, never raw --spacing", () => {
    const home = read("pages/home.css");
    expect(
      declaration(flatRuleBody(home, "\\.home-section"), "padding")
    ).toContain("--layout-section-rhythm");
    expect(
      declaration(flatRuleBody(home, "\\.hero-section"), "padding")
    ).toContain("--layout-hero-rhythm");
    // The removed anti-pattern: a raw spacing padding override on the section/hero
    // (e.g. `padding: var(--spacing-48) 0`) bypassing the layout token.
    expect(home).not.toMatch(/padding:\s*var\(--spacing-\d+\)\s+0\s*;/);
  });

  test("global article inter-card margin reads --layout-card-gap", () => {
    const card = read("components/article-card.css");
    expect(
      declaration(flatRuleBody(card, "\\barticle"), "margin-bottom")
    ).toContain("--layout-card-gap");
  });
});
