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
    if (activeVariants.length < 2) return null;
    const pool = activeVariants.filter((variant) => variant !== current);
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const getTransition = (variant) =>
    Number.isFinite(variant.transition)
      ? variant.transition
      : randomBetween(transitionMin, transitionMax);

  const bridgeVariant = variants.find(
    (variant) => variant.role === "bridge" || variant.bridge === true
  );
  const activeVariants = bridgeVariant
    ? variants.filter((variant) => variant !== bridgeVariant)
    : variants;

  if (activeVariants.length === 0) return;

  const bridgePath = bridgeVariant ? bridgeVariant.d : null;
  const sequence = shuffle(activeVariants);
  let t = 0;
  const times = [0];
  const values = [base];
  const splines = [];
  const LINEAR = "0 0 1 1";
  const EASE_IN = "0.42 0 1 1";
  const EASE_OUT = "0 0 0.58 1";

  const addPoint = (value, time, spline = LINEAR) => {
    values.push(value);
    times.push(time);
    splines.push(spline);
  };

  const appendVariant = ({
    variant,
    includeBaseHold,
    returnToBase,
    startFromBridge,
    transitionOut,
  }) => {
    const baseHold = includeBaseHold ? randomBetween(baseMin, baseMax) : 0;
    const transitionIn = getTransition(variant);
    const altHold = randomBetween(altMin, altMax);
    const altA = variant.d;
    const altB = variant.d_alt || variant.d;

    if (baseHold > 0) {
      t += baseHold;
      addPoint(base, t, LINEAR);
    }

    if (bridgePath) {
      const lastValue = values[values.length - 1];
      if (includeBaseHold || lastValue === base) {
        t += transitionIn;
        addPoint(bridgePath, t, EASE_IN);
      }
      t += transitionIn;
      addPoint(altA, t, EASE_OUT);
    } else if (startFromBridge) {
      t += transitionIn;
      addPoint(altA, t, EASE_OUT);
    } else {
      t += transitionIn;
      addPoint(altA, t, LINEAR);
    }

    if (variant.type === "dynamic") {
      const stepDur = altHold / dynamicSteps;
      for (let i = 0; i < dynamicSteps; i += 1) {
        t += stepDur;
        addPoint(i % 2 === 0 ? altB : altA, t, LINEAR);
      }
    } else {
      t += altHold;
      addPoint(altA, t, LINEAR);
    }

    if (returnToBase) {
      const transitionBack = transitionOut ?? getTransition(variant);
      if (bridgePath) {
        t += transitionBack;
        addPoint(bridgePath, t, EASE_IN);
        t += transitionBack;
        addPoint(base, t, EASE_OUT);
      } else {
        t += transitionBack;
        addPoint(base, t, LINEAR);
      }
    } else if (bridgePath) {
      const transitionBack = transitionOut ?? getTransition(variant);
      t += transitionBack;
      addPoint(bridgePath, t, EASE_IN);
    }
  };

  const doubleFlags = sequence.map(() => Math.random() < doubleChance);
  if (activeVariants.length > 1 && !doubleFlags.some(Boolean)) {
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
        startFromBridge: false,
      });
      return;
    }

    appendVariant({
      variant,
      includeBaseHold: true,
      returnToBase: false,
      startFromBridge: false,
    });

    appendVariant({
      variant: secondVariant,
      includeBaseHold: false,
      returnToBase: true,
      startFromBridge: Boolean(bridgePath),
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
  animate.setAttribute("calcMode", "spline");
  animate.setAttribute("keyTimes", keyTimes.join(";"));
  animate.setAttribute("keySplines", splines.join(";"));
  animate.setAttribute("values", values.join(";"));
  path.appendChild(animate);

  if (typeof animate.beginElement === "function") {
    animate.beginElement();
  }
})();
