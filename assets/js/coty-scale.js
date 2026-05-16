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
  var _tritoneAnimFrame = null;
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
    "--border-subtle",
    "--border-default",
    "--border-strong",
    "--primary",
    "--primary-strong",
    "--on-primary",
    "--action",
    "--on-action",
    "--component-nav-cta-bg",
    "--component-nav-cta-text",
    "--on-secondary",
    "--accent-primary",
    "--accent-primary-strong",
    "--secondary",
    "--secondary-strong",
    "--image-grayscale",
    "--image-shadow-blend-mode",
    "--image-highlight-blend-mode",
    "--image-shadow-background",
    "--image-highlight-background",
    "--image-shadow-opacity",
    "--image-highlight-opacity",
    "--image-blend-mode",
    "--image-background",
    "--accent-secondary",
    "--accent-secondary-strong",
    "--component-toc-active-indicator",
    "--component-section-headline-bg",
  ];
  var TRITONE_FILTER_ID = "pantone-tritone";
  var TRITONE_SVG_ID = "pantone-tritone-defs";

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

  function getScaleStepToken(prefix, step) {
    return "--" + prefix + "-" + String(clamp(Number(step) || 1, 1, 12));
  }

  function getScaleColor(scaleMap, prefix, step) {
    if (!scaleMap) {
      return "";
    }
    return scaleMap[getScaleStepToken(prefix, step)] || "";
  }

  function extractStepFromVarToken(value, prefix) {
    var regex = new RegExp("--" + prefix + "-(\\d+)");
    var match = String(value || "").match(regex);
    if (!match) {
      return 0;
    }
    var step = Number(match[1]);
    if (!step || step < 1 || step > 12) {
      return 0;
    }
    return step;
  }

  function rgbDistance(a, b) {
    if (!a || !b) {
      return Infinity;
    }
    var dr = a.r - b.r;
    var dg = a.g - b.g;
    var db = a.b - b.b;
    return dr * dr + dg * dg + db * db;
  }

  function findNearestScaleStep(scaleMap, prefix, targetColorValue) {
    var targetHex = colorToHex(targetColorValue);
    var targetRgb = hexToRgb(targetHex);
    if (!targetRgb) {
      return 0;
    }
    var bestStep = 0;
    var bestDistance = Infinity;
    for (var step = 1; step <= 12; step += 1) {
      var candidate = getScaleColor(scaleMap, prefix, step);
      var candidateHex = colorToHex(candidate);
      var candidateRgb = hexToRgb(candidateHex);
      var distance = rgbDistance(targetRgb, candidateRgb);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestStep = step;
      }
    }
    return bestStep;
  }

  function colorValueToRgbUnit(value) {
    var hex = colorToHex(value);
    if (!hex) {
      return null;
    }
    return hexToRgbUnit(hex);
  }

  function colorValueLuminance(value) {
    var hex = colorToHex(value);
    if (!hex) {
      return 0;
    }
    return relativeLuminance(hex);
  }

  function ensureTritoneFilterNodes() {
    var existing = document.getElementById(TRITONE_SVG_ID);
    if (!existing) {
      var host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      host.setAttribute("id", TRITONE_SVG_ID);
      host.setAttribute("aria-hidden", "true");
      host.style.position = "absolute";
      host.style.width = "0";
      host.style.height = "0";

      var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      var filter = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "filter"
      );
      filter.setAttribute("id", TRITONE_FILTER_ID);
      filter.setAttribute("color-interpolation-filters", "sRGB");

      var matrix = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feColorMatrix"
      );
      matrix.setAttribute("type", "saturate");
      matrix.setAttribute("values", "0");
      matrix.setAttribute("result", "gray");

      var transfer = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feComponentTransfer"
      );
      transfer.setAttribute("in", "gray");

      var funcR = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feFuncR"
      );
      funcR.setAttribute("type", "table");
      funcR.setAttribute("tableValues", "0 0 0");
      funcR.setAttribute("id", TRITONE_FILTER_ID + "-r");

      var funcG = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feFuncG"
      );
      funcG.setAttribute("type", "table");
      funcG.setAttribute("tableValues", "0 0 0");
      funcG.setAttribute("id", TRITONE_FILTER_ID + "-g");

      var funcB = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feFuncB"
      );
      funcB.setAttribute("type", "table");
      funcB.setAttribute("tableValues", "0 0 0");
      funcB.setAttribute("id", TRITONE_FILTER_ID + "-b");

      transfer.appendChild(funcR);
      transfer.appendChild(funcG);
      transfer.appendChild(funcB);
      filter.appendChild(matrix);
      filter.appendChild(transfer);
      defs.appendChild(filter);
      host.appendChild(defs);
      document.body.appendChild(host);
    }
    return {
      r: document.getElementById(TRITONE_FILTER_ID + "-r"),
      g: document.getElementById(TRITONE_FILTER_ID + "-g"),
      b: document.getElementById(TRITONE_FILTER_ID + "-b"),
    };
  }

  function setTritoneTableValues(nodes, shadow, mid, highlight) {
    if (!nodes || !nodes.r || !nodes.g || !nodes.b) {
      return;
    }
    var shadowRgb = colorValueToRgbUnit(shadow);
    var midRgb = colorValueToRgbUnit(mid);
    var highlightRgb = colorValueToRgbUnit(highlight);
    if (!shadowRgb || !midRgb || !highlightRgb) {
      return;
    }
    nodes.r.setAttribute(
      "tableValues",
      round3(shadowRgb.r) +
        " " +
        round3(midRgb.r) +
        " " +
        round3(highlightRgb.r)
    );
    nodes.g.setAttribute(
      "tableValues",
      round3(shadowRgb.g) +
        " " +
        round3(midRgb.g) +
        " " +
        round3(highlightRgb.g)
    );
    nodes.b.setAttribute(
      "tableValues",
      round3(shadowRgb.b) +
        " " +
        round3(midRgb.b) +
        " " +
        round3(highlightRgb.b)
    );
  }

  function parseFuncTableValues(node) {
    if (!node) {
      return null;
    }
    var parts = (node.getAttribute("tableValues") || "").trim().split(/\s+/);
    if (parts.length !== 3) {
      return null;
    }
    var vals = [
      parseFloat(parts[0]),
      parseFloat(parts[1]),
      parseFloat(parts[2]),
    ];
    return vals.some(isNaN) ? null : vals;
  }

  function easeOutTheme(t) {
    // Matches cubic-bezier(0.075, 0.82, 0.165, 1) closely
    return 1 - Math.pow(1 - t, 3);
  }

  function getThemeTransitionDuration() {
    if (
      !document.body ||
      !document.body.classList.contains("darkmodeTransition")
    ) {
      return 0;
    }
    var val =
      document.body.style.getPropertyValue("--theme-transition-duration") || "";
    var ms = parseFloat(val);
    return isNaN(ms) || ms <= 0 ? 0 : ms;
  }

  function animateTritoneTableValues(
    nodes,
    shadow,
    mid,
    highlight,
    durationMs
  ) {
    if (_tritoneAnimFrame) {
      cancelAnimationFrame(_tritoneAnimFrame);
      _tritoneAnimFrame = null;
    }
    var toShadow = colorValueToRgbUnit(shadow);
    var toMid = colorValueToRgbUnit(mid);
    var toHighlight = colorValueToRgbUnit(highlight);
    if (!toShadow || !toMid || !toHighlight) {
      setTritoneTableValues(nodes, shadow, mid, highlight);
      return;
    }
    var fromR = parseFuncTableValues(nodes.r);
    var fromG = parseFuncTableValues(nodes.g);
    var fromB = parseFuncTableValues(nodes.b);
    if (!fromR || !fromG || !fromB) {
      setTritoneTableValues(nodes, shadow, mid, highlight);
      return;
    }
    var startTime = null;
    function step(ts) {
      if (!startTime) {
        startTime = ts;
      }
      var t = Math.min((ts - startTime) / durationMs, 1);
      var e = easeOutTheme(t);
      nodes.r.setAttribute(
        "tableValues",
        round3(fromR[0] + (toShadow.r - fromR[0]) * e) +
          " " +
          round3(fromR[1] + (toMid.r - fromR[1]) * e) +
          " " +
          round3(fromR[2] + (toHighlight.r - fromR[2]) * e)
      );
      nodes.g.setAttribute(
        "tableValues",
        round3(fromG[0] + (toShadow.g - fromG[0]) * e) +
          " " +
          round3(fromG[1] + (toMid.g - fromG[1]) * e) +
          " " +
          round3(fromG[2] + (toHighlight.g - fromG[2]) * e)
      );
      nodes.b.setAttribute(
        "tableValues",
        round3(fromB[0] + (toShadow.b - fromB[0]) * e) +
          " " +
          round3(fromB[1] + (toMid.b - fromB[1]) * e) +
          " " +
          round3(fromB[2] + (toHighlight.b - fromB[2]) * e)
      );
      if (t < 1) {
        _tritoneAnimFrame = requestAnimationFrame(step);
      } else {
        _tritoneAnimFrame = null;
      }
    }
    _tritoneAnimFrame = requestAnimationFrame(step);
  }

  function applyPantoneTritone(scale, secondaryScale, roles, stepOverrides) {
    if (!scale || !roles) {
      document.documentElement.removeAttribute("data-image-tone");
      return;
    }

    var nodes = ensureTritoneFilterNodes();
    if (!nodes || !nodes.r || !nodes.g || !nodes.b) {
      document.documentElement.removeAttribute("data-image-tone");
      return;
    }

    var primarySource = resolveColorValue(roles.primary);
    var primaryStep =
      extractStepFromVarToken(roles.primary, "coty") ||
      findNearestScaleStep(scale, "coty", primarySource) ||
      DEFAULT_ANCHOR_STEP;

    var candidateA = clamp(primaryStep + 2, 1, 10);
    var candidateB = clamp(primaryStep - 6, 1, 12);
    var colorA = getScaleColor(scale, "coty", candidateA);
    var colorB = getScaleColor(scale, "coty", candidateB);
    var luminanceA = colorValueLuminance(colorA);
    var luminanceB = colorValueLuminance(colorB);

    var shadowColor = luminanceA <= luminanceB ? colorA : colorB;
    var highlightStep = luminanceA <= luminanceB ? candidateB : candidateA;
    var highlightColor = luminanceA <= luminanceB ? colorB : colorA;
    var midColor = primarySource || getScaleColor(scale, "coty", primaryStep);

    if (secondaryScale) {
      var duoHighlight =
        getScaleColor(secondaryScale, "coty-secondary", highlightStep) ||
        highlightColor;
      highlightColor = duoHighlight;
    }

    var overrides = stepOverrides || {};
    if (overrides.shadow) {
      shadowColor = overrides.shadow;
    }
    if (overrides.mid) {
      midColor = overrides.mid;
    }
    if (overrides.highlight) {
      highlightColor = overrides.highlight;
    }

    var transitionMs = getThemeTransitionDuration();
    if (transitionMs > 0) {
      animateTritoneTableValues(
        nodes,
        shadowColor,
        midColor,
        highlightColor,
        transitionMs
      );
    } else {
      setTritoneTableValues(nodes, shadowColor, midColor, highlightColor);
    }
    document.documentElement.setAttribute("data-image-tone", "tritone");
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
        secondary_name: String(item.secondary_name || ""),
        secondary_hex: normalizeHex(item.secondary_hex),
        secondary_role_mode: String(item.secondary_role_mode || ""),
        secondary_anchor_step: Number(item.secondary_anchor_step || 0),
        source_step_light: Number(item.source_step_light || 0),
        source_step_dark: Number(item.source_step_dark || 0),
        secondary_source_step_light: Number(
          item.secondary_source_step_light || 0
        ),
        secondary_source_step_dark: Number(
          item.secondary_source_step_dark || 0
        ),
        scale_light: normalizeScaleDefinition(item.scale_light, "coty"),
        scale_dark: normalizeScaleDefinition(item.scale_dark, "coty"),
        secondary_scale_light: normalizeScaleDefinition(
          item.secondary_scale_light,
          "coty-secondary"
        ),
        secondary_scale_dark: normalizeScaleDefinition(
          item.secondary_scale_dark,
          "coty-secondary"
        ),
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
        var secondary =
          primary.secondary_hex && primary.secondary_name
            ? {
                name: primary.secondary_name,
                hex: primary.secondary_hex,
                role_mode: primary.secondary_role_mode || "",
                anchor_step: primary.secondary_anchor_step || 0,
                source_step_light: primary.secondary_source_step_light || 0,
                source_step_dark: primary.secondary_source_step_dark || 0,
                scale_light: primary.secondary_scale_light || null,
                scale_dark: primary.secondary_scale_dark || null,
              }
            : colors[1] || null;

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
          secondary_source_step_light: secondary
            ? secondary.source_step_light || 0
            : 0,
          secondary_source_step_dark: secondary
            ? secondary.source_step_dark || 0
            : 0,
          secondary_scale_light: secondary
            ? secondary.scale_light || null
            : null,
          secondary_scale_dark: secondary ? secondary.scale_dark || null : null,
          tone_mode: secondary ? "duo" : "mono",
          role_mode: primary.role_mode || "",
          anchor_step: primary.anchor_step || 0,
          source_step_light: primary.source_step_light || 0,
          source_step_dark: primary.source_step_dark || 0,
          scale_light: primary.scale_light || null,
          scale_dark: primary.scale_dark || null,
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

  function normalizeScaleValue(raw) {
    var value = String(raw || "").trim();
    if (!value) {
      return "";
    }
    if (value.indexOf("#") === 0) {
      return normalizeHex(value) || "";
    }
    if (
      value.indexOf("oklch(") === 0 ||
      value.indexOf("rgb(") === 0 ||
      value.indexOf("hsl(") === 0 ||
      value.indexOf("var(") === 0
    ) {
      return value;
    }
    return value;
  }

  function normalizeScaleDefinition(raw, prefix) {
    if (!raw || typeof raw !== "object") {
      return null;
    }
    var tokenPrefix = prefix || "coty";
    var out = {};
    for (var step = 1; step <= 12; step += 1) {
      var value = normalizeScaleValue(raw[String(step)]);
      if (!value) {
        return null;
      }
      out["--" + tokenPrefix + "-" + step] = value;
    }
    return out;
  }

  function getExplicitScaleForMode(entry, mode) {
    if (!entry) {
      return null;
    }
    if (mode === "dark" && entry.scale_dark) {
      return entry.scale_dark;
    }
    if (mode !== "dark" && entry.scale_light) {
      return entry.scale_light;
    }
    return null;
  }

  function getSourceStepForMode(entry, mode, fallbackStep) {
    if (!entry) {
      return fallbackStep || 0;
    }
    var explicit =
      mode === "dark"
        ? Number(entry.source_step_dark || 0)
        : Number(entry.source_step_light || 0);
    if (explicit >= 1 && explicit <= 12) {
      return explicit;
    }
    return Number(fallbackStep || 0);
  }

  function hasExplicitSourceStepForMode(entry, mode) {
    if (!entry) {
      return false;
    }
    var explicit =
      mode === "dark"
        ? Number(entry.source_step_dark || 0)
        : Number(entry.source_step_light || 0);
    return explicit >= 1 && explicit <= 12;
  }

  function getSecondarySourceStepForMode(entry, mode, fallbackStep) {
    if (!entry) {
      return Number(fallbackStep || 0);
    }
    var explicit =
      mode === "dark"
        ? Number(entry.secondary_source_step_dark || 0)
        : Number(entry.secondary_source_step_light || 0);
    if (explicit >= 1 && explicit <= 12) {
      return explicit;
    }
    return Number(fallbackStep || 0);
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

  function buildScale(entry, mode) {
    return getExplicitScaleForMode(entry, mode);
  }

  function buildSecondaryScale(entry, mode) {
    if (!entry.secondary_hex) {
      return null;
    }
    return mode === "dark"
      ? entry.secondary_scale_dark || null
      : entry.secondary_scale_light || null;
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
    document.documentElement.removeAttribute("data-image-tone");
    document.documentElement.removeAttribute("data-coty-year");
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
        tokenName === "--image-grayscale" ||
        tokenName === "--image-shadow-background" ||
        tokenName === "--image-highlight-background" ||
        tokenName === "--image-shadow-blend-mode" ||
        tokenName === "--image-highlight-blend-mode" ||
        tokenName === "--image-shadow-opacity" ||
        tokenName === "--image-highlight-opacity"
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

    // Only inject via JS for years where no build-time CSS scale exists
    var hasExplicitScale =
      resolvedMode === "dark"
        ? Boolean(entry.scale_dark)
        : Boolean(entry.scale_light);
    if (!hasExplicitScale) {
      Object.keys(scale).forEach(function (name) {
        document.documentElement.style.setProperty(name, scale[name]);
      });
    }
    var hasExplicitSecondaryScale =
      resolvedMode === "dark" ? false : Boolean(entry.secondary_scale_light);
    if (secondaryScale && !hasExplicitSecondaryScale) {
      Object.keys(secondaryScale).forEach(function (name) {
        document.documentElement.style.setProperty(name, secondaryScale[name]);
      });
    } else if (!secondaryScale) {
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
      String(getSourceStepForMode(entry, resolvedMode, roles.anchor))
    );
    document.documentElement.setAttribute(
      "data-coty-source-explicit",
      hasExplicitSourceStepForMode(entry, resolvedMode) ? "true" : "false"
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
    if (secondaryScale) {
      document.documentElement.style.setProperty("--action", roles.primary);
      document.documentElement.style.setProperty(
        "--on-action",
        "var(" + onPrimaryToken + ")"
      );
    } else {
      document.documentElement.style.setProperty(
        "--action",
        "var(--text-default)"
      );
      document.documentElement.style.setProperty(
        "--on-action",
        "var(--surface-page)"
      );
    }
    document.documentElement.style.setProperty(
      "--component-nav-cta-bg",
      "var(--primary)"
    );
    document.documentElement.style.setProperty(
      "--component-nav-cta-text",
      "var(--on-primary)"
    );

    var secondaryAnchor = resolveSecondaryAnchorStep(entry, resolvedMode);
    var secondarySourceStep = getSecondarySourceStepForMode(
      entry,
      resolvedMode,
      secondaryAnchor
    );
    if (secondarySourceStep) {
      document.documentElement.style.setProperty(
        "--coty-secondary-source-step",
        String(secondarySourceStep)
      );
    } else {
      document.documentElement.style.removeProperty(
        "--coty-secondary-source-step"
      );
    }

    // Pantone image treatment is runtime-driven:
    // - mono years: dark+light tones from the same scale (11 + 3)
    // - duo years: dark tones from primary and highlights from secondary (11 + 3)
    document.documentElement.style.setProperty("--image-grayscale", "100%");
    document.documentElement.style.setProperty(
      "--image-shadow-blend-mode",
      "multiply"
    );
    document.documentElement.style.setProperty(
      "--image-highlight-blend-mode",
      "screen"
    );
    document.documentElement.style.setProperty(
      "--image-shadow-opacity",
      resolvedMode === "dark" ? "0.9" : "0.78"
    );
    document.documentElement.style.setProperty(
      "--image-highlight-opacity",
      resolvedMode === "dark" ? "0.72" : "0.68"
    );
    document.documentElement.style.setProperty("--image-blend-mode", "screen");
    var shadowStep = resolvedMode === "dark" ? 11 : 3;
    var highlightStep = resolvedMode === "dark" ? 3 : 11;
    if (secondaryScale) {
      var shadowSourceToken = "var(--coty-" + String(shadowStep) + ")";
      var highlightSourceToken =
        "var(--coty-secondary-" + String(highlightStep) + ")";
      document.documentElement.style.setProperty(
        "--image-shadow-background",
        shadowSourceToken
      );
      document.documentElement.style.setProperty(
        "--image-highlight-background",
        highlightSourceToken
      );
      document.documentElement.style.setProperty(
        "--image-background",
        highlightSourceToken
      );
    } else {
      var monoShadowToken = "var(--coty-" + String(shadowStep) + ")";
      var monoHighlightToken = "var(--coty-" + String(highlightStep) + ")";
      document.documentElement.style.setProperty(
        "--image-shadow-background",
        monoShadowToken
      );
      document.documentElement.style.setProperty(
        "--image-highlight-background",
        monoHighlightToken
      );
      document.documentElement.style.setProperty(
        "--image-background",
        monoHighlightToken
      );
    }

    var draftOverrides = readFullDraft(entry.year, resolvedMode);
    var entryWithDraft = Object.assign({}, entry);
    if (resolvedMode === "dark") {
      entryWithDraft.overrides_dark = Object.assign(
        {},
        entry.overrides_dark || {},
        draftOverrides
      );
    } else {
      entryWithDraft.overrides_light = Object.assign(
        {},
        entry.overrides_light || {},
        draftOverrides
      );
    }

    var modeOverridesForTritone =
      resolvedMode === "dark"
        ? normalizeOverrides(entryWithDraft.overrides_dark)
        : normalizeOverrides(entryWithDraft.overrides_light);
    var baseOverridesForTritone = normalizeOverrides(entryWithDraft.overrides);
    var allOverridesForTritone = Object.assign(
      {},
      baseOverridesForTritone,
      modeOverridesForTritone
    );
    function resolveStepColor(key) {
      var raw = allOverridesForTritone[key];
      if (!raw) {
        return null;
      }
      var secondaryStep = extractStepFromVarToken(
        String(raw),
        "coty-secondary"
      );
      if (secondaryStep && secondaryScale) {
        return (
          getScaleColor(secondaryScale, "coty-secondary", secondaryStep) || null
        );
      }
      var step = extractStepFromVarToken(String(raw), "coty");
      if (!step) {
        return null;
      }
      return getScaleColor(scale, "coty", step) || null;
    }
    applyPantoneTritone(scale, secondaryScale, roles, {
      shadow: resolveStepColor("tritone_shadow_step"),
      mid: resolveStepColor("tritone_mid_step"),
      highlight: resolveStepColor("tritone_highlight_step"),
    });

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

    applyManualOverrides(entryWithDraft);

    return entry;
  }

  function readFullDraft(year, mode) {
    try {
      var raw = localStorage.getItem("pantone-lab::" + String(year || ""));
      if (!raw) {
        return {};
      }
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return {};
      }
      var bucket =
        mode === "dark"
          ? parsed.overrides_dark || {}
          : parsed.overrides_light || {};
      var out = {};
      Object.keys(bucket).forEach(function (k) {
        if (bucket[k]) {
          out[k] = bucket[k];
        }
      });
      return out;
    } catch {
      return {};
    }
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
