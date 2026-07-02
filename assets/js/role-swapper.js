/**
 * Hero role swapper for the homepage — typewriter effect.
 *
 * Per typed role the caret runs through: type (solid) → settle (solid, a beat
 * right after the last letter so it doesn't feel cut off) → blink → idle
 * (hidden) → short blink → delete (solid) → type the next. On page load the
 * initial role starts in the idle phase — no blink up front. Only the differing
 * tail is retyped when consecutive roles share a prefix.
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
  const HOLD = 5000; // total pause between roles (blinks + idle)
  const SETTLE = 300; // solid caret beat right after the last letter is typed
  // Blink durations are whole multiples of the 1s CSS blink period so the caret
  // ends a blink phase cleanly on "off" — no clipped half-blink at the end.
  const BLINK_AFTER = 2000; // caret blink after typing (the emphasis is here)
  const BLINK_BEFORE = 1000; // short caret blink just before the next delete

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
    const num = (attr, fallback) =>
      Number(swapper.getAttribute(attr)) || fallback;
    const hold = num("data-interval", HOLD);
    const typeSpeed = num("data-type-speed", TYPE_SPEED);
    const deleteSpeed = num("data-delete-speed", DELETE_SPEED);
    const blinkAfterMs = num("data-blink", BLINK_AFTER);
    const blinkBeforeMs = num("data-blink-before", BLINK_BEFORE);
    const settleMs = num("data-settle", SETTLE);

    const reduceMq =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    const isReduced = () =>
      (reduceMq && reduceMq.matches) ||
      document.documentElement.getAttribute("data-effect-reduced-motion") ===
        "on";

    let text = full(index);
    let timer = null;
    let running = false;

    // caret: "solid" (typing/settle) | "blink" (boundary) | "off" (idle)
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
        settleAfter();
      }
    }

    // Right after the last letter: keep the caret solid a beat so it doesn't
    // feel cut off, then let it blink for a while, then hide.
    function settleAfter() {
      setCaret("solid");
      schedule(blinkAfter, settleMs);
    }

    function blinkAfter() {
      setCaret("blink");
      schedule(idlePhase, blinkAfterMs);
    }

    function idlePhase() {
      setCaret("off");
      const idle = Math.max(
        hold - settleMs - blinkAfterMs - blinkBeforeMs,
        0
      );
      schedule(blinkBefore, idle);
    }

    function blinkBefore() {
      setCaret("blink");
      schedule(deleteStep, blinkBeforeMs);
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
      // Begin in the idle phase → no blink on page load.
      idlePhase();
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
