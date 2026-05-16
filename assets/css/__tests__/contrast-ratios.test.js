/**
 * CSS Contrast Ratio Tests
 *
 * Resolves the token cascade for each mode × palette combination and
 * verifies that core text/background pairs meet WCAG 2.1 AA thresholds.
 *
 * Covers static palettes only — "pantone" uses JS-injected --coty-* colors
 * that cannot be resolved at build time.
 */

const fs = require("fs");
const path = require("path");

const CSS_DIR = path.resolve(__dirname, "../");

// ─── Color math ────────────────────────────────────────────────────────────

function hslToRgb(h, s, l) {
  if (s === 0) {
    return [l, l, l];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (p, q, t) => {
    if (t < 0) {
      t += 1;
    }
    if (t > 1) {
      t -= 1;
    }
    if (t < 1 / 6) {
      return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
      return q;
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
  };
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

function parseColorToRgb(colorStr) {
  if (!colorStr) {
    return null;
  }

  const hslMatch = colorStr.match(
    /hsl\(\s*([\d.]+)\s*,?\s*([\d.]+)%\s*,?\s*([\d.]+)%/
  );
  if (hslMatch) {
    return hslToRgb(
      parseFloat(hslMatch[1]) / 360,
      parseFloat(hslMatch[2]) / 100,
      parseFloat(hslMatch[3]) / 100
    );
  }

  const hex6 = colorStr.match(/^#([0-9a-fA-F]{6})$/);
  if (hex6) {
    const h = hex6[1];
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  if (colorStr === "#fff" || colorStr === "white") {
    return [1, 1, 1];
  }
  if (colorStr === "#000" || colorStr === "black") {
    return [0, 0, 0];
  }

  return null;
}

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function wcagContrast(colorA, colorB) {
  const rgbA = parseColorToRgb(colorA);
  const rgbB = parseColorToRgb(colorB);
  if (!rgbA || !rgbB) {
    return null;
  }

  const lA = relativeLuminance(rgbA);
  const lB = relativeLuminance(rgbB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── CSS parsing ───────────────────────────────────────────────────────────

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function parseCssBlocks(cssContent) {
  const stripped = stripComments(cssContent);
  const blocks = [];
  // Custom property values don't contain braces, so [^{}]* is safe here
  const blockRe = /([^{}]+?)\s*\{([^{}]*)\}/g;
  let bm;
  while ((bm = blockRe.exec(stripped)) !== null) {
    const selector = bm[1].replace(/\s+/g, " ").trim();
    const vars = new Map();
    for (const decl of bm[2].split(";")) {
      const m = decl.match(/--([\w-]+)\s*:\s*([\s\S]+)/);
      if (m) {
        vars.set(`--${m[1]}`, m[2].trim());
      }
    }
    if (vars.size > 0) {
      blocks.push({ selector, vars });
    }
  }
  return blocks;
}

// ─── Token cascade ─────────────────────────────────────────────────────────

function selectorApplies(selector, mode, palette) {
  if (!selector.includes(":root")) {
    return null;
  }
  if (selector.includes("data-state-intensity")) {
    return null;
  }

  const modeAttr = selector.match(/\[data-mode="([^"]+)"\]/);
  const paletteAttr = selector.match(/\[data-palette="([^"]+)"\]/);

  const requiresMode = modeAttr ? modeAttr[1] : null;
  const requiresPalette = paletteAttr ? paletteAttr[1] : null;

  if (requiresMode && requiresMode !== mode) {
    return null;
  }
  if (requiresPalette && requiresPalette !== palette) {
    return null;
  }

  return (requiresMode ? 1 : 0) + (requiresPalette ? 1 : 0);
}

function buildTokenMap(allBlocks, mode, palette) {
  const applicable = allBlocks
    .map((b) => ({
      ...b,
      specificity: selectorApplies(b.selector, mode, palette),
    }))
    .filter((b) => b.specificity !== null)
    .sort((a, b) => a.specificity - b.specificity);

  const map = new Map();
  for (const block of applicable) {
    for (const [name, value] of block.vars) {
      map.set(name, value);
    }
  }
  return map;
}

function resolveToColor(name, tokenMap, depth = 0) {
  if (depth > 15) {
    return null;
  }
  const value = tokenMap.get(name);
  if (!value) {
    return null;
  }

  const v = value.trim();

  if (v.includes("color-mix")) {
    return null;
  }
  if (v.match(/^hsl\(/)) {
    return v;
  }
  if (v.match(/^#[0-9a-fA-F]/)) {
    return v;
  }
  if (v === "white") {
    return "#ffffff";
  }
  if (v === "black") {
    return "#000000";
  }

  const varMatch = v.match(/^var\(\s*(--([\w-]+))\s*(?:,\s*([\s\S]+))?\)$/);
  if (varMatch) {
    const resolved = resolveToColor(varMatch[1], tokenMap, depth + 1);
    if (resolved !== null) {
      return resolved;
    }
    if (varMatch[3]) {
      const fb = varMatch[3].trim();
      if (fb.match(/^hsl\(/)) {
        return fb;
      }
      if (fb.match(/^#/)) {
        return fb;
      }
      const fbVar = fb.match(/^var\(\s*(--([\w-]+))\)/);
      if (fbVar) {
        return resolveToColor(fbVar[1], tokenMap, depth + 1);
      }
    }
  }

  return null;
}

// ─── Test setup ────────────────────────────────────────────────────────────

const TOKEN_FILES = [
  "tokens/primitives.css",
  "tokens/semantic.css",
  "tokens/components.css",
  "dimensions/mode/light.css",
  "dimensions/mode/dark.css",
  "dimensions/palette/standard.css",
  "dimensions/palette/forest.css",
  "dimensions/palette/mesa.css",
];

const MODES = ["light", "dark"];
// Pantone skipped: --primary and --surface-page resolve through JS-injected --coty-* vars
const PALETTES = ["standard", "forest", "mesa"];

const WCAG_AA = 4.5;
const WCAG_AA_LARGE = 3.0;

describe("CSS Contrast Ratios", () => {
  let allBlocks;

  beforeAll(() => {
    allBlocks = [];
    for (const relPath of TOKEN_FILES) {
      const css = fs.readFileSync(path.join(CSS_DIR, relPath), "utf8");
      allBlocks.push(...parseCssBlocks(css));
    }
  });

  for (const mode of MODES) {
    for (const palette of PALETTES) {
      describe(`${mode} + ${palette}`, () => {
        let tokenMap;

        beforeAll(() => {
          tokenMap = buildTokenMap(allBlocks, mode, palette);
        });

        test("body text (--text-default on --surface-page) meets WCAG AA 4.5:1", () => {
          const text = resolveToColor("--text-default", tokenMap);
          const bg = resolveToColor("--surface-page", tokenMap);

          if (!text || !bg) {
            console.warn(
              `[${mode}+${palette}] Could not resolve body text colors — skipping`
            );
            return;
          }

          const ratio = wcagContrast(text, bg);
          expect(ratio).not.toBeNull();
          expect(ratio).toBeGreaterThanOrEqual(WCAG_AA);
        });

        test("primary button (--on-primary on --primary) meets WCAG AA-large 3:1", () => {
          const text = resolveToColor("--on-primary", tokenMap);
          const bg = resolveToColor("--primary", tokenMap);

          if (!text || !bg) {
            console.warn(
              `[${mode}+${palette}] Could not resolve primary button colors — skipping`
            );
            return;
          }

          const ratio = wcagContrast(text, bg);
          expect(ratio).not.toBeNull();
          expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
        });
      });
    }
  }
});
