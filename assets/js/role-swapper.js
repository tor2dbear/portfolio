/**
 * Hero role swapper for the homepage — typewriter effect.
 *
 * Per role the caret runs through: type (solid) → blink briefly → idle (hidden)
 * → blink briefly → delete (solid) → type the next. Only the differing tail is
 * retyped when consecutive roles share a prefix.
 *
 * Reduced motion: honours BOTH the OS `prefers-reduced-motion` and the site's
 * own toggle (html[data-effect-reduced-motion="on"]), and reacts live.
 *
 * A11y: the animated text is decorative (aria-hidden on the container); a
 * separate visually-hidden role keeps the heading's accessible name stable.
 */
(function () {
  "use strict";

  const TYPE_SPEED = 125; // ms per character while typing
  const DELETE_SPEED = 60; // ms per character while deleting
  const HOLD = 5000; // ms between roles (incl. the two blink bursts)
  const BLINK = 1000; // ms the caret blinks before and after the animation

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
    const blink = Number(swapper.getAttribute("data-blink")) || BLINK;

    const reduceMq =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    const isReduced = () =>
      (reduceMq && reduceMq.matches) ||
      document.documentElement.getAttribute("data-effect-reduced-motion") ===
        "on";

    let text = full(index);
    let timer = null;
    let running = false;

    // caret: "solid" (typing) | "blink" (boundary) | "off" (idle/hidden)
    const setCaret = (state) => {
      swapper.classList.toggle("is-typing", state === "solid");
      swapper.classList.toggle("is-blinking", state === "blink");
    };

    const schedule = (fn, ms) => {
      timer = window.setTimeout(fn, ms);
    };

    function typeStep() {
      if (isReduced()) {
        stop();
        return;
      }
      setCaret("solid");
      const target = full(index);
      if (text.length < target.length) {
        text = target.slice(0, text.length + 1);
        textEl.textContent = text;
        schedule(typeStep, typeSpeed);
      } else {
        blinkAfter();
      }
    }

    function blinkAfter() {
      setCaret("blink");
      schedule(idlePhase, blink);
    }

    function idlePhase() {
      setCaret("off");
      schedule(blinkBefore, Math.max(hold - 2 * blink, 0));
    }

    function blinkBefore() {
      setCaret("blink");
      schedule(startDeleting, blink);
    }

    function startDeleting() {
      deleteStep();
    }

    function deleteStep() {
      if (isReduced()) {
        stop();
        return;
      }
      setCaret("solid");
      const next = (index + 1) % roles.length;
      const floor = commonPrefixLength(full(index), full(next));
      if (text.length > floor) {
        text = text.slice(0, -1);
        textEl.textContent = text;
        schedule(deleteStep, deleteSpeed);
      } else {
        index = next;
        schedule(typeStep, typeSpeed);
      }
    }

    function stop() {
      running = false;
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
      // Rest on a complete role, never a half-typed one.
      text = full(index);
      textEl.textContent = text;
      setCaret("off");
    }

    function start() {
      if (running || isReduced()) {
        return;
      }
      running = true;
      text = full(index);
      textEl.textContent = text;
      // The initial role is already complete → begin at the post-role blink.
      blinkAfter();
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
