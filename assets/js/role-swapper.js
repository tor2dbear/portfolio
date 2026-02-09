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

    const suffix = swapper.getAttribute("data-suffix") || "";
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const roleItems = Array.from(swapper.querySelectorAll("[data-role]"));
    const startMode = swapper.getAttribute("data-start");

    if (roleItems.length) {
      const interval =
        Number(swapper.getAttribute("data-interval")) || DEFAULT_INTERVAL;
      const fade = Number(swapper.getAttribute("data-fade")) || DEFAULT_FADE;
      let currentIndex = roleItems.findIndex((role) =>
        role.classList.contains("is-active")
      );
      if (currentIndex < 0) {
        currentIndex = 0;
      }
      if (startMode === "random") {
        currentIndex = Math.floor(Math.random() * roleItems.length);
      }

      const maxLen = roleItems.reduce(
        (max, item) => Math.max(max, item.textContent.trim().length),
        0
      );
      if (maxLen > 0) {
        swapper.style.minWidth = `${maxLen}ch`;
      }
      roleItems.forEach((item) => {
        item.style.transitionDuration = `${fade}ms`;
      });

      const setActive = (index) => {
        roleItems.forEach((item, itemIndex) => {
          const isActive = itemIndex === index;
          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-hidden", isActive ? "false" : "true");
        });
      };

      setActive(currentIndex);

      if (roleItems.length < 2 || prefersReducedMotion) {
        return;
      }

      window.setInterval(() => {
        currentIndex = (currentIndex + 1) % roleItems.length;
        setActive(currentIndex);
      }, interval);
      return;
    }

    const roleText =
      swapper.querySelector('[data-js="role-swapper-text"]') || swapper;
    const roles = parseRoles(swapper.getAttribute("data-roles"));
    if (roles.length < 2) {
      return;
    }

    const normalizeRole = (value) => {
      const trimmed = value.trim();
      if (!suffix) {
        return trimmed;
      }
      return trimmed.endsWith(suffix)
        ? trimmed.slice(0, -suffix.length)
        : trimmed;
    };

    if (prefersReducedMotion) {
      return;
    }

    const interval =
      Number(swapper.getAttribute("data-interval")) || DEFAULT_INTERVAL;
    const fade = Number(swapper.getAttribute("data-fade")) || DEFAULT_FADE;

    let currentIndex = roles.indexOf(normalizeRole(roleText.textContent));
    if (startMode === "random") {
      currentIndex = Math.floor(Math.random() * roles.length);
      roleText.textContent = roles[currentIndex] + suffix;
    } else {
      if (currentIndex < 0) {
        currentIndex = 0;
      }
      if (!roleText.textContent.trim()) {
        roleText.textContent = roles[currentIndex] + suffix;
      }
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
