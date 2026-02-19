(function () {
  "use strict";

  var STORAGE_KEY = "theme-coty-year";
  var DUO_OVERRIDE_TOKENS = [
    "--secondary",
    "--secondary-strong",
    "--accent-secondary",
    "--accent-secondary-strong",
    "--component-toc-active-indicator",
    "--component-section-headline-bg",
  ];

  // Atmos-inspired baseline curve (step 1 = lightest, step 12 = darkest).
  var LIGHT_L = [98, 96, 92, 84.95, 81, 73, 64, 55, 44, 32, 21, 10];
  var DARK_L = [12, 14, 18, 24, 31, 39, 48, 58, 68, 78, 86, 93];
  var DEFAULT_ANCHOR_STEP = 9;
  var APPLIED_MANUAL_OVERRIDES = [];
  var PANTONE_RUNTIME_TOKEN_NAMES = [
    "--coty-role-mode",
    "--coty-role-anchor-step",
    "--coty-role-primary",
    "--coty-role-primary-strong",
    "--coty-role-surface",
    "--coty-role-surface-strong",
    "--coty-role-border-subtle",
    "--coty-role-border-default",
    "--coty-role-border-strong",
    "--coty-role-on-primary",
    "--coty-source-step",
    "--coty-secondary-source-step",
    "--primary",
    "--primary-strong",
    "--on-primary",
    "--on-secondary",
    "--accent-primary",
    "--accent-primary-strong",
    "--secondary",
    "--secondary-strong",
    "--image-grayscale",
    "--image-blend-mode",
    "--image-background",
    "--accent-secondary",
    "--accent-secondary-strong",
    "--component-toc-active-indicator",
    "--component-section-headline-bg",
  ];

  function isPantoneActive() {
    return (
      (document.documentElement.getAttribute("data-palette") || "standard") ===
      "pantone"
    );
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round3(value) {
    return Math.round(value * 1000) / 1000;
  }

  function normalizeHue(h) {
    var hue = h % 360;
    return hue < 0 ? hue + 360 : hue;
  }

  function findNearestStepFromCurve(curve, lightness) {
    var nearestIndex = 0;
    var nearestDiff = Infinity;
    for (var i = 0; i < curve.length; i += 1) {
      var diff = Math.abs(curve[i] - lightness);
      if (diff < nearestDiff) {
        nearestDiff = diff;
        nearestIndex = i;
      }
    }
    return nearestIndex + 1;
  }

  function normalizeHex(hex) {
    if (!hex) {
      return "";
    }
    var value = String(hex).trim().replace("#", "");
    if (value.length === 3) {
      value = value
        .split("")
        .map(function (ch) {
          return ch + ch;
        })
        .join("");
    }
    if (!/^[0-9a-fA-F]{6}$/.test(value)) {
      return "";
    }
    return "#" + value.toUpperCase();
  }

  function hexToRgbUnit(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) {
      return null;
    }
    return {
      r: rgb.r / 255,
      g: rgb.g / 255,
      b: rgb.b / 255,
    };
  }

  function srgbToLinear(value) {
    if (value <= 0.04045) {
      return value / 12.92;
    }
    return Math.pow((value + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance(hex) {
    var rgb = hexToRgbUnit(hex);
    if (!rgb) {
      return 0;
    }
    var r = srgbToLinear(rgb.r);
    var g = srgbToLinear(rgb.g);
    var b = srgbToLinear(rgb.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastRatio(hexA, hexB) {
    var l1 = relativeLuminance(hexA);
    var l2 = relativeLuminance(hexB);
    var light = Math.max(l1, l2);
    var dark = Math.min(l1, l2);
    return (light + 0.05) / (dark + 0.05);
  }

  function hexToRgb(hex) {
    var normalized = normalizeHex(hex);
    if (!normalized) {
      return null;
    }
    var value = normalized.slice(1);
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  }

  function linearToSrgb(value) {
    if (value <= 0.0031308) {
      return 12.92 * value;
    }
    return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  }

  function rgbToOklch(rgb) {
    var r = srgbToLinear(rgb.r / 255);
    var g = srgbToLinear(rgb.g / 255);
    var b = srgbToLinear(rgb.b / 255);

    var l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    var m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    var s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

    var lRoot = Math.cbrt(l);
    var mRoot = Math.cbrt(m);
    var sRoot = Math.cbrt(s);

    var okl = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
    var oka = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
    var okb = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;

    var c = Math.sqrt(oka * oka + okb * okb);
    var h = Math.atan2(okb, oka) * (180 / Math.PI);
    if (h < 0) {
      h += 360;
    }

    return { l: okl, c: c, h: h };
  }

  function oklchToSrgb(l, c, h) {
    var hue = h * (Math.PI / 180);
    var oka = c * Math.cos(hue);
    var okb = c * Math.sin(hue);

    var l_ = l + 0.3963377774 * oka + 0.2158037573 * okb;
    var m_ = l - 0.1055613458 * oka - 0.0638541728 * okb;
    var s_ = l - 0.0894841775 * oka - 1.291485548 * okb;

    var l3 = l_ * l_ * l_;
    var m3 = m_ * m_ * m_;
    var s3 = s_ * s_ * s_;

    var r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    var g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    var b = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

    return {
      r: clamp(linearToSrgb(r), 0, 1),
      g: clamp(linearToSrgb(g), 0, 1),
      b: clamp(linearToSrgb(b), 0, 1),
    };
  }

  function oklchToLinearSrgb(l, c, h) {
    var hue = h * (Math.PI / 180);
    var oka = c * Math.cos(hue);
    var okb = c * Math.sin(hue);

    var l_ = l + 0.3963377774 * oka + 0.2158037573 * okb;
    var m_ = l - 0.1055613458 * oka - 0.0638541728 * okb;
    var s_ = l - 0.0894841775 * oka - 1.291485548 * okb;

    var l3 = l_ * l_ * l_;
    var m3 = m_ * m_ * m_;
    var s3 = s_ * s_ * s_;

    return {
      r: 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
      g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
      b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
    };
  }

  function isInSrgbGamut(l, c, h) {
    var rgb = oklchToLinearSrgb(l, c, h);
    return (
      rgb.r >= 0 &&
      rgb.r <= 1 &&
      rgb.g >= 0 &&
      rgb.g <= 1 &&
      rgb.b >= 0 &&
      rgb.b <= 1
    );
  }

  function fitChromaToGamut(l, c, h) {
    if (isInSrgbGamut(l, c, h)) {
      return c;
    }
    var low = 0;
    var high = c;
    for (var i = 0; i < 14; i += 1) {
      var mid = (low + high) * 0.5;
      if (isInSrgbGamut(l, mid, h)) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return low;
  }

  function oklchToHex(l, c, h) {
    var rgb = oklchToSrgb(l, c, h);
    var r = Math.round(rgb.r * 255);
    var g = Math.round(rgb.g * 255);
    var b = Math.round(rgb.b * 255);
    var value = ((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)
      .toUpperCase();
    return "#" + value;
  }

  function formatOklch(l, c, h) {
    return (
      "oklch(" + round3(l * 100) + "% " + round3(c) + " " + round3(h) + ")"
    );
  }

  function parseOklchString(input) {
    var match = String(input || "").match(
      /oklch\(\s*([0-9.]+)%\s+([0-9.]+)\s+([0-9.]+)\s*\)/i
    );
    if (!match) {
      return null;
    }
    return {
      l: Number(match[1]) / 100,
      c: Number(match[2]),
      h: Number(match[3]),
    };
  }

  function colorToHex(input) {
    var value = String(input || "").trim();
    if (!value) {
      return "";
    }
    if (value.indexOf("#") === 0) {
      return normalizeHex(value) || "";
    }
    var parsed = parseOklchString(value);
    if (parsed) {
      return oklchToHex(parsed.l, parsed.c, parsed.h);
    }
    return "";
  }

  function resolveVarToken(input) {
    var match = String(input || "")
      .trim()
      .match(/^var\(\s*(--[A-Za-z0-9-_]+)(?:\s*,\s*(.+))?\)$/);
    if (!match) {
      return null;
    }
    return {
      name: match[1],
      fallback: match[2] ? String(match[2]).trim() : "",
    };
  }

  function resolveColorValue(input, depth) {
    var level = typeof depth === "number" ? depth : 0;
    if (level > 8) {
      return String(input || "").trim();
    }
    var value = String(input || "").trim();
    if (!value) {
      return "";
    }
    var token = resolveVarToken(value);
    if (!token) {
      return value;
    }
    var styles = getComputedStyle(document.documentElement);
    var resolved = styles.getPropertyValue(token.name).trim();
    if (resolved) {
      return resolveColorValue(resolved, level + 1);
    }
    if (token.fallback) {
      return resolveColorValue(token.fallback, level + 1);
    }
    return "";
  }

  function parseData() {
    var node = document.querySelector('[data-js="coty-data-json"]');
    if (!node) {
      return null;
    }

    try {
      var parsed = JSON.parse(node.textContent || "{}");
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      if (!Array.isArray(parsed.colors)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  function normalizedEntries(raw) {
    var grouped = {};

    raw.forEach(function (item) {
      var year = Number(item.year);
      var hex = normalizeHex(item.hex);
      if (!year || !hex) {
        return;
      }

      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push({
        name: String(item.name || year),
        hex: hex,
        role_mode: String(item.role_mode || ""),
        anchor_step: Number(item.anchor_step || 0),
        overrides:
          item.overrides && typeof item.overrides === "object"
            ? item.overrides
            : {},
        overrides_light:
          item.overrides_light && typeof item.overrides_light === "object"
            ? item.overrides_light
            : {},
        overrides_dark:
          item.overrides_dark && typeof item.overrides_dark === "object"
            ? item.overrides_dark
            : {},
      });
    });

    return Object.keys(grouped)
      .map(function (yearKey) {
        var year = Number(yearKey);
        var colors = grouped[year] || [];
        if (!colors.length) {
          return null;
        }

        var primary = colors[0];
        var secondary = colors[1] || null;

        return {
          year: year,
          name: secondary
            ? primary.name + " + " + secondary.name
            : primary.name,
          primary_name: primary.name,
          primary_hex: primary.hex,
          secondary_name: secondary ? secondary.name : "",
          secondary_hex: secondary ? secondary.hex : "",
          secondary_role_mode: secondary ? secondary.role_mode || "" : "",
          secondary_anchor_step: secondary ? secondary.anchor_step || 0 : 0,
          tone_mode: secondary ? "duo" : "mono",
          role_mode: primary.role_mode || "",
          anchor_step: primary.anchor_step || 0,
          overrides: normalizeOverrides(primary.overrides || {}),
          overrides_light: normalizeOverrides(primary.overrides_light || {}),
          overrides_dark: normalizeOverrides(primary.overrides_dark || {}),
          hex: primary.hex,
        };
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return b.year - a.year;
      });
  }

  function normalizeOverrides(raw) {
    var out = {};
    if (!raw || typeof raw !== "object") {
      return out;
    }
    Object.keys(raw).forEach(function (key) {
      var value = raw[key];
      if (typeof value === "undefined" || value === null || value === "") {
        return;
      }
      out[String(key)] = String(value);
    });
    return out;
  }

  function resolveAnchorStep(entry, mode, sourceLightness) {
    var explicitAnchor = Number(entry.anchor_step || 0);
    if (explicitAnchor >= 1 && explicitAnchor <= 12) {
      return explicitAnchor;
    }

    var lightness = Number(sourceLightness || 0);
    var curve = mode === "dark" ? DARK_L : LIGHT_L;
    return findNearestStepFromCurve(curve, lightness) || DEFAULT_ANCHOR_STEP;
  }

  function buildAnchoredLightness(mode, anchorStep, sourceLightness) {
    var values = new Array(12);
    var anchorIndex = Math.max(0, Math.min(11, anchorStep - 1));
    var source = clamp(sourceLightness, 0, 100);
    var curve = (mode === "dark" ? DARK_L : LIGHT_L).slice();
    var delta = source - curve[anchorIndex];
    // Keep the global curve rigid; only allow a modest shift around source lock.
    var maxShift = mode === "dark" ? 4 : 3;
    var shift = clamp(delta, -maxShift, maxShift);
    var shouldPinSource = Math.abs(delta) <= maxShift;
    var minL = mode === "dark" ? 4 : 2;
    var maxL = mode === "dark" ? 98 : 99;

    for (var i = 0; i < 12; i += 1) {
      values[i] = clamp(curve[i] + shift, minL, maxL);
    }
    // Avoid extreme outliers when an explicit light anchor is reused in dark mode.
    if (shouldPinSource) {
      values[anchorIndex] = source;
    }
    return values;
  }

  function shouldPinSourceAtAnchor(mode, anchorStep, sourceLightness) {
    var anchorIndex = Math.max(0, Math.min(11, anchorStep - 1));
    var curve = mode === "dark" ? DARK_L : LIGHT_L;
    var source = clamp(sourceLightness, 0, 100);
    var delta = Math.abs(source - curve[anchorIndex]);
    var maxShift = mode === "dark" ? 4 : 3;
    return delta <= maxShift;
  }

  function resolveChromaProfile(hue, sourceC) {
    if (sourceC < 0.018) {
      return "low";
    }
    var h = normalizeHue(hue);
    if (h >= 330 || h <= 95) {
      return "warm";
    }
    if (h >= 170 && h <= 300) {
      return "cool";
    }
    return "neutral";
  }

  function hueShiftForStep(index, anchorIndex, profile) {
    if (profile === "low") {
      return 0;
    }
    var shift = 0;
    if (index > anchorIndex) {
      var tDark =
        anchorIndex === 11 ? 0 : (index - anchorIndex) / (11 - anchorIndex);
      if (profile === "warm") {
        shift = -5 * Math.pow(tDark, 0.8);
      }
      if (profile === "cool") {
        shift = 2.5 * Math.pow(tDark, 0.85);
      }
      if (profile === "neutral") {
        shift = -1.2 * Math.pow(tDark, 0.9);
      }
    } else if (index < anchorIndex) {
      var tLight = anchorIndex === 0 ? 0 : (anchorIndex - index) / anchorIndex;
      if (profile === "warm") {
        shift = 1.5 * Math.pow(tLight, 0.7);
      }
      if (profile === "cool") {
        shift = -1 * Math.pow(tLight, 0.7);
      }
      if (profile === "neutral") {
        shift = 0.5 * Math.pow(tLight, 0.8);
      }
    }
    return shift;
  }

  function buildAnchoredChroma(
    lightnessValues,
    anchorIndex,
    sourceC,
    sourceL,
    profile
  ) {
    var values = new Array(12);
    var maxL = lightnessValues[0];
    var minL = lightnessValues[11];
    var source = clamp(sourceC, 0, 0.32);
    var darkBoostByProfile = {
      low: 0.08,
      neutral: 0.22,
      cool: 0.3,
      warm: 0.36,
    };
    var lightFadeByProfile = {
      low: 0.7,
      neutral: 0.84,
      cool: 0.88,
      warm: 0.9,
    };
    var darkDecayByProfile = {
      low: 0.2,
      neutral: 0.42,
      cool: 0.46,
      warm: 0.5,
    };
    var darkBoost =
      darkBoostByProfile[profile] + clamp((sourceL - 62) / 26, 0, 1) * 0.28;
    var lightFade = lightFadeByProfile[profile];
    var darkDecay = darkDecayByProfile[profile];
    var lowFloor =
      profile === "low"
        ? Math.max(0.0015, source * 0.35)
        : Math.max(0.004, source * 0.06);

    for (var i = 0; i < 12; i += 1) {
      if (i === anchorIndex) {
        values[i] = source;
        continue;
      }

      var l = lightnessValues[i];
      var factor = 1;
      if (l > sourceL) {
        var tLight = clamp((l - sourceL) / Math.max(1, maxL - sourceL), 0, 1);
        factor = 1 - lightFade * Math.pow(tLight, 0.7);
      } else {
        var tDark = clamp((sourceL - l) / Math.max(1, sourceL - minL), 0, 1);
        factor = 1 + darkBoost * Math.sin(Math.PI * Math.min(tDark, 0.78));
        factor *= 1 - darkDecay * Math.pow(tDark, 2.1);
      }

      values[i] = clamp(source * factor, lowFloor, 0.28);
    }
    return values;
  }

  function buildScale(entry, mode) {
    var rgb = hexToRgb(entry.primary_hex || entry.hex);
    if (!rgb) {
      return null;
    }

    var baseOklch = rgbToOklch(rgb);
    var hue = normalizeHue(baseOklch.h);
    var baseChroma = baseOklch.c;
    var baseLight = baseOklch.l * 100;
    var chromaProfile = resolveChromaProfile(hue, baseChroma);

    var anchorStep = resolveAnchorStep(entry, mode, baseLight);
    var anchorIndex = Math.max(0, Math.min(11, anchorStep - 1));
    var anchoredLightness = buildAnchoredLightness(mode, anchorStep, baseLight);
    var anchoredChroma = buildAnchoredChroma(
      anchoredLightness,
      anchorIndex,
      baseChroma,
      baseLight,
      chromaProfile
    );

    var tokens = {};
    for (var i = 0; i < 12; i += 1) {
      var l = clamp(anchoredLightness[i] / 100, 0, 1);
      var hueStep = normalizeHue(
        hue + hueShiftForStep(i, anchorIndex, chromaProfile)
      );
      var c = fitChromaToGamut(l, anchoredChroma[i], hueStep);
      tokens["--coty-" + (i + 1)] = formatOklch(l, c, hueStep);
    }

    // Only pin exact source color when anchor and source are close on the active curve.
    // This prevents very light sources from forcing bright anchors in dark mode.
    if (shouldPinSourceAtAnchor(mode, anchorStep, baseLight)) {
      tokens["--coty-" + anchorStep] = formatOklch(
        baseOklch.l,
        fitChromaToGamut(baseOklch.l, baseOklch.c, hue),
        hue
      );
    }

    return tokens;
  }

  function buildSecondaryScale(entry, mode) {
    if (!entry.secondary_hex) {
      return null;
    }
    var rgb = hexToRgb(entry.secondary_hex);
    if (!rgb) {
      return null;
    }

    var baseOklch = rgbToOklch(rgb);
    var hue = normalizeHue(baseOklch.h);
    var baseChroma = baseOklch.c;
    var baseLight = baseOklch.l * 100;
    var chromaProfile = resolveChromaProfile(hue, baseChroma);
    var secondaryContext = {
      anchor_step: entry.secondary_anchor_step || 0,
    };
    var anchorStep = resolveAnchorStep(secondaryContext, mode, baseLight);
    var anchorIndex = Math.max(0, Math.min(11, anchorStep - 1));
    var anchoredLightness = buildAnchoredLightness(mode, anchorStep, baseLight);
    var anchoredChroma = buildAnchoredChroma(
      anchoredLightness,
      anchorIndex,
      baseChroma,
      baseLight,
      chromaProfile
    );

    var tokens = {};
    for (var i = 0; i < 12; i += 1) {
      var l = clamp(anchoredLightness[i] / 100, 0, 1);
      var hueStep = normalizeHue(
        hue + hueShiftForStep(i, anchorIndex, chromaProfile)
      );
      var c = fitChromaToGamut(l, anchoredChroma[i], hueStep);
      tokens["--coty-secondary-" + (i + 1)] = formatOklch(l, c, hueStep);
    }

    if (shouldPinSourceAtAnchor(mode, anchorStep, baseLight)) {
      tokens["--coty-secondary-" + anchorStep] = formatOklch(
        baseOklch.l,
        fitChromaToGamut(baseOklch.l, baseOklch.c, hue),
        hue
      );
    }

    return tokens;
  }

  function resolveRoleTokens(entry, scale, currentMode) {
    var anchor = Number(entry.anchor_step || 0);
    var sourceHex = entry.primary_hex || entry.hex;
    var sourceRgb = hexToRgb(sourceHex);
    var sourceOklch = sourceRgb ? rgbToOklch(sourceRgb) : { l: 0 };
    var requestedMode = String(entry.role_mode || "").toLowerCase();
    var modeIsManual =
      requestedMode === "primary" || requestedMode === "surface";
    var useSourceAsPrimary = false;

    if (!anchor || anchor < 1 || anchor > 12) {
      anchor = resolveAnchorStep(
        entry,
        currentMode === "dark" ? "dark" : "light",
        sourceOklch.l * 100
      );
    }

    if (requestedMode === "primary") {
      useSourceAsPrimary = true;
    } else if (requestedMode === "surface") {
      useSourceAsPrimary = false;
    } else {
      // Auto mode: use source for primary only when white-text contrast is sufficient.
      requestedMode = "auto";
      useSourceAsPrimary = contrastRatio(sourceHex, "#FFFFFF") >= 4.5;
    }

    // Keep primary action color on a strong step when source is assigned to surfaces.
    var primaryTokenFromScale = scale["--coty-9"] || scale["--coty-" + anchor];
    var surfaceBase = scale["--coty-" + anchor] || scale["--coty-4"];
    var surfaceStrong =
      scale["--coty-" + Math.min(anchor + 1, 12)] || scale["--coty-5"];

    return {
      mode: useSourceAsPrimary ? "primary" : "surface",
      requestedMode: requestedMode,
      manualMode: modeIsManual,
      anchor: anchor,
      primary: useSourceAsPrimary ? sourceHex : primaryTokenFromScale,
      primaryStrong: scale["--coty-11"],
      surface: useSourceAsPrimary ? scale["--coty-4"] : surfaceBase,
      surfaceStrong: useSourceAsPrimary ? scale["--coty-5"] : surfaceStrong,
    };
  }

  function resolveSecondaryAnchorStep(entry, mode) {
    if (!entry || !entry.secondary_hex) {
      return 0;
    }
    var explicitAnchor = Number(entry.secondary_anchor_step || 0);
    if (explicitAnchor >= 1 && explicitAnchor <= 12) {
      return explicitAnchor;
    }
    var secondaryRgb = hexToRgb(entry.secondary_hex);
    if (!secondaryRgb) {
      return 0;
    }
    var secondaryOklch = rgbToOklch(secondaryRgb);
    return resolveAnchorStep({ anchor_step: 0 }, mode, secondaryOklch.l * 100);
  }

  function clearDuoOverrides() {
    DUO_OVERRIDE_TOKENS.forEach(function (name) {
      document.documentElement.style.removeProperty(name);
    });
  }

  function clearManualOverrides() {
    APPLIED_MANUAL_OVERRIDES.forEach(function (name) {
      document.documentElement.style.removeProperty(name);
    });
    APPLIED_MANUAL_OVERRIDES = [];
  }

  function clearPantoneRuntimeTokens() {
    clearManualOverrides();
    clearDuoOverrides();
    for (var i = 1; i <= 12; i += 1) {
      document.documentElement.style.removeProperty("--coty-" + i);
      document.documentElement.style.removeProperty("--coty-secondary-" + i);
    }
    PANTONE_RUNTIME_TOKEN_NAMES.forEach(function (name) {
      document.documentElement.style.removeProperty(name);
    });
  }

  function applyPreviewTokens(scale, secondaryScale) {
    if (!scale) {
      return;
    }
    document.documentElement.style.setProperty(
      "--palette-coty-bg",
      scale["--coty-2"]
    );
    document.documentElement.style.setProperty(
      "--palette-coty-accent",
      scale["--coty-11"]
    );
    document.documentElement.style.setProperty(
      "--palette-coty-primary",
      scale["--coty-11"]
    );
    document.documentElement.style.setProperty(
      "--palette-coty-surface",
      scale["--coty-2"]
    );
    document.documentElement.style.setProperty(
      "--palette-coty-secondary",
      secondaryScale ? secondaryScale["--coty-secondary-8"] : scale["--coty-8"]
    );
    document.documentElement.style.setProperty("--palette-coty-seg1", "1");
    document.documentElement.style.setProperty("--palette-coty-seg2", "1");
    document.documentElement.style.setProperty(
      "--palette-coty-seg3",
      secondaryScale ? "1" : "0"
    );

    document.documentElement.style.setProperty(
      "--palette-pantone-bg",
      scale["--coty-2"]
    );
    document.documentElement.style.setProperty(
      "--palette-pantone-accent",
      scale["--coty-11"]
    );
    document.documentElement.style.setProperty(
      "--palette-pantone-primary",
      scale["--coty-11"]
    );
    document.documentElement.style.setProperty(
      "--palette-pantone-surface",
      scale["--coty-2"]
    );
    document.documentElement.style.setProperty(
      "--palette-pantone-secondary",
      secondaryScale ? secondaryScale["--coty-secondary-8"] : scale["--coty-8"]
    );
    document.documentElement.style.setProperty("--palette-pantone-seg1", "1");
    document.documentElement.style.setProperty("--palette-pantone-seg2", "1");
    document.documentElement.style.setProperty(
      "--palette-pantone-seg3",
      secondaryScale ? "1" : "0"
    );
  }

  function applyPreviewForMode(mode, yearOrEntry) {
    var entry =
      typeof yearOrEntry === "object" && yearOrEntry
        ? yearOrEntry
        : getEntry(yearOrEntry);
    if (!entry) {
      return null;
    }
    var resolvedMode = mode === "dark" ? "dark" : "light";
    var scale = buildScale(entry, resolvedMode);
    var secondaryScale = buildSecondaryScale(entry, resolvedMode);
    applyPreviewTokens(scale, secondaryScale);
    return entry;
  }

  function normalizeOverrideTokenName(key) {
    if (!key) {
      return "";
    }
    if (key.indexOf("--") === 0) {
      return key;
    }
    return "--" + String(key).replace(/_/g, "-");
  }

  function normalizeOverrideValue(raw) {
    if (typeof raw !== "string") {
      return String(raw);
    }
    var value = raw.trim();
    if (!value) {
      return "";
    }
    if (value.indexOf("var(") === 0) {
      return value;
    }
    if (value.indexOf("--") === 0) {
      return "var(" + value + ")";
    }
    if (/^coty(-secondary)?-\d+$/.test(value)) {
      return "var(--" + value + ")";
    }
    if (value.indexOf("#") === 0) {
      return value;
    }
    if (
      value.indexOf("hsl(") === 0 ||
      value.indexOf("oklch(") === 0 ||
      value.indexOf("rgb(") === 0
    ) {
      return value;
    }
    return value;
  }

  function getOverrideValue(overrides, keys) {
    if (!overrides || !Array.isArray(keys)) {
      return undefined;
    }
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      if (Object.prototype.hasOwnProperty.call(overrides, key)) {
        return overrides[key];
      }
    }
    return undefined;
  }

  function applyManualOverrides(entry) {
    clearManualOverrides();
    var currentMode =
      (document.documentElement.getAttribute("data-mode") || "light") === "dark"
        ? "dark"
        : "light";
    var baseOverrides = normalizeOverrides(entry && entry.overrides);
    var modeOverrides =
      currentMode === "dark"
        ? normalizeOverrides(entry && entry.overrides_dark)
        : normalizeOverrides(entry && entry.overrides_light);
    var overrides = Object.assign({}, baseOverrides, modeOverrides);
    var hasPrimaryOverride = Boolean(
      overrides["--primary"] || overrides.primary
    );
    var hasPrimaryStrongOverride = Boolean(
      overrides["--primary-strong"] ||
        overrides.primary_strong ||
        overrides["primary-strong"]
    );
    var hasOnPrimaryOverride = Boolean(
      overrides["--on-primary"] ||
        overrides.on_primary ||
        overrides["on-primary"]
    );
    var hasBrandPrimaryOverride = Boolean(
      overrides["--brand-primary"] ||
        overrides.brand_primary ||
        overrides["brand-primary"]
    );
    var hasBrandOnPrimaryOverride = Boolean(
      overrides["--brand-on-primary"] ||
        overrides.brand_on_primary ||
        overrides["brand-on-primary"]
    );
    var hasAccentPrimaryOverride = Boolean(
      overrides["--accent-primary"] ||
        overrides.accent_primary ||
        overrides["accent-primary"]
    );
    var hasTextAccentOverride = Boolean(
      overrides["--text-accent"] ||
        overrides.text_accent ||
        overrides["text-accent"]
    );
    var hasSecondaryOverride = Boolean(
      overrides["--secondary"] || overrides.secondary
    );
    var hasSecondaryStrongOverride = Boolean(
      overrides["--secondary-strong"] ||
        overrides.secondary_strong ||
        overrides["secondary-strong"]
    );
    var hasAccentSecondaryOverride = Boolean(
      overrides["--accent-secondary"] ||
        overrides.accent_secondary ||
        overrides["accent-secondary"]
    );
    var hasAccentSecondaryStrongOverride = Boolean(
      overrides["--accent-secondary-strong"] ||
        overrides.accent_secondary_strong ||
        overrides["accent-secondary-strong"]
    );
    var hasAccentPrimaryStrongOverride = Boolean(
      overrides["--accent-primary-strong"] ||
        overrides.accent_primary_strong ||
        overrides["accent-primary-strong"]
    );
    var brandPrimaryOverrideValue = normalizeOverrideValue(
      getOverrideValue(overrides, [
        "--brand-primary",
        "brand_primary",
        "brand-primary",
      ])
    );
    var brandOnPrimaryOverrideValue = normalizeOverrideValue(
      getOverrideValue(overrides, [
        "--brand-on-primary",
        "brand_on_primary",
        "brand-on-primary",
      ])
    );

    Object.keys(overrides).forEach(function (key) {
      var tokenName = normalizeOverrideTokenName(key);
      var tokenValue = normalizeOverrideValue(overrides[key]);
      if (!tokenName || !tokenValue) {
        return;
      }
      // Pantone image treatment is runtime-owned and should not be overridden by per-year drafts.
      if (
        tokenName === "--image-background" ||
        tokenName === "--image-blend-mode" ||
        tokenName === "--image-grayscale"
      ) {
        return;
      }
      document.documentElement.style.setProperty(tokenName, tokenValue);
      APPLIED_MANUAL_OVERRIDES.push(tokenName);
    });

    // Keep legacy aliases in sync so existing components react in real-time.
    if (
      hasAccentPrimaryOverride &&
      !hasBrandPrimaryOverride &&
      !hasPrimaryOverride
    ) {
      document.documentElement.style.setProperty(
        "--primary",
        "var(--accent-primary)"
      );
      APPLIED_MANUAL_OVERRIDES.push("--primary");
    }
    if (hasBrandPrimaryOverride && !hasPrimaryOverride) {
      document.documentElement.style.setProperty(
        "--primary",
        brandPrimaryOverrideValue || "var(--primary)"
      );
      APPLIED_MANUAL_OVERRIDES.push("--primary");
    }
    if (hasPrimaryOverride && !hasAccentPrimaryOverride) {
      document.documentElement.style.setProperty(
        "--accent-primary",
        "var(--primary)"
      );
      APPLIED_MANUAL_OVERRIDES.push("--accent-primary");
    }
    if (hasBrandOnPrimaryOverride && !hasOnPrimaryOverride) {
      document.documentElement.style.setProperty(
        "--on-primary",
        brandOnPrimaryOverrideValue || "var(--on-primary)"
      );
      APPLIED_MANUAL_OVERRIDES.push("--on-primary");
    }
    if (hasPrimaryStrongOverride && !hasAccentPrimaryStrongOverride) {
      document.documentElement.style.setProperty(
        "--accent-primary-strong",
        "var(--primary-strong)"
      );
      APPLIED_MANUAL_OVERRIDES.push("--accent-primary-strong");
    }
    if (hasAccentPrimaryStrongOverride && !hasPrimaryStrongOverride) {
      document.documentElement.style.setProperty(
        "--primary-strong",
        "var(--accent-primary-strong)"
      );
      APPLIED_MANUAL_OVERRIDES.push("--primary-strong");
    }
    if (
      (hasPrimaryStrongOverride || hasAccentPrimaryStrongOverride) &&
      !hasTextAccentOverride
    ) {
      document.documentElement.style.setProperty(
        "--text-accent",
        hasPrimaryStrongOverride
          ? "var(--primary-strong)"
          : "var(--accent-primary-strong)"
      );
      APPLIED_MANUAL_OVERRIDES.push("--text-accent");
    }
    if (hasAccentSecondaryOverride && !hasSecondaryOverride) {
      document.documentElement.style.setProperty(
        "--secondary",
        "var(--accent-secondary)"
      );
      APPLIED_MANUAL_OVERRIDES.push("--secondary");
    }
    if (hasSecondaryOverride && !hasAccentSecondaryOverride) {
      document.documentElement.style.setProperty(
        "--accent-secondary",
        "var(--secondary)"
      );
      APPLIED_MANUAL_OVERRIDES.push("--accent-secondary");
    }
    if (hasAccentSecondaryStrongOverride && !hasSecondaryStrongOverride) {
      document.documentElement.style.setProperty(
        "--secondary-strong",
        "var(--accent-secondary-strong)"
      );
      APPLIED_MANUAL_OVERRIDES.push("--secondary-strong");
    }
    if (hasSecondaryStrongOverride && !hasAccentSecondaryStrongOverride) {
      document.documentElement.style.setProperty(
        "--accent-secondary-strong",
        "var(--secondary-strong)"
      );
      APPLIED_MANUAL_OVERRIDES.push("--accent-secondary-strong");
    }
  }

  function mergeEntryConfig(baseEntry, override) {
    if (!baseEntry) {
      return null;
    }
    if (!override || typeof override !== "object") {
      return baseEntry;
    }

    var next = Object.assign({}, baseEntry);
    var mode = String(override.role_mode || "").toLowerCase();
    if (mode === "primary" || mode === "surface") {
      next.role_mode = mode;
    } else if (mode === "auto" || mode === "") {
      next.role_mode = "";
    }

    var anchor = Number(override.anchor_step || 0);
    if (anchor >= 1 && anchor <= 12) {
      next.anchor_step = anchor;
    } else if (override.anchor_step === "" || anchor === 0) {
      next.anchor_step = 0;
    }

    var baseOverrides = normalizeOverrides(baseEntry.overrides || {});
    var baseOverridesLight = normalizeOverrides(
      baseEntry.overrides_light || {}
    );
    var baseOverridesDark = normalizeOverrides(baseEntry.overrides_dark || {});
    var overrideOverrides = normalizeOverrides(override.overrides || {});
    var overrideOverridesLight = normalizeOverrides(
      override.overrides_light || {}
    );
    var overrideOverridesDark = normalizeOverrides(
      override.overrides_dark || {}
    );
    var overrideMode = String(override.mode || "").toLowerCase();

    next.overrides = Object.assign({}, baseOverrides, overrideOverrides);
    next.overrides_light = Object.assign(
      {},
      baseOverridesLight,
      overrideOverridesLight
    );
    next.overrides_dark = Object.assign(
      {},
      baseOverridesDark,
      overrideOverridesDark
    );

    // Allow passing mode-specific draft overrides through a generic "overrides" payload.
    if (overrideMode === "dark" && Object.keys(overrideOverrides).length) {
      next.overrides_dark = Object.assign(
        {},
        next.overrides_dark,
        overrideOverrides
      );
    } else if (
      overrideMode === "light" &&
      Object.keys(overrideOverrides).length
    ) {
      next.overrides_light = Object.assign(
        {},
        next.overrides_light,
        overrideOverrides
      );
    }
    return next;
  }

  function getState() {
    var data = parseData();
    var entries = data ? normalizedEntries(data.colors) : [];
    var defaultYear =
      data && Number(data.meta && data.meta.default_year)
        ? Number(data.meta.default_year)
        : entries[0]
        ? entries[0].year
        : 2026;
    return {
      entries: entries,
      defaultYear: defaultYear,
    };
  }

  function getEntry(year) {
    var state = getState();
    var numeric = Number(year);
    var entry = state.entries.find(function (item) {
      return item.year === numeric;
    });
    return (
      entry ||
      state.entries.find(function (item) {
        return item.year === state.defaultYear;
      }) ||
      null
    );
  }

  function getScaleForEntry(entryOrYear, mode) {
    var entry =
      typeof entryOrYear === "object" && entryOrYear
        ? entryOrYear
        : getEntry(entryOrYear);
    if (!entry) {
      return null;
    }
    var resolvedMode = mode === "dark" ? "dark" : "light";
    return buildScale(entry, resolvedMode);
  }

  function getSecondaryScaleForEntry(entryOrYear, mode) {
    var entry =
      typeof entryOrYear === "object" && entryOrYear
        ? entryOrYear
        : getEntry(entryOrYear);
    if (!entry) {
      return null;
    }
    var resolvedMode = mode === "dark" ? "dark" : "light";
    return buildSecondaryScale(entry, resolvedMode);
  }

  function getResolvedRolesForEntry(entryOrYear, mode) {
    var entry =
      typeof entryOrYear === "object" && entryOrYear
        ? entryOrYear
        : getEntry(entryOrYear);
    if (!entry) {
      return null;
    }
    var resolvedMode = mode === "dark" ? "dark" : "light";
    var scale = buildScale(entry, resolvedMode);
    if (!scale) {
      return null;
    }
    return resolveRoleTokens(entry, scale, resolvedMode);
  }

  function applyForMode(mode, yearOrEntry) {
    var entry =
      typeof yearOrEntry === "object" && yearOrEntry
        ? yearOrEntry
        : getEntry(yearOrEntry);
    if (!entry) {
      return null;
    }

    var resolvedMode = mode === "dark" ? "dark" : "light";
    var scale = buildScale(entry, resolvedMode);
    var secondaryScale = buildSecondaryScale(entry, resolvedMode);
    if (!scale) {
      return null;
    }
    var roles = resolveRoleTokens(entry, scale, resolvedMode);

    Object.keys(scale).forEach(function (name) {
      document.documentElement.style.setProperty(name, scale[name]);
    });
    if (secondaryScale) {
      Object.keys(secondaryScale).forEach(function (name) {
        document.documentElement.style.setProperty(name, secondaryScale[name]);
      });
    } else {
      for (var i = 1; i <= 12; i += 1) {
        document.documentElement.style.removeProperty("--coty-secondary-" + i);
      }
    }

    document.documentElement.setAttribute("data-coty-year", String(entry.year));
    applyPreviewTokens(scale, secondaryScale);

    document.documentElement.style.setProperty("--coty-role-mode", roles.mode);
    document.documentElement.style.setProperty(
      "--coty-role-anchor-step",
      String(roles.anchor)
    );
    document.documentElement.style.setProperty(
      "--coty-role-primary",
      roles.primary
    );
    document.documentElement.style.setProperty(
      "--coty-role-primary-strong",
      roles.primaryStrong
    );
    document.documentElement.style.setProperty("--primary", roles.primary);
    document.documentElement.style.setProperty(
      "--primary-strong",
      roles.primaryStrong
    );
    document.documentElement.style.setProperty(
      "--coty-role-surface",
      roles.surface
    );
    document.documentElement.style.setProperty(
      "--coty-role-surface-strong",
      roles.surfaceStrong
    );
    document.documentElement.style.setProperty(
      "--coty-role-border-subtle",
      scale["--coty-5"] || roles.surfaceStrong
    );
    document.documentElement.style.setProperty(
      "--coty-role-border-default",
      scale["--coty-6"] || roles.surfaceStrong
    );
    document.documentElement.style.setProperty(
      "--coty-role-border-strong",
      scale["--coty-8"] || roles.primaryStrong
    );
    document.documentElement.style.setProperty(
      "--border-subtle",
      "var(--coty-role-border-subtle)"
    );
    document.documentElement.style.setProperty(
      "--border-default",
      "var(--coty-role-border-default)"
    );
    document.documentElement.style.setProperty(
      "--border-strong",
      "var(--coty-role-border-strong)"
    );
    document.documentElement.style.setProperty(
      "--coty-source-step",
      String(roles.anchor)
    );

    // Pantone rule: on-primary must come from COTY scale (never pure black/white).
    var primaryHex = colorToHex(resolveColorValue(roles.primary));
    var onLightHex = colorToHex(scale["--coty-1"]);
    var onDarkHex = colorToHex(scale["--coty-12"]);
    var onPrimaryToken = "--coty-1";
    if (primaryHex && onLightHex && onDarkHex) {
      var contrastToLight = contrastRatio(primaryHex, onLightHex);
      var contrastToDark = contrastRatio(primaryHex, onDarkHex);
      onPrimaryToken =
        contrastToLight >= contrastToDark ? "--coty-1" : "--coty-12";
    }
    document.documentElement.style.setProperty(
      "--coty-role-on-primary",
      "var(" + onPrimaryToken + ")"
    );
    document.documentElement.style.setProperty(
      "--on-primary",
      "var(" + onPrimaryToken + ")"
    );

    var secondaryAnchor = resolveSecondaryAnchorStep(entry, resolvedMode);
    if (secondaryAnchor) {
      document.documentElement.style.setProperty(
        "--coty-secondary-source-step",
        String(secondaryAnchor)
      );
    } else {
      document.documentElement.style.removeProperty(
        "--coty-secondary-source-step"
      );
    }

    // Pantone image treatment is runtime-driven:
    // - light mode: step 9
    // - dark mode: step 5
    // - mono years: single-scale background
    // - duo years: gradient between primary and secondary at the same step
    document.documentElement.style.setProperty("--image-grayscale", "100%");
    document.documentElement.style.setProperty("--image-blend-mode", "screen");
    var imageStep = resolvedMode === "dark" ? 5 : 9;
    if (secondaryScale) {
      var primarySourceToken = "var(--coty-" + String(imageStep) + ")";
      var secondarySourceToken =
        "var(--coty-secondary-" + String(imageStep) + ")";
      document.documentElement.style.setProperty(
        "--image-background",
        "linear-gradient(135deg, " +
          primarySourceToken +
          ", " +
          secondarySourceToken +
          ")"
      );
    } else {
      document.documentElement.style.setProperty(
        "--image-background",
        "var(--coty-" + String(imageStep) + ")"
      );
    }

    if (secondaryScale) {
      document.documentElement.style.setProperty(
        "--secondary",
        secondaryScale["--coty-secondary-4"]
      );
      document.documentElement.style.setProperty(
        "--secondary-strong",
        secondaryScale["--coty-secondary-8"]
      );
      document.documentElement.style.setProperty(
        "--on-secondary",
        "var(--coty-12)"
      );
      document.documentElement.style.setProperty(
        "--component-toc-active-indicator",
        secondaryScale["--coty-secondary-8"]
      );
      document.documentElement.style.setProperty(
        "--component-section-headline-bg",
        secondaryScale["--coty-secondary-8"]
      );
    } else {
      document.documentElement.style.removeProperty("--on-secondary");
      clearDuoOverrides();
    }

    applyManualOverrides(entry);

    return entry;
  }

  function getStoredYear() {
    var stored = Number(localStorage.getItem(STORAGE_KEY));
    if (!stored) {
      return null;
    }
    return stored;
  }

  function getCurrentYear() {
    var attr = Number(document.documentElement.getAttribute("data-coty-year"));
    if (attr) {
      return attr;
    }
    var stored = getStoredYear();
    if (stored) {
      return stored;
    }
    return getState().defaultYear;
  }

  function setYear(year, options) {
    var opts = options || {};
    var baseEntry = getEntry(year);
    var entry = mergeEntryConfig(baseEntry, opts.entryOverride);
    if (!entry) {
      return null;
    }

    if (!opts.skipStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, String(entry.year));
      } catch {
        // Ignore storage failure.
      }
    }

    document.documentElement.setAttribute("data-coty-year", String(entry.year));
    var previewMode =
      (document.documentElement.getAttribute("data-mode") ||
        opts.mode ||
        "light") === "dark"
        ? "dark"
        : "light";
    applyPreviewForMode(previewMode, entry);
    if (!opts.forceApply && !isPantoneActive()) {
      return entry;
    }
    var mode =
      opts.mode ||
      document.documentElement.getAttribute("data-mode") ||
      "light";
    return applyForMode(mode, entry);
  }

  function init() {
    var year = getCurrentYear();
    document.documentElement.setAttribute("data-coty-year", String(year));
    if (!isPantoneActive()) {
      return;
    }
    var mode = document.documentElement.getAttribute("data-mode") || "light";
    applyForMode(mode, year);
  }

  window.CotyScaleActions = {
    init: init,
    setYear: setYear,
    clearRuntime: clearPantoneRuntimeTokens,
    getCurrentYear: getCurrentYear,
    getEntry: getEntry,
    getScaleForEntry: getScaleForEntry,
    getSecondaryScaleForEntry: getSecondaryScaleForEntry,
    getResolvedRolesForEntry: getResolvedRolesForEntry,
    applyPreviewForMode: applyPreviewForMode,
    getEntries: function () {
      return getState().entries;
    },
    getDefaultYear: function () {
      return getState().defaultYear;
    },
    applyForMode: function (mode) {
      return applyForMode(mode, getCurrentYear());
    },
  };
})();
