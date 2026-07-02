/**
 * Hero role swapper for the homepage — typewriter effect.
 *
 * The role is deleted one character at a time and the next role typed back in.
 * Only the differing tail is retyped when consecutive roles share a prefix
 * (e.g. "Product Designer" → "Product Owner").
 *
 * Reduced motion: honours BOTH the OS `prefers-reduced-motion` and the site's
 * own "Reduce motion" toggle (html[data-effect-reduced-motion="on"]), and reacts
 * live — toggling it on pauses on a complete role, toggling it off resumes.
 *
 * A11y: the animated text is decorative (aria-hidden on the container); a
 * separate visually-hidden role keeps the heading's accessible name stable.
 */
(function () {
  "use strict";

  const TYPE_SPEED = 125; // ms per character while typing (calm, natural)
  const DELETE_SPEED = 60; // ms per character while deleting
  const HOLD = 5000; // ms to hold a completed role (low change frequency)

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
    const hold = Number(swapper.getAttribute("data-interval")) || HOLD;
    const typeSpeed =
      Number(swapper.getAttribute("data-type-speed")) || TYPE_SPEED;
    const deleteSpeed =
      Number(swapper.getAttribute("data-delete-speed")) || DELETE_SPEED;

    const reduceMq =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    const isReduced = () =>
      (reduceMq && reduceMq.matches) ||
      document.documentElement.getAttribute("data-effect-reduced-motion") ===
        "on";

    let text = full(index);
    let deleting = true;
    let timer = null;
    let running = false;

    const setTyping = (on) => {
      swapper.classList.toggle("is-typing", on);
    };

    const step = () => {
      if (isReduced()) {
        stop();
        return;
      }
      if (deleting) {
        const next = (index + 1) % roles.length;
        const floor = commonPrefixLength(full(index), full(next));
        if (text.length > floor) {
          setTyping(true);
          text = text.slice(0, -1);
          textEl.textContent = text;
          timer = window.setTimeout(step, deleteSpeed);
        } else {
          index = next;
          deleting = false;
          timer = window.setTimeout(step, typeSpeed);
        }
      } else {
        const target = full(index);
        if (text.length < target.length) {
          setTyping(true);
          text = target.slice(0, text.length + 1);
          textEl.textContent = text;
          timer = window.setTimeout(step, typeSpeed);
        } else {
          // Role complete → hide the caret and hold before the next change.
          setTyping(false);
          deleting = true;
          timer = window.setTimeout(step, hold);
        }
      }
    };

    function stop() {
      running = false;
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
      // Rest on a complete role, never a half-typed one.
      deleting = true;
      text = full(index);
      textEl.textContent = text;
      setTyping(false);
    }

    function start() {
      if (running || isReduced()) {
        return;
      }
      running = true;
      deleting = true;
      text = full(index);
      textEl.textContent = text;
      timer = window.setTimeout(step, hold);
    }

    const onMotionChange = () => {
      if (isReduced()) {
        stop();
      } else {
        start();
      }
    };

    if (reduceMq) {
      if (reduceMq.addEventListener) {
        reduceMq.addEventListener("change", onMotionChange);
      } else if (reduceMq.addListener) {
        reduceMq.addListener(onMotionChange);
      }
    }
    if (window.MutationObserver) {
      const observer = new MutationObserver(onMotionChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-effect-reduced-motion"],
      });
    }

    if (isReduced()) {
      textEl.textContent = full(index);
    } else {
      start();
    }
  });
})();
