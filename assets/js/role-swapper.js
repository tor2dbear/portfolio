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
 * Only the differing tail is retyped: consecutive roles that share a prefix
 * (e.g. "Product Designer" → "Product Owner") delete back to the common prefix
 * and type the rest, which shortens the motion and never does more work than a
 * full delete/retype.
 *
 * A11y: the animated text is decorative (aria-hidden on the container); a
 * separate visually-hidden role keeps the heading's accessible name stable.
 * Reduced motion → a single static role, no typing (and no caret).
 */
(function () {
  "use strict";

  const TYPE_SPEED = 68; // ms per character while typing
  const DELETE_SPEED = 34; // ms per character while deleting
  const HOLD = 3400; // ms to hold a completed role (keeps the line calm)

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

  function commonPrefixLength(a, b) {
    const max = Math.min(a.length, b.length);
    let i = 0;
    while (i < max && a[i] === b[i]) {
      i += 1;
    }
    return i;
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

    // Reduced motion (or no matchMedia): show one static role, no typing/caret.
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

    let text = full(index);
    let deleting = true;
    textEl.textContent = text;
    // Only show the caret while the JS typewriter is actually running.
    swapper.classList.add("is-animating");

    const step = () => {
      if (deleting) {
        const next = (index + 1) % roles.length;
        const floor = commonPrefixLength(full(index), full(next));
        if (text.length > floor) {
          text = text.slice(0, -1);
          textEl.textContent = text;
          window.setTimeout(step, deleteSpeed);
        } else {
          index = next;
          deleting = false;
          window.setTimeout(step, typeSpeed);
        }
      } else {
        const target = full(index);
        if (text.length < target.length) {
          text = target.slice(0, text.length + 1);
          textEl.textContent = text;
          window.setTimeout(step, typeSpeed);
        } else {
          deleting = true;
          window.setTimeout(step, hold);
        }
      }
    };

    // Hold the initial role, then start deleting.
    window.setTimeout(step, hold);
  });
})();
