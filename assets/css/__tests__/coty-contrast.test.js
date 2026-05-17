/**
 * COTY Contrast Ratio Tests
 *
 * Resolves CSS role-tokens for every Pantone Color of the Year × mode
 * combination and verifies that the key text/background pairs meet WCAG 2.1 AA.
 *
 * Token resolution mirrors the CSS template in assets/templates/coty-scales.css:
 *   - surface years: --coty-role-surface → --coty-{anchor_step}
 *   - primary years: --coty-role-primary → --coty-{anchor_step} (light) / --coty-{source_step_dark} (dark)
 *
 * Semantic token chain (from pantone.css):
 *   --text-default  → --coty-12
 *   --surface-page  → --coty-role-surface
 *   --primary       → --coty-role-primary
 *   --on-primary    → --coty-role-on-primary
 */

const { execSync } = require("child_process");
const path = require("path");

const TOML_PATH = path.resolve(__dirname, "../../../data/pantone-coty.toml");
const WCAG_AA = 4.5;
const WCAG_AA_LARGE = 3.0;

// ─── Color math ────────────────────────────────────────────────────────────

function oklchToLinearRgb(l, c, h) {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  return [
    4.076741662 * l_ ** 3 - 3.307711591 * m_ ** 3 + 0.230969929 * s_ ** 3,
    -1.268438005 * l_ ** 3 + 2.609757401 * m_ ** 3 - 0.341319396 * s_ ** 3,
    -0.004196086 * l_ ** 3 - 0.703418615 * m_ ** 3 + 1.707614701 * s_ ** 3,
  ];
}

function parseColorToRgb(str) {
  if (!str) {
    return null;
  }

  const oklch = str.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/);
  if (oklch) {
    const linear = oklchToLinearRgb(
      parseFloat(oklch[1]) / 100,
      parseFloat(oklch[2]),
      parseFloat(oklch[3])
    );
    return linear.map((c) => {
      const v = Math.max(0, Math.min(1, c));
      return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    });
  }

  const hsl = str.match(/hsl\(\s*([\d.]+)\s*,?\s*([\d.]+)%\s*,?\s*([\d.]+)%/);
  if (hsl) {
    const h = parseFloat(hsl[1]) / 360;
    const s = parseFloat(hsl[2]) / 100;
    const l = parseFloat(hsl[3]) / 100;
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
    return [
      hue2rgb(p, q, h + 1 / 3),
      hue2rgb(p, q, h),
      hue2rgb(p, q, h - 1 / 3),
    ];
  }

  const hex6 = str.match(/^#([0-9a-fA-F]{6})$/);
  if (hex6) {
    const h = hex6[1];
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
  }

  if (str === "#fff" || str === "white") {
    return [1, 1, 1];
  }
  if (str === "#000" || str === "black") {
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

function wcagContrast(a, b) {
  const rgbA = parseColorToRgb(a);
  const rgbB = parseColorToRgb(b);
  if (!rgbA || !rgbB) {
    return null;
  }
  const lA = relativeLuminance(rgbA);
  const lB = relativeLuminance(rgbB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── TOML loading ──────────────────────────────────────────────────────────

function loadCotyData() {
  const json = execSync(
    `python3 -c "import tomllib, json, sys; data = tomllib.load(open('${TOML_PATH}', 'rb')); print(json.dumps(data))"`,
    { encoding: "utf8" }
  );
  return JSON.parse(json);
}

// ─── Token resolution ──────────────────────────────────────────────────────

// Mirrors assets/templates/coty-scales.css role-token logic.
function buildCotyTokenMap(colorEntry, mode) {
  const scale =
    mode === "dark" ? colorEntry.scale_dark : colorEntry.scale_light;
  if (!scale) {
    return null;
  }

  const tokens = new Map();

  // Load the 12 scale steps
  for (let i = 1; i <= 12; i++) {
    const v = scale[String(i)];
    if (v) {
      tokens.set(`--coty-${i}`, v);
    }
  }

  const roleMode = (colorEntry.role_mode || "").toLowerCase();
  const anchorStep = Number(colorEntry.anchor_step || 0);
  const sourceStepDark = Number(colorEntry.source_step_dark || anchorStep);

  if (mode === "light") {
    const onStep = Number(colorEntry.on_primary_step_light || 1);
    if (roleMode === "surface") {
      tokens.set("--coty-role-surface", `--coty-${anchorStep}`);
      tokens.set(
        "--coty-role-surface-strong",
        `--coty-${Math.min(anchorStep + 1, 12)}`
      );
      tokens.set("--coty-role-primary", "--coty-9");
      tokens.set("--coty-role-primary-strong", "--coty-11");
      tokens.set("--coty-role-on-primary", `--coty-${onStep}`);
    } else {
      tokens.set("--coty-role-primary", `--coty-${anchorStep}`);
      tokens.set("--coty-role-primary-strong", "--coty-11");
      tokens.set("--coty-role-on-primary", `--coty-${onStep}`);
      tokens.set("--coty-role-surface", "--coty-4");
      tokens.set("--coty-role-surface-strong", "--coty-5");
    }
  } else {
    const onStep = Number(colorEntry.on_primary_step_dark || 12);
    if (roleMode === "surface") {
      tokens.set("--coty-role-surface", `--coty-${anchorStep}`);
      tokens.set(
        "--coty-role-surface-strong",
        `--coty-${Math.min(anchorStep + 1, 12)}`
      );
      tokens.set("--coty-role-primary", "--coty-9");
      tokens.set("--coty-role-primary-strong", "--coty-11");
      tokens.set("--coty-role-on-primary", `--coty-${onStep}`);
    } else {
      tokens.set("--coty-role-primary", `--coty-${sourceStepDark}`);
      tokens.set("--coty-role-primary-strong", "--coty-11");
      tokens.set("--coty-role-on-primary", `--coty-${onStep}`);
      tokens.set("--coty-role-surface", "--coty-4");
      tokens.set("--coty-role-surface-strong", "--coty-5");
    }
  }

  // Semantic defaults from pantone.css, with template overrides mirrored.
  // coty-scales.css sets --surface-accent: --coty-4 for surface-mode anchor=5
  // years (both modes) to avoid the case where --coty-5 == page bg == tag bg.
  tokens.set("--text-default", "--coty-12");
  tokens.set("--surface-page", "--coty-role-surface");
  tokens.set("--surface-default", "--coty-role-surface-strong");
  tokens.set(
    "--surface-accent",
    roleMode === "surface" && anchorStep === 5 ? "--coty-4" : "--coty-5"
  );
  tokens.set("--primary", "--coty-role-primary");
  tokens.set("--primary-strong", "--coty-role-primary-strong");
  tokens.set("--text-accent", "--primary-strong");
  tokens.set("--on-primary", "--coty-role-on-primary");

  // Year-specific overrides
  const overrides = colorEntry.overrides || {};
  for (const [snakeKey, cotyRef] of Object.entries(overrides)) {
    tokens.set("--" + snakeKey.replace(/_/g, "-"), cotyRef);
  }
  const modeOverrides =
    mode === "dark"
      ? colorEntry.overrides_dark || {}
      : colorEntry.overrides_light || {};
  for (const [snakeKey, cotyRef] of Object.entries(modeOverrides)) {
    tokens.set("--" + snakeKey.replace(/_/g, "-"), cotyRef);
  }

  return tokens;
}

function resolveCotyColor(name, tokens, depth = 0) {
  if (depth > 15) {
    return null;
  }
  const value = tokens.get(name);
  if (!value) {
    return null;
  }
  if (
    value.startsWith("oklch(") ||
    value.startsWith("hsl(") ||
    value.startsWith("#")
  ) {
    return value;
  }
  if (value.startsWith("--")) {
    return resolveCotyColor(value, tokens, depth + 1);
  }
  // Handle var() references from overrides
  const varMatch = value.match(/^var\((--[^,)]+)/);
  if (varMatch) {
    return resolveCotyColor(varMatch[1], tokens, depth + 1);
  }
  return null;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("COTY Contrast Ratios", () => {
  let cotyData;

  beforeAll(() => {
    cotyData = loadCotyData();
  });

  test("loads TOML with 27 color entries", () => {
    expect(cotyData.colors).toHaveLength(27);
  });

  test("every entry has scale_light with 12 steps", () => {
    const missing = cotyData.colors.filter(
      (c) => !c.scale_light || Object.keys(c.scale_light).length !== 12
    );
    expect(missing.map((c) => c.year)).toEqual([]);
  });

  test("every entry has scale_dark with 12 steps", () => {
    const missing = cotyData.colors.filter(
      (c) => !c.scale_dark || Object.keys(c.scale_dark).length !== 12
    );
    expect(missing.map((c) => c.year)).toEqual([]);
  });

  for (const mode of ["light", "dark"]) {
    describe(`mode: ${mode}`, () => {
      const yearsToTest = Array.from({ length: 27 }, (_, i) => 2000 + i);

      for (const year of yearsToTest) {
        describe(`${year}`, () => {
          let tokenMap;

          beforeAll(() => {
            const entry = cotyData.colors.find((c) => c.year === year);
            tokenMap = buildCotyTokenMap(entry, mode);
          });

          test("body text (--text-default on --surface-page) meets WCAG AA 4.5:1", () => {
            const text = resolveCotyColor("--text-default", tokenMap);
            const bg = resolveCotyColor("--surface-page", tokenMap);

            if (!text || !bg) {
              console.warn(
                `[${year} ${mode}] Could not resolve body text colors — skipping`
              );
              return;
            }

            const ratio = wcagContrast(text, bg);
            expect(ratio).not.toBeNull();
            expect(ratio).toBeGreaterThanOrEqual(WCAG_AA);
          });

          test("tag (--text-accent on --surface-accent) meets WCAG AA 4.5:1", () => {
            const text = resolveCotyColor("--text-accent", tokenMap);
            const bg = resolveCotyColor("--surface-accent", tokenMap);

            if (!text || !bg) {
              console.warn(
                `[${year} ${mode}] Could not resolve tag colors — skipping`
              );
              return;
            }

            const ratio = wcagContrast(text, bg);
            expect(ratio).not.toBeNull();
            expect(ratio).toBeGreaterThanOrEqual(WCAG_AA);
          });

          test("card text (--text-default on --surface-default) meets WCAG AA 4.5:1", () => {
            const text = resolveCotyColor("--text-default", tokenMap);
            const bg = resolveCotyColor("--surface-default", tokenMap);

            if (!text || !bg) {
              console.warn(
                `[${year} ${mode}] Could not resolve card text colors — skipping`
              );
              return;
            }

            const ratio = wcagContrast(text, bg);
            expect(ratio).not.toBeNull();
            expect(ratio).toBeGreaterThanOrEqual(WCAG_AA);
          });

          test("primary button (--on-primary on --primary) meets WCAG AA-large 3:1", () => {
            const text = resolveCotyColor("--on-primary", tokenMap);
            const bg = resolveCotyColor("--primary", tokenMap);

            if (!text || !bg) {
              console.warn(
                `[${year} ${mode}] Could not resolve primary button colors — skipping`
              );
              return;
            }

            const ratio = wcagContrast(text, bg);
            expect(ratio).not.toBeNull();
            expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
          });
        });
      }
    });
  }
});
