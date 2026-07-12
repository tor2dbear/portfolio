/**
 * Static guard against the gap-A class of bug: a Go-template `href` builds a
 * query string across multiple lines, and a missing whitespace-trim marker
 * (`-}}` / `{{-`) leaks the newline + indentation into the rendered URL
 * (?view=employer\n          &ref=...).
 *
 * The render harness (hugo-render.test.js) proves the *output* for the one
 * template we know about; this scans *every* layout so a NEW template with the
 * same shape is caught before anyone writes a render test for it — trim markers
 * are easy to forget.
 *
 * It is token-aware, not a blunt regex: a run of whitespace-with-newline inside
 * a query string only leaks if it is trimmed by NEITHER the preceding action's
 * right-trim (`-}}`) NOR the following action's left-trim (`{{-`). That is what
 * distinguishes the buggy shape from the fixed one, which spans just as many
 * lines but trims both boundaries.
 */

const fs = require("fs");
const path = require("path");

const LAYOUTS_DIR = path.resolve(__dirname, "..");

// Return the leaking whitespace runs found inside query-string hrefs in `html`.
// Each entry is { attr, snippet } for reporting.
function findQueryWhitespaceLeaks(html) {
  const leaks = [];
  // href="..." values, allowing the value to span newlines.
  const hrefRe = /href="([^"]*)"/gs;
  let m;
  while ((m = hrefRe.exec(html)) !== null) {
    const value = m[1];
    const q = value.indexOf("?");
    if (q === -1 || !value.includes("\n")) {
      continue;
    }
    const query = value.slice(q);
    // Every maximal run of whitespace that contains a newline.
    const wsRe = /[ \t]*\n[ \t\n]*/g;
    let w;
    while ((w = wsRe.exec(query)) !== null) {
      const before = query.slice(0, w.index);
      const after = query.slice(w.index + w[0].length);
      const trimmedRight = /-\}\}$/.test(before); // preceding action ate it
      const trimmedLeft = /^\{\{-/.test(after); // following action ate it
      if (!trimmedRight && !trimmedLeft) {
        leaks.push({
          attr: value.replace(/\s+/g, " ").trim(),
          snippet: (before.slice(-24) + "⏎" + after.slice(0, 24)).trim(),
        });
      }
    }
  }
  return leaks;
}

function walkHtml(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") {
        continue; // fixtures live here; not production templates
      }
      out.push(...walkHtml(full));
    } else if (entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

describe("template query-string whitespace guard", () => {
  describe("detector", () => {
    test("flags an untrimmed multi-line query block (the gap-A bug)", () => {
      const buggy = `<a
        href="{{ .Permalink }}?view=employer{{ with $.Parent.Params.company_name }}
          &ref={{ . }}
        {{ end }}"
        >x</a>`;
      expect(findQueryWhitespaceLeaks(buggy).length).toBeGreaterThan(0);
    });

    test("passes the fixed version that trims both boundaries", () => {
      const fixed = `<a
        href="{{ .Permalink }}?view=employer{{ with $.Parent.Params.company_name -}}
          &ref={{ . }}
        {{- end }}"
        >x</a>`;
      expect(findQueryWhitespaceLeaks(fixed)).toEqual([]);
    });

    test("passes a one-sided leak only when the other side trims", () => {
      // Right-trim on the opener alone is enough to consume the newline.
      const rightOnly = `href="{{ .P }}?a=1{{ with .X -}}
          &b={{ . }}{{ end }}"`;
      expect(findQueryWhitespaceLeaks(rightOnly)).toEqual([]);
    });

    test("ignores single-line query strings", () => {
      expect(findQueryWhitespaceLeaks('href="{{ .P }}?a=1&b=2"')).toEqual([]);
    });

    test("ignores multi-line hrefs with no query string", () => {
      const noQuery = `href="{{ .Permalink }}{{ with .X }}
        /{{ . }}
      {{ end }}"`;
      expect(findQueryWhitespaceLeaks(noQuery)).toEqual([]);
    });
  });

  test("no layout leaks template whitespace into a query string", () => {
    const offenders = [];
    for (const file of walkHtml(LAYOUTS_DIR)) {
      const leaks = findQueryWhitespaceLeaks(fs.readFileSync(file, "utf8"));
      if (leaks.length) {
        offenders.push(
          `${path.relative(LAYOUTS_DIR, file)}: ${leaks
            .map((l) => l.snippet)
            .join(" | ")}`
        );
      }
    }
    expect(offenders).toEqual([]);
  });
});
