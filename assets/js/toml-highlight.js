/**
 * TOML syntax highlighting — pure string→HTML helpers.
 *
 * Renders TOML source as markup with .toml-* classes (comment, section, key,
 * equals, string/bool/number values), used by the palette generator's export
 * panel. No DOM, no state: string in, HTML string out — which is why it lives
 * in its own file with its own unit tests. Publishes window.TomlHighlight;
 * load before palette-generator.js.
 */

(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function highlightTomlLine(line) {
    if (!line.trim()) {
      return "";
    }

    if (/^\s*#/.test(line)) {
      return '<span class="toml-comment">' + escapeHtml(line) + "</span>";
    }

    var sectionMatch = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (sectionMatch) {
      return (
        '<span class="toml-section-bracket">[</span><span class="toml-section">' +
        escapeHtml(sectionMatch[1]) +
        '</span><span class="toml-section-bracket">]</span>'
      );
    }

    var kvMatch = line.match(/^(\s*)([A-Za-z0-9_.-]+)(\s*=\s*)(.*)$/);
    if (kvMatch) {
      var indent = escapeHtml(kvMatch[1] || "");
      var key = '<span class="toml-key">' + escapeHtml(kvMatch[2]) + "</span>";
      var eq =
        '<span class="toml-equals">' + escapeHtml(kvMatch[3]) + "</span>";
      var rawValue = kvMatch[4] || "";
      var valueClass = "toml-value";
      if (/^".*"$/.test(rawValue)) {
        valueClass = "toml-string";
      }
      if (/^(true|false)$/.test(rawValue)) {
        valueClass = "toml-bool";
      }
      if (/^-?\d+(\.\d+)?$/.test(rawValue)) {
        valueClass = "toml-number";
      }
      var value =
        '<span class="' + valueClass + '">' + escapeHtml(rawValue) + "</span>";
      return indent + key + eq + value;
    }

    return escapeHtml(line);
  }

  function renderHighlightedToml(source) {
    return source.split("\n").map(highlightTomlLine).join("\n");
  }

  window.TomlHighlight = {
    escapeHtml: escapeHtml,
    highlightTomlLine: highlightTomlLine,
    renderHighlightedToml: renderHighlightedToml,
  };
})();
