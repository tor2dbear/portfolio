/**
 * Hero role swapper for the homepage — typewriter effect.
 *
 * The role is deleted one character at a time and the next role typed back in,
 * so the line's width changes gradually. In a centred layout (editorial) that
 * reads as intentional typing that re-centres smoothly, rather than a jump; in
 * left-aligned layouts the role simply grows/shrinks at the end of its line
 * (a <br> follows it, so nothing else shifts). No reserved width, so there's no
 * gap around short roles.
 *
 * A11y: the animated text is decorative (aria-hidden on the container); a
 * separate visually-hidden role keeps the heading's accessible name stable.
 * Reduced motion → a single static role, no typing.
 */
(function () {
  "use strict";

  const TYPE_SPEED = 70; // ms per character while typing
  const DELETE_SPEED = 40; // ms per character while deleting
  const HOLD = 2200; // ms to hold a completed role

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

    const textEl =
      swapper.querySelector('[data-js="role-swapper-text"]') || swapper;
    const suffix = swapper.getAttribute("data-suffix") || "";
    const roles = parseRoles(swapper.getAttribute("data-roles"));
    if (roles.length < 2) {
      return;
    }

    const startMode = swapper.getAttribute("data-start");
    let index = 0;
    if (startMode === "random") {
      index = Math.floor(Math.random() * roles.length);
    }

    const full = (i) => roles[i] + suffix;

    // Reduced motion (or no matchMedia): show one static role, no typing.
    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      textEl.textContent = full(index);
      return;
    }

    const hold = Number(swapper.getAttribute("data-interval")) || HOLD;
    const typeSpeed =
      Number(swapper.getAttribute("data-type-speed")) || TYPE_SPEED;
    const deleteSpeed =
      Number(swapper.getAttribute("data-delete-speed")) || DELETE_SPEED;

    let charCount = full(index).length;
    let deleting = true;
    textEl.textContent = full(index);

    const step = () => {
      const target = full(index);
      if (deleting) {
        charCount -= 1;
        textEl.textContent = target.slice(0, Math.max(charCount, 0));
        if (charCount <= 0) {
          deleting = false;
          index = (index + 1) % roles.length;
          window.setTimeout(step, typeSpeed);
        } else {
          window.setTimeout(step, deleteSpeed);
        }
      } else {
        charCount += 1;
        textEl.textContent = target.slice(0, charCount);
        if (charCount >= target.length) {
          deleting = true;
          window.setTimeout(step, hold);
        } else {
          window.setTimeout(step, typeSpeed);
        }
      }
    };

    // Hold the initial role, then start deleting.
    window.setTimeout(step, hold);
  });
})();
