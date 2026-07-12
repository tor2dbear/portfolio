/**
 * Tests for toml-highlight.js — pure TOML → highlighted-HTML helpers.
 */
describe("TomlHighlight", () => {
  let T;

  beforeAll(() => {
    require("../toml-highlight.js");
    T = window.TomlHighlight;
  });

  test("publishes the seam", () => {
    expect(typeof T.escapeHtml).toBe("function");
    expect(typeof T.highlightTomlLine).toBe("function");
    expect(typeof T.renderHighlightedToml).toBe("function");
  });

  test("escapeHtml escapes all five specials", () => {
    expect(T.escapeHtml('<a href="x">&\'</a>')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;"
    );
  });

  test("comments render as a single toml-comment span, escaped", () => {
    expect(T.highlightTomlLine("# a <note>")).toBe(
      '<span class="toml-comment"># a &lt;note&gt;</span>'
    );
  });

  test("section headers split brackets from the name", () => {
    expect(T.highlightTomlLine("[roles]")).toBe(
      '<span class="toml-section-bracket">[</span><span class="toml-section">roles</span><span class="toml-section-bracket">]</span>'
    );
  });

  test("key/value lines classify string, bool and number values", () => {
    expect(T.highlightTomlLine('text = "iris"')).toContain(
      '<span class="toml-string">&quot;iris&quot;</span>'
    );
    expect(T.highlightTomlLine("blend = true")).toContain(
      '<span class="toml-bool">true</span>'
    );
    expect(T.highlightTomlLine("scale = -1.5")).toContain(
      '<span class="toml-number">-1.5</span>'
    );
    // anything else is a generic value
    expect(T.highlightTomlLine("x = [1, 2]")).toContain(
      '<span class="toml-value">[1, 2]</span>'
    );
  });

  test("key/value keeps indentation and marks key + equals", () => {
    const html = T.highlightTomlLine('  primary = "blue"');
    expect(html.startsWith("  <span")).toBe(true);
    expect(html).toContain('<span class="toml-key">primary</span>');
    expect(html).toContain('<span class="toml-equals"> = </span>');
  });

  test("blank lines collapse to empty strings; plain text just escapes", () => {
    expect(T.highlightTomlLine("   ")).toBe("");
    expect(T.highlightTomlLine("weird <line>")).toBe("weird &lt;line&gt;");
  });

  test("renderHighlightedToml maps every line and keeps line count", () => {
    const out = T.renderHighlightedToml('[roles]\ntext = "iris"\n\n# end');
    const lines = out.split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[2]).toBe("");
  });
});
