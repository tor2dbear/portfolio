/**
 * Hero role swapper for the homepage.
 */
(function () {
  "use strict";

  const DEFAULT_INTERVAL = 5000;
  const DEFAULT_FADE = 500;

  function parseRoles(value) {
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value
        .split("|")
        .map((role) => role.trim())
        .filter(Boolean);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const swapper = document.querySelector('[data-js="role-swapper"]');
    if (!swapper) {
      return;
    }

    const roleText =
      swapper.querySelector('[data-js="role-swapper-text"]') || swapper;
    const roles = parseRoles(swapper.getAttribute("data-roles"));
    if (roles.length < 2) {
      return;
    }

    const suffix = swapper.getAttribute("data-suffix") || "";
    const normalizeRole = (value) => {
      const trimmed = value.trim();
      if (!suffix) {
        return trimmed;
      }
      return trimmed.endsWith(suffix)
        ? trimmed.slice(0, -suffix.length)
        : trimmed;
    };

    if (!roleText.textContent.trim()) {
      roleText.textContent = roles[0] + suffix;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      return;
    }

    const interval =
      Number(swapper.getAttribute("data-interval")) || DEFAULT_INTERVAL;
    const fade = Number(swapper.getAttribute("data-fade")) || DEFAULT_FADE;

    let currentIndex = roles.indexOf(normalizeRole(roleText.textContent));
    if (currentIndex < 0) {
      currentIndex = 0;
    }

    function updateText() {
      swapper.style.opacity = "0";

      window.setTimeout(() => {
        currentIndex = (currentIndex + 1) % roles.length;
        roleText.textContent = roles[currentIndex] + suffix;
        swapper.style.opacity = "1";
      }, fade);
    }

    window.setInterval(updateText, interval);
  });
})();
