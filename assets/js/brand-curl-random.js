/**
 * Randomize brand curl SMIL animation on load.
 */
(function () {
  const brandLoop = document.querySelector("[data-js=\"brand-loop\"]");
  if (!brandLoop) return;

  const prefersReduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const randomAttr = brandLoop.getAttribute("data-curl-random");
  if (randomAttr === null || randomAttr === "false" || randomAttr === "0") {
    return;
  }

  const baseRaw = brandLoop.getAttribute("data-curl-base");
  const variantsRaw = brandLoop.getAttribute("data-curl-variants");
  if (!baseRaw || !variantsRaw) return;

  let base;
  let variants;
  try {
    base = atob(baseRaw);
    variants = JSON.parse(atob(variantsRaw));
  } catch (err) {
    return;
  }

  if (!Array.isArray(variants) || variants.length === 0) return;

  const parseNumber = (value, fallback) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const baseMin = parseNumber(brandLoop.getAttribute("data-curl-base-min"), 10);
  const baseMax = parseNumber(brandLoop.getAttribute("data-curl-base-max"), 10);
  const transitionMin = parseNumber(
    brandLoop.getAttribute("data-curl-transition-min"),
    0.5
  );
  const transitionMax = parseNumber(
    brandLoop.getAttribute("data-curl-transition-max"),
    0.5
  );
  const altMin = parseNumber(brandLoop.getAttribute("data-curl-alt-min"), 2);
  const altMax = parseNumber(brandLoop.getAttribute("data-curl-alt-max"), 2);
  const dynamicSteps = Math.max(
    2,
    Math.round(
      parseNumber(brandLoop.getAttribute("data-curl-dynamic-steps"), 4)
    )
  );

  const randomBetween = (min, max) => {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return lo + Math.random() * (hi - lo);
  };

  const shuffle = (items) => {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const doubleChance = 0.2;

  const pickOtherVariant = (current) => {
    if (variants.length < 2) return null;
    const pool = variants.filter((variant) => variant !== current);
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const getTransition = (variant) =>
    Number.isFinite(variant.transition)
      ? variant.transition
      : randomBetween(transitionMin, transitionMax);

  const sequence = shuffle(variants);
  let t = 0;
  const times = [0];
  const values = [base];

  const appendVariant = ({
    variant,
    includeBaseHold,
    returnToBase,
    transitionOut,
  }) => {
    const baseHold = includeBaseHold ? randomBetween(baseMin, baseMax) : 0;
    const transitionIn = getTransition(variant);
    const altHold = randomBetween(altMin, altMax);
    const altA = variant.d;
    const altB = variant.d_alt || variant.d;

    if (baseHold > 0) {
      t += baseHold;
      values.push(base);
      times.push(t);
    }

    t += transitionIn;
    values.push(altA);
    times.push(t);

    if (variant.type === "dynamic") {
      const stepDur = altHold / dynamicSteps;
      for (let i = 0; i < dynamicSteps; i += 1) {
        t += stepDur;
        values.push(i % 2 === 0 ? altB : altA);
        times.push(t);
      }
    } else {
      t += altHold;
      values.push(altA);
      times.push(t);
    }

    if (returnToBase) {
      const transitionBack = transitionOut ?? getTransition(variant);
      t += transitionBack;
      values.push(base);
      times.push(t);
    }
  };

  const doubleFlags = sequence.map(() => Math.random() < doubleChance);
  if (variants.length > 1 && !doubleFlags.some(Boolean)) {
    doubleFlags[Math.floor(Math.random() * doubleFlags.length)] = true;
  }

  sequence.forEach((variant, index) => {
    const shouldDouble = doubleFlags[index];
    const secondVariant = shouldDouble ? pickOtherVariant(variant) : null;

    if (!secondVariant) {
      appendVariant({
        variant,
        includeBaseHold: true,
        returnToBase: true,
      });
      return;
    }

    appendVariant({
      variant,
      includeBaseHold: true,
      returnToBase: false,
    });

    appendVariant({
      variant: secondVariant,
      includeBaseHold: false,
      returnToBase: true,
    });
  });

  if (t <= 0) return;

  const keyTimes = times.map((time) =>
    (time / t).toFixed(6)
  );

  const path = brandLoop.querySelector(".brand__mark-loop-path");
  if (!path) return;

  const existing = path.querySelector("animate");
  if (existing) {
    existing.remove();
  }

  const animate = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "animate"
  );
  animate.setAttribute("attributeName", "d");

  animate.setAttribute("dur", `${t.toFixed(1)}s`);
  animate.setAttribute("begin", "0s");
  animate.setAttribute("repeatCount", "indefinite");
  animate.setAttribute("calcMode", "linear");
  animate.setAttribute("keyTimes", keyTimes.join(";"));
  animate.setAttribute("values", values.join(";"));
  path.appendChild(animate);

  if (typeof animate.beginElement === "function") {
    animate.beginElement();
  }
})();
