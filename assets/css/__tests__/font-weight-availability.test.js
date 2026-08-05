/**
 * Font-weight availability guard
 *
 * Switzer (our sans, --font-sans / --font-ui / --font-heading) ships only the
 * weights whose woff2 files exist in assets/fonts (currently 400 and 500).
 * Asking for any other weight on a Switzer element makes the browser SYNTHESISE
 * a faux-bold, which looks heavier and subtly wrong next to genuine weights.
 *
 * This test fails if any CSS rule sets a Switzer font-family together with a
 * numeric font-weight that Switzer does not actually ship. It caught a real
 * regression (a CV role set to font-weight: 600).
 *
 * Note: it only inspects rules that co-locate font-family + a numeric
 * font-weight in the same block. Weight-only utility classes (.font-bold, etc.)
 * and token indirection (var(--sans-weight-bold)) are out of scope here — the
 * latter is guarded at the token level by the sans-weight-token test below.
 */

const fs = require("fs");
const path = require("path");

const CSS_ROOT = path.resolve(__dirname, "../");
const FONTS_DIR = path.resolve(__dirname, "../../fonts");

// Family tokens (and the literal name) that resolve to Switzer.
const SANS_FONT_TOKENS = ["--font-sans", "--font-ui", "--font-heading"];

function getAllCssFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "__tests__") {
      results.push(...getAllCssFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".css")) {
      results.push(full);
    }
  }
  return results;
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

// Weights Switzer actually ships, parsed from the woff2 filenames
// (e.g. switzer-latin-500-normal.woff2 → 500).
function switzerShippedWeights() {
  const weights = new Set();
  for (const file of fs.readdirSync(FONTS_DIR)) {
    const m = /switzer-.*?-(\d{3})-/.exec(file);
    if (m) {
      weights.add(Number(m[1]));
    }
  }
  return weights;
}

// Declaration blocks only (innermost { ... } with no nested braces), so @media
// wrappers are skipped and each rule body is inspected on its own.
function eachRuleBlock(css, cb) {
  const re = /([^{}]*)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    cb(m[1].trim(), m[2]);
  }
}

function usesSansFamily(body) {
  const fam = /font-family\s*:\s*([^;]+)/i.exec(body);
  if (!fam) {
    return false;
  }
  const value = fam[1];
  if (/\bSwitzer\b/i.test(value)) {
    return true;
  }
  return SANS_FONT_TOKENS.some((tok) => value.includes(tok));
}

describe("Font-weight availability", () => {
  let cssFiles;
  let switzerWeights;

  beforeAll(() => {
    cssFiles = getAllCssFiles(CSS_ROOT);
    switzerWeights = switzerShippedWeights();
  });

  test("Switzer ships the weights we expect (400 + 500)", () => {
    expect(switzerWeights.has(400)).toBe(true);
    expect(switzerWeights.has(500)).toBe(true);
  });

  test("no Switzer rule requests a weight Switzer does not ship", () => {
    const violations = [];

    for (const file of cssFiles) {
      const css = stripComments(fs.readFileSync(file, "utf8"));
      const rel = path.relative(CSS_ROOT, file);

      eachRuleBlock(css, (selector, body) => {
        if (!usesSansFamily(body)) {
          return;
        }
        const wm = /font-weight\s*:\s*(\d{3})/i.exec(body);
        if (!wm) {
          return;
        }
        const weight = Number(wm[1]);
        if (!switzerWeights.has(weight)) {
          violations.push(
            `${rel} → "${selector}" sets Switzer font-weight ${weight} ` +
              `(available: ${[...switzerWeights].sort().join(", ")})`
          );
        }
      });
    }

    expect(violations).toEqual([]);
  });

  test("--sans-weight-* tokens map to weights Switzer actually ships", () => {
    // Root-cause guard for token indirection: a --sans-weight-* value that
    // Switzer doesn't ship faux-bolds everywhere the token is used.
    const primitives = fs.readFileSync(
      path.join(CSS_ROOT, "tokens/primitives.css"),
      "utf8"
    );
    const re = /--sans-weight-([\w-]+)\s*:\s*(\d{3})/g;
    const offenders = [];
    let m;
    while ((m = re.exec(primitives)) !== null) {
      const weight = Number(m[2]);
      if (!switzerWeights.has(weight)) {
        offenders.push(`--sans-weight-${m[1]}: ${weight}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
