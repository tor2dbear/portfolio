/**
 * CSS Token Validation
 *
 * Parses all CSS files and verifies that every var() reference
 * points to a custom property that is defined somewhere in the codebase.
 * Catches broken token chains before they silently produce missing styles.
 */

const fs = require("fs");
const path = require("path");

const CSS_ROOT = path.resolve(__dirname, "../");

// ─── Allowlisted vars — not defined in CSS files, but legitimately unresolved ─

// Set by JavaScript at runtime (coty-scale.js, darkmode.js, etc.)
const JS_SET_PREFIXES = [
  "--coty-",
  "--palette-coty-",
  "--palette-pantone-",
  "--palette-custom-",
  "--coty-role-",
];
const JS_SET_EXACT = new Set([
  "--reveal-delay", // set per-element by reveal-on-scroll.js
  "--theme-transition-duration", // set/removed by darkmode.js
]);

// "API vars" — intentionally overridable by context; have CSS fallbacks defined inline
const CONTEXT_VARS = new Set([
  "--grid-overlay-color", // fallback: hsla(330, 80%, 60%, 0.08)
  "--grid-overlay-border", // fallback: hsla(330, 80%, 60%, 0.15)
  "--reveal-distance", // fallback: var(--motion-distance-md)
  "--col-sm", // set per-element for art-directed grid columns
]);

// Defined via style="" in Hugo templates — not in any CSS file
const HTML_TEMPLATE_VARS = new Set([
  "--token-size",
  "--motion-demo-duration",
  "--motion-demo-ease",
  "--motion-demo-distance",
]);

function isAllowlisted(varName) {
  if (JS_SET_EXACT.has(varName)) {
    return true;
  }
  if (CONTEXT_VARS.has(varName)) {
    return true;
  }
  if (HTML_TEMPLATE_VARS.has(varName)) {
    return true;
  }
  return JS_SET_PREFIXES.some((p) => varName.startsWith(p));
}

function getAllCssFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "__tests__") {
      results.push(...getAllCssFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".css")) {
      results.push(fullPath);
    }
  }
  return results;
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function extractDefinedVars(css) {
  const vars = new Set();
  const re = /--([\w-]+)\s*:/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    vars.add(`--${m[1]}`);
  }
  return vars;
}

function extractVarReferences(css, relPath) {
  const refs = [];
  // Capture only the primary var name — not the fallback
  const re = /var\(\s*(--([\w-]+))/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    refs.push({ name: m[1], file: relPath });
  }
  return refs;
}

describe("CSS Token Validation", () => {
  let cssFiles;
  let allDefinedVars;
  let allReferences;

  beforeAll(() => {
    cssFiles = getAllCssFiles(CSS_ROOT);
    allDefinedVars = new Set();
    allReferences = [];

    for (const file of cssFiles) {
      const css = stripComments(fs.readFileSync(file, "utf8"));
      const relPath = path.relative(CSS_ROOT, file);

      for (const v of extractDefinedVars(css)) {
        allDefinedVars.add(v);
      }
      for (const ref of extractVarReferences(css, relPath)) {
        allReferences.push(ref);
      }
    }
  });

  test("reads CSS files and collects token definitions", () => {
    expect(cssFiles.length).toBeGreaterThan(40);
    expect(allDefinedVars.size).toBeGreaterThan(100);
    expect(allReferences.length).toBeGreaterThan(50);
  });

  test("all var() references point to a defined custom property", () => {
    const broken = allReferences.filter(
      (ref) => !allDefinedVars.has(ref.name) && !isAllowlisted(ref.name)
    );
    expect(broken.map((r) => `${r.file} → ${r.name}`)).toEqual([]);
  });

  test("core semantic tokens are defined", () => {
    const required = [
      "--text-default",
      "--text-muted",
      "--text-link",
      "--surface-page",
      "--surface-default",
      "--border-default",
      "--primary",
      "--on-primary",
      "--action",
      "--on-action",
      "--state-focus",
    ];
    for (const token of required) {
      expect(allDefinedVars.has(token)).toBe(true);
    }
  });

  test("color scale steps are defined for all expected scales", () => {
    const scales = ["gray", "iris", "green", "amber", "teal", "red", "blue"];
    for (const scale of scales) {
      for (const step of [1, 9, 12]) {
        expect(allDefinedVars.has(`--${scale}-${step}`)).toBe(true);
      }
    }
  });

  test("spacing and radius primitives are defined", () => {
    const primitives = [
      "--spacing-8",
      "--spacing-16",
      "--spacing-24",
      "--radius-8",
      "--radius-16",
    ];
    for (const token of primitives) {
      expect(allDefinedVars.has(token)).toBe(true);
    }
  });
});
