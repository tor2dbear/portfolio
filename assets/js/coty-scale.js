(function() {
  'use strict';

  var STORAGE_KEY = 'theme-coty-year';
  var DUO_OVERRIDE_TOKENS = [
    '--accent-secondary',
    '--accent-secondary-strong',
    '--component-toc-active-indicator',
    '--component-section-headline-bg'
  ];

  var LIGHT_L = [99.6, 98.6, 97, 95.2, 93, 90, 85, 78, 60, 56, 42, 25];
  var DARK_L = [9.6, 11, 14.5, 17.3, 20, 23.7, 30, 41.8, 59.8, 56.1, 77.3, 94.9];
  var LIGHT_S_BASE = [25, 23, 22, 21, 20, 20, 22, 25, 30, 32, 28, 30];
  var DARK_S_BASE = [12, 14, 16, 18, 20, 22, 25, 30, 38, 36, 70, 60];
  var LIGHT_S_WEIGHT = [0.2, 0.2, 0.25, 0.25, 0.3, 0.35, 0.45, 0.55, 0.8, 0.9, 0.75, 0.65];
  var DARK_S_WEIGHT = [0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.75, 0.95, 0.9, 1, 0.9];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  function normalizeHex(hex) {
    if (!hex) return '';
    var value = String(hex).trim().replace('#', '');
    if (value.length === 3) {
      value = value.split('').map(function(ch) { return ch + ch; }).join('');
    }
    if (!/^[0-9a-fA-F]{6}$/.test(value)) return '';
    return '#' + value.toUpperCase();
  }

  function hexToRgb(hex) {
    var normalized = normalizeHex(hex);
    if (!normalized) return null;
    var value = normalized.slice(1);
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  function rgbToHsl(rgb) {
    var r = rgb.r / 255;
    var g = rgb.g / 255;
    var b = rgb.b / 255;

    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h = 0;
    var s = 0;
    var l = (max + min) / 2;

    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }
      h = h / 6;
    }

    return {
      h: Math.round(h * 360),
      s: round(s * 100),
      l: round(l * 100)
    };
  }

  function formatHsl(h, s, l) {
    return 'hsl(' + Math.round(h) + ', ' + round(s) + '%, ' + round(l) + '%)';
  }

  function parseData() {
    var node = document.querySelector('[data-js="coty-data-json"]');
    if (!node) return null;

    try {
      var parsed = JSON.parse(node.textContent || '{}');
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!Array.isArray(parsed.colors)) return null;
      return parsed;
    } catch (_err) {
      return null;
    }
  }

  function normalizedEntries(raw) {
    var grouped = {};

    raw.forEach(function(item) {
      var year = Number(item.year);
      var hex = normalizeHex(item.hex);
      if (!year || !hex) return;

      if (!grouped[year]) grouped[year] = [];
      grouped[year].push({
        name: String(item.name || year),
        hex: hex
      });
    });

    return Object.keys(grouped)
      .map(function(yearKey) {
        var year = Number(yearKey);
        var colors = grouped[year] || [];
        if (!colors.length) return null;

        var primary = colors[0];
        var secondary = colors[1] || null;

        return {
          year: year,
          name: secondary ? (primary.name + ' + ' + secondary.name) : primary.name,
          primary_name: primary.name,
          primary_hex: primary.hex,
          secondary_name: secondary ? secondary.name : '',
          secondary_hex: secondary ? secondary.hex : '',
          tone_mode: secondary ? 'duo' : 'mono',
          hex: primary.hex
        };
      })
      .filter(Boolean)
      .sort(function(a, b) {
        return b.year - a.year;
      });
  }

  function buildScale(entry, mode) {
    var rgb = hexToRgb(entry.primary_hex || entry.hex);
    if (!rgb) return null;

    var baseHsl = rgbToHsl(rgb);
    var hue = baseHsl.h;
    var baseSat = baseHsl.s;
    var satBoost = (baseSat - 30) * 0.25;

    var lSteps = mode === 'dark' ? DARK_L : LIGHT_L;
    var sBase = mode === 'dark' ? DARK_S_BASE : LIGHT_S_BASE;
    var sWeight = mode === 'dark' ? DARK_S_WEIGHT : LIGHT_S_WEIGHT;

    var tokens = {};
    for (var i = 0; i < 12; i += 1) {
      var saturation = clamp(sBase[i] + satBoost * sWeight[i], 6, 95);
      tokens['--coty-' + (i + 1)] = formatHsl(hue, saturation, lSteps[i]);
    }

    return tokens;
  }

  function buildSecondaryScale(entry, mode) {
    if (!entry.secondary_hex) return null;
    var rgb = hexToRgb(entry.secondary_hex);
    if (!rgb) return null;

    var baseHsl = rgbToHsl(rgb);
    var hue = baseHsl.h;
    var baseSat = baseHsl.s;
    var satBoost = (baseSat - 30) * 0.25;

    var lSteps = mode === 'dark' ? DARK_L : LIGHT_L;
    var sBase = mode === 'dark' ? DARK_S_BASE : LIGHT_S_BASE;
    var sWeight = mode === 'dark' ? DARK_S_WEIGHT : LIGHT_S_WEIGHT;

    var tokens = {};
    for (var i = 0; i < 12; i += 1) {
      var saturation = clamp(sBase[i] + satBoost * sWeight[i], 6, 95);
      tokens['--coty-secondary-' + (i + 1)] = formatHsl(hue, saturation, lSteps[i]);
    }

    return tokens;
  }

  function clearDuoOverrides() {
    DUO_OVERRIDE_TOKENS.forEach(function(name) {
      document.documentElement.style.removeProperty(name);
    });
  }

  function getState() {
    var data = parseData();
    var entries = data ? normalizedEntries(data.colors) : [];
    var defaultYear = data && Number(data.meta && data.meta.default_year)
      ? Number(data.meta.default_year)
      : (entries[0] ? entries[0].year : 2026);
    return {
      entries: entries,
      defaultYear: defaultYear
    };
  }

  function getEntry(year) {
    var state = getState();
    var numeric = Number(year);
    var entry = state.entries.find(function(item) { return item.year === numeric; });
    return entry || state.entries.find(function(item) { return item.year === state.defaultYear; }) || null;
  }

  function applyForMode(mode, year) {
    var entry = getEntry(year);
    if (!entry) return null;

    var resolvedMode = mode === 'dark' ? 'dark' : 'light';
    var scale = buildScale(entry, resolvedMode);
    var secondaryScale = buildSecondaryScale(entry, resolvedMode);
    if (!scale) return null;

    Object.keys(scale).forEach(function(name) {
      document.documentElement.style.setProperty(name, scale[name]);
    });
    if (secondaryScale) {
      Object.keys(secondaryScale).forEach(function(name) {
        document.documentElement.style.setProperty(name, secondaryScale[name]);
      });
    } else {
      for (var i = 1; i <= 12; i += 1) {
        document.documentElement.style.removeProperty('--coty-secondary-' + i);
      }
    }

    document.documentElement.setAttribute('data-coty-year', String(entry.year));
    document.documentElement.style.setProperty('--palette-coty-bg', scale['--coty-2']);
    document.documentElement.style.setProperty('--palette-coty-accent', scale['--coty-11']);
    document.documentElement.style.setProperty('--palette-coty-primary', scale['--coty-11']);
    document.documentElement.style.setProperty('--palette-coty-surface', scale['--coty-2']);
    document.documentElement.style.setProperty('--palette-coty-secondary', secondaryScale ? secondaryScale['--coty-secondary-8'] : scale['--coty-8']);
    document.documentElement.style.setProperty('--palette-coty-seg1', '1');
    document.documentElement.style.setProperty('--palette-coty-seg2', '1');
    document.documentElement.style.setProperty('--palette-coty-seg3', secondaryScale ? '1' : '0');

    document.documentElement.style.setProperty('--palette-pantone-bg', scale['--coty-2']);
    document.documentElement.style.setProperty('--palette-pantone-accent', scale['--coty-11']);
    document.documentElement.style.setProperty('--palette-pantone-primary', scale['--coty-11']);
    document.documentElement.style.setProperty('--palette-pantone-surface', scale['--coty-2']);
    document.documentElement.style.setProperty('--palette-pantone-secondary', secondaryScale ? secondaryScale['--coty-secondary-8'] : scale['--coty-8']);
    document.documentElement.style.setProperty('--palette-pantone-seg1', '1');
    document.documentElement.style.setProperty('--palette-pantone-seg2', '1');
    document.documentElement.style.setProperty('--palette-pantone-seg3', secondaryScale ? '1' : '0');

    if (secondaryScale) {
      document.documentElement.style.setProperty('--accent-secondary', secondaryScale['--coty-secondary-4']);
      document.documentElement.style.setProperty('--accent-secondary-strong', secondaryScale['--coty-secondary-8']);
      document.documentElement.style.setProperty('--component-toc-active-indicator', secondaryScale['--coty-secondary-8']);
      document.documentElement.style.setProperty('--component-section-headline-bg', secondaryScale['--coty-secondary-8']);
    } else {
      clearDuoOverrides();
    }

    return entry;
  }

  function getStoredYear() {
    var stored = Number(localStorage.getItem(STORAGE_KEY));
    if (!stored) return null;
    return stored;
  }

  function getCurrentYear() {
    var attr = Number(document.documentElement.getAttribute('data-coty-year'));
    if (attr) return attr;
    var stored = getStoredYear();
    if (stored) return stored;
    return getState().defaultYear;
  }

  function setYear(year, options) {
    var opts = options || {};
    var entry = getEntry(year);
    if (!entry) return null;

    if (!opts.skipStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, String(entry.year));
      } catch (_err) {
        // Ignore storage failure.
      }
    }

    var mode = opts.mode || document.documentElement.getAttribute('data-mode') || 'light';
    return applyForMode(mode, entry.year);
  }

  function init() {
    var year = getCurrentYear();
    var mode = document.documentElement.getAttribute('data-mode') || 'light';
    applyForMode(mode, year);
  }

  window.CotyScaleActions = {
    init: init,
    setYear: setYear,
    getCurrentYear: getCurrentYear,
    getEntry: getEntry,
    getEntries: function() { return getState().entries; },
    getDefaultYear: function() { return getState().defaultYear; },
    applyForMode: function(mode) { return applyForMode(mode, getCurrentYear()); }
  };
})();
