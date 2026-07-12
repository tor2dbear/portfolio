/**
 * Tests for palette-coty-lab.js — window.PaletteCotyLab.create(ctx)
 *
 * The COTY lab is a large DOM-bound closure, but its public buildOverrideToml()
 * is the pure-ish output that other code (the export panel) depends on: it turns
 * the selected year's entry + persisted draft into a TOML patch. It also has
 * clear guard conditions (only for the pantone source, only with a year and a
 * known entry). Those are what this pins; the interactive wiring is left to the
 * generator page.
 */

require("../palette-coty-lab.js");

// Minimal generator context: the lab only needs a root with the year select
// for buildOverrideToml, plus the two callbacks it never invokes on this path.
function makeLab({ source = "pantone", year = "2026" } = {}) {
  const root = document.createElement("div");
  root.innerHTML = `
    <select data-js="coty-year">
      <option value="2026" selected>2026</option>
      <option value="2025">2025</option>
    </select>
  `;
  root.querySelector('[data-js="coty-year"]').value = year;
  return window.PaletteCotyLab.create({
    root,
    currentActiveSource: () => source,
    reapplyGeneratorState: () => {},
  });
}

function setEntry(entry) {
  window.CotyScaleActions = {
    getEntry: (year) => (Number(year) === 2026 ? entry : null),
  };
}

describe("PaletteCotyLab.buildOverrideToml", () => {
  beforeEach(() => {
    localStorage.clear();
    setEntry({ primary_name: "Mocha Mousse", primary_hex: "#A47864" });
  });

  afterEach(() => {
    delete window.CotyScaleActions;
  });

  test("returns empty string when the active source is not pantone", () => {
    const lab = makeLab({ source: "standard" });
    expect(lab.buildOverrideToml()).toBe("");
  });

  test("returns empty string when no year is selected", () => {
    const lab = makeLab({ year: "" });
    expect(lab.buildOverrideToml()).toBe("");
  });

  test("returns empty string when the year has no COTY entry", () => {
    setEntry(null);
    const lab = makeLab();
    expect(lab.buildOverrideToml()).toBe("");
  });

  test("emits a [[colors]] TOML block from the entry for a clean year", () => {
    const toml = makeLab().buildOverrideToml();
    expect(toml).toContain("[[colors]]");
    expect(toml).toContain("year = 2026");
    expect(toml).toContain('name = "Mocha Mousse"');
    expect(toml).toContain('hex = "#A47864"');
    // No draft overrides → no role_mode / anchor / override tables.
    expect(toml).not.toContain("role_mode");
    expect(toml).not.toContain("anchor_step");
    expect(toml).not.toContain("[colors.overrides_light]");
  });

  test("includes a persisted draft's role_mode and anchor_step", () => {
    localStorage.setItem(
      "pantone-lab::2026",
      JSON.stringify({
        role_mode: "primary",
        anchor_step: 5,
        overrides_light: {},
        overrides_dark: {},
      })
    );
    const toml = makeLab().buildOverrideToml();
    expect(toml).toContain('role_mode = "primary"');
    expect(toml).toContain("anchor_step = 5");
  });

  test("drops an out-of-range anchor and an unknown role_mode from the draft", () => {
    localStorage.setItem(
      "pantone-lab::2026",
      JSON.stringify({
        role_mode: "bogus",
        anchor_step: 99,
        overrides_light: {},
        overrides_dark: {},
      })
    );
    const toml = makeLab().buildOverrideToml();
    // sanitizeCotyDraft normalises role_mode "bogus" → "auto" (omitted) and an
    // anchor outside 1–12 → "" (omitted).
    expect(toml).not.toContain("role_mode");
    expect(toml).not.toContain("anchor_step");
  });

  test("falls back to name/hex when the entry uses the non-primary keys", () => {
    setEntry({ name: "Peach Fuzz", hex: "#FFBE98" });
    const toml = makeLab().buildOverrideToml();
    expect(toml).toContain('name = "Peach Fuzz"');
    expect(toml).toContain('hex = "#FFBE98"');
  });
});
