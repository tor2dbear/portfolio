/**
 * Work Theme Contrast Ratio Tests
 *
 * Resolves CSS role-tokens for every work project theme × mode combination and
 * verifies that the key text/background pairs meet WCAG 2.1 AA. Mirrors the
 * role/semantic logic in assets/templates/work-theme-scales.css.
 *
 * Semantic token chain (from the template, self-contained per theme):
 *   --text-default   → --work-12
 *   --surface-page   → --work-role-surface
 *   --surface-default→ --work-role-surface-strong
 *   --surface-accent → --work-{4|5} (see role/mode rules)
 *   --primary        → --work-role-primary
 *   --primary-strong → --work-role-primary-strong (also --text-accent)
 *   --on-primary     → --work-role-on-primary
 */

const { execSync } = require("child_process");
const path = require("path");

const TOML_PATH = path.resolve(__dirname, "../../../data/work-themes.toml");
const WCAG_AA = 4.5;
const WCAG_AA_LARGE = 3.0;

// ─── Color math (shared with coty-contrast.test.js) ─────────────────────────

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

  const hex6 = str.match(/^#([0-9a-fA-F]{6})$/);
  if (hex6) {
    const h = hex6[1];
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
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

// ─── TOML loading ───────────────────────────────────────────────────────────

function loadWorkThemes() {
  const json = execSync(
    `python3 -c "import tomllib, json, sys; data = tomllib.load(open('${TOML_PATH}', 'rb')); print(json.dumps(data))"`,
    { encoding: "utf8" }
  );
  return JSON.parse(json);
}

// ─── Token resolution (mirrors work-theme-scales.css) ───────────────────────

function buildWorkTokenMap(theme, mode) {
  const scale = mode === "dark" ? theme.scale_dark : theme.scale_light;
  if (!scale) {
    return null;
  }

  const tokens = new Map();
  for (let i = 1; i <= 12; i++) {
    const v = scale[String(i)];
    if (v) {
      tokens.set(`--work-${i}`, v);
    }
  }

  const accentScale =
    mode === "dark" ? theme.accent_scale_dark : theme.accent_scale_light;
  const isDuo = Boolean(theme.accent_scale_light);
  if (isDuo && accentScale) {
    for (let i = 1; i <= 12; i++) {
      const v = accentScale[String(i)];
      if (v) {
        tokens.set(`--work-accent-${i}`, v);
      }
    }
  }

  const isSurface =
    isDuo || (theme.role_mode || "").toLowerCase() === "surface";
  const anchorStep = Number(theme.anchor_step || 0);
  const sourceStepDark = Number(theme.source_step_dark || anchorStep);
  const onStep =
    mode === "dark"
      ? Number(theme.on_primary_step_dark || 12)
      : Number(theme.on_primary_step_light || 1);

  const isNeutral = Boolean(theme.neutral_surface);
  if (isNeutral) {
    // Accent-only: surface/text/borders stay the site default (neutral). Model
    // the standard palette's page + text so the accent legibility checks below
    // resolve against a realistic neutral background.
    const accentStep =
      mode === "dark"
        ? Number(theme.accent_step_dark || 10)
        : Number(theme.accent_step_light || 9);
    tokens.set("--work-role-primary", `--work-${accentStep}`);
    tokens.set("--work-role-primary-strong", "--work-11");
    tokens.set("--work-role-on-primary", `--work-${onStep}`);
    tokens.set("--surface-accent", "--work-4");
    tokens.set(
      "--surface-page",
      mode === "dark" ? "oklch(17% 0.005 275)" : "oklch(99% 0.003 275)"
    );
    tokens.set(
      "--surface-default",
      mode === "dark" ? "oklch(21% 0.006 275)" : "oklch(97% 0.004 275)"
    );
    tokens.set(
      "--text-default",
      mode === "dark" ? "oklch(93% 0.008 275)" : "oklch(20% 0.01 275)"
    );
  } else if (isDuo) {
    // Surface/text from the base scale, every accent role from the accent scale.
    const accentStep =
      mode === "dark"
        ? Number(theme.accent_step_dark || 10)
        : Number(theme.accent_step_light || 9);
    tokens.set("--work-role-surface", `--work-${anchorStep}`);
    tokens.set(
      "--work-role-surface-strong",
      `--work-${Math.min(anchorStep + 1, 12)}`
    );
    tokens.set("--work-role-primary", `--work-accent-${accentStep}`);
    tokens.set("--work-role-primary-strong", "--work-accent-11");
    tokens.set("--work-role-on-primary", `--work-accent-${onStep}`);
    tokens.set("--surface-accent", "--work-accent-4");
  } else if (isSurface) {
    tokens.set("--work-role-surface", `--work-${anchorStep}`);
    tokens.set(
      "--work-role-surface-strong",
      `--work-${Math.min(anchorStep + 1, 12)}`
    );
    tokens.set("--work-role-primary", "--work-9");
    tokens.set("--work-role-primary-strong", "--work-11");
    tokens.set("--work-role-on-primary", `--work-${onStep}`);
    if (mode === "dark") {
      tokens.set("--surface-accent", anchorStep >= 5 ? "--work-3" : "--work-5");
    } else {
      tokens.set(
        "--surface-accent",
        anchorStep === 5 ? "--work-4" : "--work-5"
      );
    }
  } else {
    tokens.set(
      "--work-role-primary",
      `--work-${mode === "dark" ? sourceStepDark : anchorStep}`
    );
    tokens.set("--work-role-primary-strong", "--work-11");
    tokens.set("--work-role-on-primary", `--work-${onStep}`);
    tokens.set("--work-role-surface", "--work-4");
    tokens.set("--work-role-surface-strong", "--work-5");
    tokens.set("--surface-accent", "--work-5");
  }

  // Semantic mappings. Surface/text come from the theme scale unless the theme
  // is accent-only (neutral surface), in which case they were seeded above.
  if (!isNeutral) {
    tokens.set("--text-default", "--work-12");
    tokens.set("--surface-page", "--work-role-surface");
    tokens.set("--surface-default", "--work-role-surface-strong");
  }
  tokens.set("--primary", "--work-role-primary");
  tokens.set("--primary-strong", "--work-role-primary-strong");
  tokens.set("--text-accent", "--primary-strong");
  tokens.set("--on-primary", "--work-role-on-primary");

  const modeOverrides =
    mode === "dark" ? theme.overrides_dark || {} : theme.overrides_light || {};
  for (const [snakeKey, ref] of Object.entries(modeOverrides)) {
    tokens.set("--" + snakeKey.replace(/_/g, "-"), ref);
  }

  return tokens;
}

function resolveColor(name, tokens, depth = 0) {
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
    return resolveColor(value, tokens, depth + 1);
  }
  const varMatch = value.match(/^var\((--[^,)]+)/);
  if (varMatch) {
    return resolveColor(varMatch[1], tokens, depth + 1);
  }
  return null;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Work Theme Contrast Ratios", () => {
  let data;

  beforeAll(() => {
    data = loadWorkThemes();
  });

  test("loads TOML with at least one theme", () => {
    expect(Array.isArray(data.themes)).toBe(true);
    expect(data.themes.length).toBeGreaterThan(0);
  });

  test("every theme has a unique id", () => {
    const ids = data.themes.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every theme has scale_light and scale_dark with 12 steps", () => {
    const bad = data.themes.filter(
      (t) =>
        !t.scale_light ||
        Object.keys(t.scale_light).length !== 12 ||
        !t.scale_dark ||
        Object.keys(t.scale_dark).length !== 12
    );
    expect(bad.map((t) => t.id)).toEqual([]);
  });

  for (const mode of ["light", "dark"]) {
    describe(`mode: ${mode}`, () => {
      test("all themes meet WCAG AA in this mode", () => {
        for (const theme of data.themes) {
          const tokenMap = buildWorkTokenMap(theme, mode);
          const label = `[${theme.id} ${mode}]`;

          const pairs = [
            {
              name: "body text (--text-default on --surface-page)",
              fg: "--text-default",
              bg: "--surface-page",
              min: WCAG_AA,
            },
            {
              name: "card text (--text-default on --surface-default)",
              fg: "--text-default",
              bg: "--surface-default",
              min: WCAG_AA,
            },
            {
              name: "tag (--text-accent on --surface-accent)",
              fg: "--text-accent",
              bg: "--surface-accent",
              min: WCAG_AA,
            },
            {
              name: "primary button (--on-primary on --primary)",
              fg: "--on-primary",
              bg: "--primary",
              min: WCAG_AA_LARGE,
            },
            {
              name: "accent link (--text-accent on --surface-page)",
              fg: "--text-accent",
              bg: "--surface-page",
              min: WCAG_AA,
            },
          ];

          for (const pair of pairs) {
            const fg = resolveColor(pair.fg, tokenMap);
            const bg = resolveColor(pair.bg, tokenMap);
            const ratio = wcagContrast(fg, bg);
            // Surface the theme/pair in the message so a failure is actionable.
            expect(`${label} ${pair.name}: ${ratio}`).not.toContain("null");
            expect(ratio).toBeGreaterThanOrEqual(pair.min);
          }
        }
      });
    });
  }
});
