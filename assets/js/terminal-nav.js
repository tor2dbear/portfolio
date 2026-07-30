/**
 * Terminal in-place navigation (typed-only, SPA-style #main swap).
 *
 * A typed `cd` in the terminal layout reads like a real shell: instead of
 * reloading the machine, it swaps the page content under the live prompt and
 * keeps the scrollback alive. Clicks are deliberately left untouched (they
 * still full-reload with the top `cd` echo — see terminal.js); only the
 * command engine's `navigate` action routes here, and only for ordinary pages.
 *
 * terminal.js decides eligibility it can know up front (terminal layout,
 * same-origin, not home, not a language switch) and calls `TerminalNav.go()`.
 * This module makes the final call after fetching — a special page (the four
 * CSS-bundled pages: home, contact, ui-library, palette-generator) or a
 * terminal-exempt page can only be recognised from the response, so `go()`
 * resolves `false` and darkmode falls back to a full reload. Progressive
 * enhancement throughout: no fetch / a parse failure / no #main all fall back.
 *
 * The DOM makes this cheap: all terminal chrome (nav, boot, scrollback, prompt)
 * lives OUTSIDE `<main id="main">`, so #main is a clean, stable swap target.
 * The real cost is content-dependent re-init, and in the terminal layout that
 * collapses to almost nothing: reveal-on-scroll is a CSS no-op here (`.reveal`
 * is forced visible), role-swapper is home-only (home full-reloads), and the
 * cd echo is already the typed command sitting in the scrollback. What remains
 * is lightbox figure focusability (+ the cheap idempotent Coty init).
 */
(function () {
  "use strict";

  var MAIN_SELECTOR = "#main";

  // The path we last rendered into #main. Used to ignore hash-only popstates
  // (smooth-scroll pushes those) and to detect real page changes on back/fwd.
  var lastPath = window.location.pathname;

  // Derive a page's cwd (~ or ~/segment) from a URL, mirroring head.html's
  // per-page logic and terminal.js's hrefToCwd (strip origin, query/hash, and
  // the language prefix). Used for the prompt on back/forward restores.
  function pathToCwd(href) {
    var path = String(href || "")
      .replace(/^[a-z]+:\/\/[^/]+/i, "")
      .replace(/[?#].*$/, "")
      .replace(/^\/+|\/+$/g, "");
    var lang = (
      document.documentElement.getAttribute("lang") || ""
    ).toLowerCase();
    var parts = path.split("/").filter(Boolean);
    if (parts.length && parts[0].toLowerCase() === lang) {
      parts.shift();
    }
    return parts.length ? "~/" + parts[0] : "~";
  }

  function isTerminalLayout() {
    return document.documentElement.getAttribute("data-layout") === "terminal";
  }

  // A fetched document is swappable only if it's an ordinary content page:
  // not terminal-exempt, and carrying no page-specific CSS bundle. The four
  // special pages (home, contact, ui-library, palette-generator) are exactly
  // those with a `css/pages/*` (dev) or `css-page-*` (prod) stylesheet, whose
  // styles the current page never loaded — swapping them in would break their
  // look, so they full-reload instead.
  function isSwappableDoc(doc) {
    if (!doc || !doc.documentElement) {
      return false;
    }
    if (doc.documentElement.hasAttribute("data-terminal-exempt")) {
      return false;
    }
    if (doc.querySelector('link[href*="css/pages/"], link[href*="css-page"]')) {
      return false;
    }
    return !!doc.querySelector(MAIN_SELECTOR);
  }

  // Copy the SEO/meta head fields from the fetched document. Deliberately a
  // fixed allow-list — the stylesheet links, fonts, inline theme script and the
  // --terminal-host/--terminal-cwd style block must stay put. Remove-then-add
  // per selector so a field the new page omits (e.g. robots, og:image) is
  // correctly dropped.
  function patchHead(doc) {
    if (doc.title) {
      document.title = doc.title;
    }
    var selectors = [
      'meta[name="description"]',
      'meta[name="robots"]',
      'meta[property^="og:"]',
      'meta[name^="twitter:"]',
      'link[rel="canonical"]',
      'link[rel="alternate"][hreflang]',
    ];
    var srcHead = doc.head;
    if (!srcHead) {
      return;
    }
    selectors.forEach(function (sel) {
      var existing = document.head.querySelectorAll(sel);
      for (var i = 0; i < existing.length; i++) {
        existing[i].parentNode.removeChild(existing[i]);
      }
      var incoming = srcHead.querySelectorAll(sel);
      for (var j = 0; j < incoming.length; j++) {
        document.head.appendChild(document.importNode(incoming[j], true));
      }
    });
  }

  // The prompt reads its working directory from --terminal-cwd. Set it inline
  // on <html> (wins over head.html's :root rule) so the PS1 tracks the new page.
  // A real navigation is a fresh page, so reset BOTH the frozen page cwd and the
  // live cwd (an append-only `cd` only moved the latter) to the new page.
  function setCwd(cwd) {
    document.documentElement.style.setProperty(
      "--terminal-cwd",
      '"' + cwd + '"'
    );
    document.documentElement.style.setProperty(
      "--terminal-live-cwd",
      '"' + cwd + '"'
    );
  }

  // Re-run only the content-dependent init a #main swap invalidates. Kept tiny
  // by design (see the file header): lightbox figure focusability, plus the
  // cheap idempotent Coty init when that engine is loaded. `doc` is the fetched
  // document, handed to rehydrate so a language swap can transplant the chrome
  // that lives outside #main (i18n/manifest/nav/<html lang>).
  function refreshContentInit(doc) {
    if (
      window.TerminalLightbox &&
      typeof window.TerminalLightbox.refresh === "function"
    ) {
      window.TerminalLightbox.refresh();
    }
    // Newly swapped-in hero-embed iframes (e.g. a cat'd works page with a live
    // hero) need their theme/reduced-motion wiring; hero-embed.js exposes this
    // seam for exactly this in-place-nav case.
    if (window.HeroEmbed && typeof window.HeroEmbed.refresh === "function") {
      window.HeroEmbed.refresh();
    }
    // Swapped-in media (a demo video, an animated logomark) may need pausing if
    // the visitor prefers reduced motion; reduced-motion-media.js exposes this.
    if (
      window.ReducedMotionMedia &&
      typeof window.ReducedMotionMedia.refresh === "function"
    ) {
      window.ReducedMotionMedia.refresh();
    }
    if (
      window.CotyScaleActions &&
      typeof window.CotyScaleActions.init === "function"
    ) {
      window.CotyScaleActions.init();
    }
    // Re-derive the terminal's view of the page: the i18n catalog, the
    // fs/tree/nav model and the swapped-in cards' slug stamps. rehydrate(doc)
    // subsumes the slug-stamping (and transplants the language chrome when the
    // fetched doc differs); fall back to the narrower TerminalSlugs seam if an
    // older engine is loaded.
    if (window.Terminal && typeof window.Terminal.rehydrate === "function") {
      window.Terminal.rehydrate(doc);
    } else if (
      window.TerminalSlugs &&
      typeof window.TerminalSlugs.refresh === "function"
    ) {
      window.TerminalSlugs.refresh();
    }
  }

  // The prompt sits below #main, so a taller/shorter page shifts it — pin the
  // viewport to the bottom, matching terminal.js's scrollTerminalToEnd.
  function keepPromptInView() {
    window.requestAnimationFrame(function () {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  // Where to leave the viewport after a swap depends on what you navigated to.
  // A LISTING (works/writing/tags — `.content.list` / `.content.startpage`) is
  // read via `ls` at the prompt, so keep the prompt in view (the owner's
  // continuous-session model). A READABLE page (a post or `about` —
  // `.content.post` / `.content.page`) IS the destination, with no `ls` to
  // surface it, so show it from the top like a full page load — otherwise the
  // content sits above the prompt, unseen ("looks half-loaded").
  function settleScroll() {
    var content = document.querySelector("#main .content");
    var isListing =
      content &&
      (content.classList.contains("list") ||
        content.classList.contains("startpage"));
    if (isListing) {
      keepPromptInView();
    } else {
      window.requestAnimationFrame(function () {
        window.scrollTo(0, 0);
      });
    }
  }

  function parseDoc(html) {
    try {
      return new DOMParser().parseFromString(html, "text/html");
    } catch (e) {
      return null;
    }
  }

  function sameOrigin(url) {
    try {
      return (
        new URL(url, window.location.href).origin === window.location.origin
      );
    } catch (e) {
      return false;
    }
  }

  // Apply a fetched document in place: swap #main (importNode carries its
  // attributes, so the surrounding terminal chrome — scrollback, prompt, nav —
  // stays intact), then patch head + cwd, mark the session booted (so the swap
  // drops the one-per-session boot banner like a full-reload nav would),
  // refresh the content-dependent init and settle the scroll. Synchronous on
  // purpose: a view-transition cross-fade animates from a snapshot and can flash
  // a blank frame mid-swap ("looks half-loaded"), so the swap paints at once.
  // Returns false if the document can't be swapped (special page / no #main).
  function render(doc, cwd) {
    if (!isSwappableDoc(doc)) {
      return false;
    }
    var current = document.querySelector(MAIN_SELECTOR);
    var incoming = doc.querySelector(MAIN_SELECTOR);
    if (!current || !incoming || !current.parentNode) {
      return false;
    }
    current.parentNode.replaceChild(
      document.importNode(incoming, true),
      current
    );
    patchHead(doc);
    setCwd(cwd);
    // Subsequent pages skip the boot theater. Beyond hiding the banner
    // (data-terminal-booted), we must clear the .terminal-booting class: its
    // `#main { animation: terminal-print both 1.35s }` rule holds a freshly
    // swapped #main at opacity 0 through the delay, so a swap mid-boot (fast
    // navigation on the landing page) would paint blank until the animation ran.
    document.documentElement.setAttribute("data-terminal-booted", "1");
    document.documentElement.classList.remove("terminal-booting");
    // The home-only footer (login-tour blocks) is gated on data-terminal-home,
    // a server-set flag on <html>. A swap doesn't reload <html>, so sync it from
    // the fetched page — otherwise leaving home would keep the flag and show the
    // footer on a content page (and vice versa).
    if (doc.documentElement.hasAttribute("data-terminal-home")) {
      document.documentElement.setAttribute("data-terminal-home", "true");
    } else {
      document.documentElement.removeAttribute("data-terminal-home");
    }
    // Per-project theme flags also live on <html> (set server-side) and don't
    // survive a #main swap, so sync or clear them from the fetched page —
    // otherwise navigating out of a themed work keeps its colours/tags, and
    // navigating into one misses them. (data-project-typography rides inside the
    // swapped #main on .works-post, so it needs no sync here.)
    // data-work-mode is included: it's a hard mode lock, so entering a locked
    // work (e.g. PIA) must install it and leaving one must clear it — otherwise
    // the lock never arrives on nav-in, or lingers on nav-out and pins every
    // later page dark with its mode controls hidden.
    [
      "data-work-theme",
      "data-work-tags",
      "data-work-layout",
      "data-work-mode",
    ].forEach(function (attr) {
      var value = doc.documentElement.getAttribute(attr);
      if (value) {
        document.documentElement.setAttribute(attr, value);
      } else {
        document.documentElement.removeAttribute(attr);
      }
    });
    // The attribute alone only styles; reconcile the actual mode from the
    // now-synced lock (or the visitor's stored preference when unlocked).
    if (window.Theme && typeof window.Theme.reconcileWorkMode === "function") {
      window.Theme.reconcileWorkMode();
    }
    // A work theme moves --surface-page, so refresh the status-bar meta colour
    // (and repopulate its cache key) for the destination — the attribute swap
    // alone won't trigger it.
    if (
      window.Theme &&
      typeof window.Theme.animateThemeColorMeta === "function"
    ) {
      window.Theme.animateThemeColorMeta();
    }
    refreshContentInit(doc);
    settleScroll();
    return true;
  }

  // Fetch + swap for a typed navigation. Resolves true if it navigated in
  // place, false if the caller should fall back to a full reload. Never
  // rejects — every failure path resolves false.
  function go(url, opts) {
    opts = opts || {};
    if (typeof window.fetch !== "function") {
      return Promise.resolve(false);
    }
    return window
      .fetch(url, { credentials: "same-origin", redirect: "follow" })
      .then(function (res) {
        if (!res.ok) {
          return false;
        }
        // A redirect that left the origin can't be swapped safely.
        if (res.redirected && res.url && !sameOrigin(res.url)) {
          return false;
        }
        var finalUrl = res.redirected && res.url ? res.url : url;
        return res.text().then(function (html) {
          var doc = parseDoc(html);
          var cwd = opts.cwd || pathToCwd(finalUrl);
          if (!render(doc, cwd)) {
            return false;
          }
          try {
            window.history.pushState({ terminalNav: true }, "", finalUrl);
          } catch (e) {
            /* origin already checked; ignore a hostile pushState throw */
          }
          lastPath = window.location.pathname;
          return true;
        });
      })
      .catch(function () {
        return false;
      });
  }

  // Back/forward: restore the entry's content in place so the scrollback
  // survives. Only in terminal layout; skip hash-only changes; reload if the
  // target isn't swappable (e.g. stepping back onto a special page).
  function onPopState() {
    if (!isTerminalLayout()) {
      return;
    }
    if (window.location.pathname === lastPath) {
      return;
    }
    var url = window.location.href;
    window
      .fetch(url, { credentials: "same-origin", redirect: "follow" })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("bad status");
        }
        return res.text();
      })
      .then(function (html) {
        if (!render(parseDoc(html), pathToCwd(url))) {
          window.location.reload();
          return;
        }
        lastPath = window.location.pathname;
      })
      .catch(function () {
        window.location.reload();
      });
  }

  window.addEventListener("popstate", onPopState);

  window.TerminalNav = { go: go };
})();
