/**
 * Theme share
 *
 * Builds a shareable link that encodes the current composition — layout,
 * typography, colour mode, palette, Pantone year, and the blend/grain effects —
 * into a single `?theme=` query param, copies it to the clipboard, and toasts.
 *
 * The matching decoder runs in the inline head script (partials/head.html) so a
 * shared link applies before first paint (no flash) and persists to
 * localStorage. This module also strips a consumed `?theme=` from the address
 * bar on load, leaving a clean URL while the choice lives on in localStorage.
 */
(function () {
  "use strict";

  var ALLOW = {
    layout: ["column", "editorial", "index", "terminal"],
    font: ["editorial", "refined", "expressive", "technical", "system"],
    mode: ["light", "dark", "system"],
    palette: ["standard", "pantone"],
  };

  function attr(name, fallback) {
    return document.documentElement.getAttribute(name) || fallback;
  }

  // Read the live composition into an ordered key:value payload.
  function buildPayload() {
    var layout = attr("data-layout", "column");
    var font = attr("data-typography", "editorial");
    var mode = localStorage.getItem("theme-mode") || "system";
    var palette = attr("data-palette", "standard");
    var parts = [];

    if (ALLOW.layout.indexOf(layout) > -1) {
      parts.push("layout:" + layout);
    }
    if (ALLOW.font.indexOf(font) > -1) {
      parts.push("font:" + font);
    }
    if (ALLOW.mode.indexOf(mode) > -1) {
      parts.push("mode:" + mode);
    }

    // Only standard/pantone are portable; a custom palette is device-local, so a
    // link that can't reproduce it simply omits the palette (recipient keeps
    // their own).
    if (palette === "pantone") {
      parts.push("palette:pantone");
      var year = attr(
        "data-coty-year",
        localStorage.getItem("theme-coty-year") || ""
      );
      if (/^\d{4}$/.test(year)) {
        parts.push("year:" + year);
      }
    } else if (palette === "standard") {
      parts.push("palette:standard");
    }

    parts.push(
      "blend:" + (attr("data-effect-blend", "off") === "on" ? "1" : "0")
    );
    parts.push(
      "grain:" + (attr("data-effect-grain", "off") === "on" ? "1" : "0")
    );

    return parts.join(",");
  }

  function buildUrl() {
    var url = new URL(window.location.href);
    url.hash = "";
    url.search = "";
    url.searchParams.set("theme", buildPayload());
    return url.toString();
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for insecure contexts / older engines.
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error("execCommand failed"));
      } catch (err) {
        reject(err);
      }
    });
  }

  function toast(button, value) {
    if (!window.Toast) {
      return;
    }
    var title = button.getAttribute("data-toast-title") || "Share";
    var icon = button.getAttribute("data-toast-icon") || "";
    window.Toast.show(title, value, { icon: icon });
  }

  // Remove a consumed ?theme= from the address bar (the head script already
  // applied + persisted it), keeping any unrelated query params intact.
  function cleanUrl() {
    try {
      var url = new URL(window.location.href);
      if (!url.searchParams.has("theme")) {
        return;
      }
      url.searchParams.delete("theme");
      var qs = url.searchParams.toString();
      window.history.replaceState(
        window.history.state,
        "",
        url.pathname + (qs ? "?" + qs : "") + url.hash
      );
    } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", function () {
    cleanUrl();

    var button = document.querySelector('[data-js="theme-share"]');
    if (!button) {
      return;
    }

    button.addEventListener("click", function () {
      var link = buildUrl();
      copyText(link).then(
        function () {
          toast(
            button,
            button.getAttribute("data-toast-copied") || "Link copied"
          );
        },
        function () {
          toast(
            button,
            button.getAttribute("data-toast-failed") || "Copy failed"
          );
        }
      );
    });
  });
})();
