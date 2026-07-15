/**
 * terminal-fs.js — the terminal's filesystem model (window.TerminalFS).
 *
 * One authoritative source for "what the site contains": the full-tree manifest
 * Hugo emits into <script data-js="terminal-manifest"> (see
 * layouts/partials/terminal-manifest.html). Every reachable node — sections,
 * every post, standalone pages, a section's tags/ dir — is keyed by its LOGICAL
 * path (`works`, `works/a-cut-up-world`, `legal/license`), independent of the
 * real URL slug (works posts live at /englishwork/…, but the terminal dir is
 * `works/`). The manifest carries the real `url` for fetching; the logical key
 * is what `ls`/`cd`/`tree`/completion walk.
 *
 * This module reads that blob lazily (cached on first use, like the old
 * terminalManifest()) and exposes a small, pure API the engine reroutes onto.
 * It replaces the terminal's former scattered model — the top-level-only
 * manifest, the nav-link-harvested dir tree, the per-cwd ls cache, the
 * index.json prefetch/seed, and the live-DOM card scrape — all of which were
 * incrementally rebuilding this same thing at runtime.
 *
 * Same data-module pattern as terminal-data.js: an IIFE that publishes a single
 * window global. Load BEFORE terminal.js, which aliases it at init.
 */
(function () {
  "use strict";

  var manifestCache = null;
  var treeCache = null;

  // Decode a single path segment the way terminal.js reads hrefs: percent-escapes
  // resolved (a localized slug g%c3%b6teborgsaffisch → göteborgsaffisch) and
  // lowercased, so a manifest key matches a typed/derived path exactly.
  function decodeSeg(seg) {
    try {
      return decodeURIComponent(String(seg)).toLowerCase();
    } catch (e) {
      return String(seg).toLowerCase(); // malformed escape — keep the raw segment
    }
  }

  function normalizeKey(key) {
    return String(key).split("/").filter(Boolean).map(decodeSeg).join("/");
  }

  // The raw manifest map, keyed by normalized logical path → {kind, url, title,
  // tags}. Cached; a malformed/absent blob yields {} (the engine then defaults
  // unknown nodes to `dir`, exactly as before).
  function manifest() {
    if (manifestCache) {
      return manifestCache;
    }
    manifestCache = {};
    var el = document.querySelector('[data-js="terminal-manifest"]');
    if (el && el.textContent) {
      try {
        var raw = JSON.parse(el.textContent) || {};
        Object.keys(raw).forEach(function (key) {
          var norm = normalizeKey(key);
          if (norm) {
            manifestCache[norm] = raw[key];
          }
        });
      } catch (e) {
        /* malformed manifest — fall back to the empty default */
      }
    }
    return manifestCache;
  }

  function makeNode(name) {
    return {
      name: name,
      kind: "dir",
      url: null,
      href: null,
      title: null,
      tags: null,
      children: {},
    };
  }

  // The nested tree, built once from the flat manifest by splitting each key on
  // "/". Intermediate segments that are themselves keys (e.g. `works` under
  // `works/tags`) get their data when their own key is processed; order doesn't
  // matter because nodes are create-then-assign.
  function tree() {
    if (treeCache) {
      return treeCache;
    }
    var root = makeNode("~");
    var m = manifest();
    Object.keys(m).forEach(function (key) {
      var entry = m[key] || {};
      var segs = key.split("/").filter(Boolean);
      if (!segs.length) {
        return;
      }
      var node = root;
      segs.forEach(function (seg) {
        if (!node.children[seg]) {
          node.children[seg] = makeNode(seg);
        }
        node = node.children[seg];
      });
      node.kind = entry.kind || node.kind || "dir";
      node.url = entry.url || node.url || null;
      node.href = node.url; // alias: terminal.js reads node.href for "(cd to list)"
      node.title = entry.title || node.title || null;
      node.tags = entry.tags || node.tags || null;
    });
    treeCache = root;
    return root;
  }

  // Walk the tree to the node at the given (already-normalized) segments, or null.
  function node(segments) {
    var n = tree();
    var segs = segments || [];
    for (var i = 0; i < segs.length; i++) {
      n = n.children[segs[i]];
      if (!n) {
        return null;
      }
    }
    return n;
  }

  // Drop the caches so a re-read picks up a fresh manifest — used after an
  // in-place page swap replaces the manifest blob (Step 2+ of the plan; a no-op
  // seam today).
  function refresh() {
    manifestCache = null;
    treeCache = null;
  }

  window.TerminalFS = {
    manifest: manifest,
    tree: tree,
    node: node,
    refresh: refresh,
  };
})();
