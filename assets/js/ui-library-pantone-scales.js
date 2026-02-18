(function () {
  "use strict";

  var host = null;
  var actions = null;
  var entries = [];

  function hexToRgb(hex) {
    var value = String(hex || "")
      .trim()
      .replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(value)) {
      return null;
    }
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  }

  function parseHsl(input) {
    var match = String(input || "").match(
      /hsl\(\s*([0-9.]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%\s*\)/i
    );
    if (!match) {
      return null;
    }
    return {
      h: Number(match[1]),
      s: Number(match[2]) / 100,
      l: Number(match[3]) / 100,
    };
  }

  function parseOklch(input) {
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

  function hslToRgb(hsl) {
    if (!hsl) {
      return null;
    }
    var h = (hsl.h % 360) / 360;
    var s = hsl.s;
    var l = hsl.l;
    var r;
    var g;
    var b;

    if (s === 0) {
      r = g = b = l;
    } else {
      var hue2rgb = function (p, q, t) {
        if (t < 0) {
          t += 1;
        }
        if (t > 1) {
          t -= 1;
        }
        if (t < 1 / 6) {
          return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
          return q;
        }
        if (t < 2 / 3) {
          return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
      };
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  function linearToSrgb(value) {
    if (value <= 0.0031308) {
      return 12.92 * value;
    }
    return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  }

  function oklchToRgb(oklch) {
    if (!oklch) {
      return null;
    }
    var hue = oklch.h * (Math.PI / 180);
    var oka = oklch.c * Math.cos(hue);
    var okb = oklch.c * Math.sin(hue);

    var l_ = oklch.l + 0.3963377774 * oka + 0.2158037573 * okb;
    var m_ = oklch.l - 0.1055613458 * oka - 0.0638541728 * okb;
    var s_ = oklch.l - 0.0894841775 * oka - 1.291485548 * okb;

    var l3 = l_ * l_ * l_;
    var m3 = m_ * m_ * m_;
    var s3 = s_ * s_ * s_;

    var r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    var g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    var b = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

    return {
      r: Math.round(Math.max(0, Math.min(1, linearToSrgb(r))) * 255),
      g: Math.round(Math.max(0, Math.min(1, linearToSrgb(g))) * 255),
      b: Math.round(Math.max(0, Math.min(1, linearToSrgb(b))) * 255),
    };
  }

  function parseColorToRgb(input) {
    var hsl = parseHsl(input);
    if (hsl) {
      return hslToRgb(hsl);
    }
    var oklch = parseOklch(input);
    if (oklch) {
      return oklchToRgb(oklch);
    }
    return null;
  }

  function rgbDistance(a, b) {
    if (!a || !b) {
      return Number.POSITIVE_INFINITY;
    }
    var dr = a.r - b.r;
    var dg = a.g - b.g;
    var db = a.b - b.b;
    return dr * dr + dg * dg + db * db;
  }

  function findClosestStep(scale, sourceHex, tokenPrefix) {
    var sourceRgb = hexToRgb(sourceHex);
    if (!sourceRgb) {
      return null;
    }
    var closest = null;
    for (var i = 1; i <= 12; i += 1) {
      var tokenName = tokenPrefix + i;
      var rgb = parseColorToRgb(scale[tokenName]);
      var distance = rgbDistance(sourceRgb, rgb);
      if (!closest || distance < closest.distance) {
        closest = { step: i, distance: distance };
      }
    }
    return closest;
  }

  function createSwatch(tokenName, value, options) {
    var opts = options || {};
    var swatch = document.createElement("div");
    swatch.className = "color-swatch";
    if (opts.isPrimary) {
      swatch.classList.add("color-swatch--primary");
    }

    var visual = document.createElement("div");
    visual.className = "color-swatch__visual";
    visual.style.backgroundColor = value;

    var meta = document.createElement("div");
    meta.className = "color-swatch__meta";
    var code = document.createElement("code");
    code.textContent = tokenName;
    meta.appendChild(code);
    if (opts.isPrimary) {
      var badge = document.createElement("span");
      badge.className = "color-swatch__badge";
      badge.textContent = opts.primaryLabel || "Primary";
      meta.appendChild(badge);
    }

    swatch.appendChild(visual);
    swatch.appendChild(meta);
    return swatch;
  }

  function buildYearCard(entry, actions, mode, isSwedish) {
    var scale = actions.getScaleForEntry(entry, mode);
    if (!scale) {
      return null;
    }
    var secondaryScale = actions.getSecondaryScaleForEntry(entry, mode);
    var roles =
      typeof actions.getResolvedRolesForEntry === "function"
        ? actions.getResolvedRolesForEntry(entry, mode)
        : null;
    var closestPrimary = findClosestStep(scale, entry.primary_hex, "--coty-");
    var closestSecondary = secondaryScale
      ? findClosestStep(
          secondaryScale,
          entry.secondary_hex,
          "--coty-secondary-"
        )
      : null;

    var card = document.createElement("article");
    card.className = "pantone-year-card";

    var header = document.createElement("div");
    header.className = "pantone-year-card__header";

    var title = document.createElement("h5");
    title.className = "type-headline-small";
    title.textContent = entry.year + " — " + entry.name;

    var meta = document.createElement("p");
    meta.className = "pantone-year-card__meta";
    var hexText = entry.primary_hex;
    if (entry.secondary_hex) {
      hexText += " + " + entry.secondary_hex;
    }
    var roleMeta = "";
    if (roles) {
      var modeLabel =
        roles.requestedMode === "auto"
          ? isSwedish
            ? "auto"
            : "auto"
          : roles.requestedMode;
      var resultLabel = roles.mode;
      roleMeta =
        " · mode: " +
        modeLabel +
        " -> " +
        resultLabel +
        " · anchor: --coty-" +
        roles.anchor;
    }
    meta.textContent =
      hexText + " · " + (entry.tone_mode === "duo" ? "duo" : "mono") + roleMeta;

    header.appendChild(title);
    header.appendChild(meta);
    card.appendChild(header);

    var sourceLabel = document.createElement("p");
    sourceLabel.className = "pantone-year-card__label";
    sourceLabel.textContent = isSwedish ? "Pantone source" : "Pantone source";
    card.appendChild(sourceLabel);

    var sourceGrid = document.createElement("div");
    sourceGrid.className = "color-grid";
    sourceGrid.appendChild(
      createSwatch("--pantone-primary-source", entry.primary_hex, {
        isPrimary: true,
        primaryLabel:
          isSwedish && closestPrimary
            ? "Närmast --coty-" + closestPrimary.step
            : closestPrimary
            ? "Closest --coty-" + closestPrimary.step
            : "Primary source",
      })
    );
    if (entry.secondary_hex) {
      sourceGrid.appendChild(
        createSwatch("--pantone-secondary-source", entry.secondary_hex, {
          isPrimary: true,
          primaryLabel:
            isSwedish && closestSecondary
              ? "Närmast --coty-secondary-" + closestSecondary.step
              : closestSecondary
              ? "Closest --coty-secondary-" + closestSecondary.step
              : "Secondary source",
        })
      );
    }
    card.appendChild(sourceGrid);

    var primaryLabel = document.createElement("p");
    primaryLabel.className = "pantone-year-card__label";
    primaryLabel.textContent = isSwedish ? "Primär skala" : "Primary scale";
    card.appendChild(primaryLabel);

    var primaryGrid = document.createElement("div");
    primaryGrid.className = "color-grid";
    for (var i = 1; i <= 12; i += 1) {
      primaryGrid.appendChild(
        createSwatch("--coty-" + i, scale["--coty-" + i], {
          isPrimary: Boolean(closestPrimary && i === closestPrimary.step),
          primaryLabel: isSwedish ? "Närmast source" : "Closest source",
        })
      );
    }
    card.appendChild(primaryGrid);

    if (secondaryScale) {
      var secondaryLabel = document.createElement("p");
      secondaryLabel.className = "pantone-year-card__label";
      secondaryLabel.textContent = isSwedish
        ? "Sekundär skala"
        : "Secondary scale";
      card.appendChild(secondaryLabel);

      var secondaryGrid = document.createElement("div");
      secondaryGrid.className = "color-grid";
      for (var j = 1; j <= 12; j += 1) {
        secondaryGrid.appendChild(
          createSwatch(
            "--coty-secondary-" + j,
            secondaryScale["--coty-secondary-" + j],
            {
              isPrimary: Boolean(
                closestSecondary && j === closestSecondary.step
              ),
              primaryLabel: isSwedish ? "Närmast source" : "Closest source",
            }
          )
        );
      }
      card.appendChild(secondaryGrid);
    }

    return card;
  }

  function renderPantoneCards() {
    if (!host) {
      return;
    }
    if (
      !actions ||
      typeof actions.getEntries !== "function" ||
      typeof actions.getScaleForEntry !== "function"
    ) {
      return;
    }
    if (!entries || !entries.length) {
      return;
    }

    var mode =
      document.documentElement.getAttribute("data-mode") === "dark"
        ? "dark"
        : "light";
    var isSwedish = document.documentElement.lang === "sv";

    var fragment = document.createDocumentFragment();
    entries.forEach(function (entry) {
      var card = buildYearCard(entry, actions, mode, isSwedish);
      if (card) {
        fragment.appendChild(card);
      }
    });

    host.innerHTML = "";
    host.appendChild(fragment);
  }

  document.addEventListener("DOMContentLoaded", function () {
    host = document.querySelector('[data-js="ui-library-pantone-scales"]');
    if (!host) {
      return;
    }

    actions = window.CotyScaleActions;
    if (
      !actions ||
      typeof actions.getEntries !== "function" ||
      typeof actions.getScaleForEntry !== "function"
    ) {
      return;
    }

    entries = actions.getEntries();
    if (!entries || !entries.length) {
      return;
    }

    renderPantoneCards();

    window.addEventListener("theme:mode-changed", function () {
      renderPantoneCards();
    });
  });
})();
