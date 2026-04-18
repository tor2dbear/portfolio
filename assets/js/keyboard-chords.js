/**
 * Keyboard Chords
 * Chord model with 900ms timeout:
 * G
 * M + L/D/S
 * L + E/S
 * P (toggle Pantone)
 * T + E/R/X/T/S
 * E + P/G/B/N/M
 */
(function() {
  'use strict';

  var CHORD_TIMEOUT_MS = 900;
  var prefixKey = null;
  var timeoutId = null;
  var hudEl = null;

  function renderShortcutChips() {
    var targets = document.querySelectorAll('[data-shortcut]');
    targets.forEach(function(el) {
      if (el.getAttribute('data-shortcut-rendered') === 'true') {return;}

      var label = (el.getAttribute('data-shortcut') || '').trim();
      if (!label) {return;}

      var tokens = label.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) {return;}

      el.textContent = '';
      tokens.forEach(function(token) {
        var chip = document.createElement('span');
        chip.className = 'shortcut-key';
        chip.textContent = token;
        el.appendChild(chip);
      });
      el.setAttribute('data-shortcut-rendered', 'true');
    });
  }

  function isTypingTarget(target) {
    if (!target) {return false;}
    var tag = target.tagName ? target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {return true;}
    return Boolean(target.isContentEditable);
  }

  function ensureHud() {
    if (hudEl) {return hudEl;}
    hudEl = document.createElement('div');
    hudEl.className = 'chord-hud';
    hudEl.setAttribute('role', 'status');
    hudEl.setAttribute('aria-live', 'polite');
    hudEl.setAttribute('hidden', '');
    document.body.appendChild(hudEl);
    return hudEl;
  }

  function showHud(prefix) {
    var hud = ensureHud();

    function render(label, keys) {
      hud.textContent = '';

      var labelEl = document.createElement('span');
      labelEl.className = 'chord-hud__label';
      labelEl.textContent = label;
      hud.appendChild(labelEl);

      var keysEl = document.createElement('span');
      keysEl.className = 'chord-hud__keys';
      keys.forEach(function(key) {
        var chip = document.createElement('span');
        chip.className = 'shortcut-key';
        chip.textContent = key;
        keysEl.appendChild(chip);
      });
      hud.appendChild(keysEl);
    }

    if (prefix === 'M') {render('Mode +', ['L', 'D', 'S']);}
    if (prefix === 'L') {render('Language +', ['E', 'S']);}
    if (prefix === 'T') {render('Typography +', ['E', 'R', 'X', 'T', 'S']);}
    if (prefix === 'E') {render('Effects +', ['P', 'G', 'B', 'N', 'M']);}
    hud.removeAttribute('hidden');
  }

  function hideHud() {
    if (!hudEl) {return;}
    hudEl.setAttribute('hidden', '');
  }

  function clearChord() {
    prefixKey = null;
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
    hideHud();
  }

  function armChord(prefix) {
    prefixKey = prefix;
    showHud(prefix);
    if (timeoutId) {window.clearTimeout(timeoutId);}
    timeoutId = window.setTimeout(clearChord, CHORD_TIMEOUT_MS);
  }

  function getThemeActions() {
    return window.ThemeActions || null;
  }

  function getGridActions() {
    return window.GridOverlayActions || null;
  }

  function getLanguageActions() {
    return window.LanguageActions || null;
  }

  function setTypographyByIndex(index) {
    var actions = getThemeActions();
    if (!actions || typeof actions.setTypography !== 'function' || typeof actions.getTypographyOrder !== 'function') {
      return;
    }
    var order = actions.getTypographyOrder();
    var value = order[index];
    if (value) {actions.setTypography(value);}
  }

  function toggleEffectByKey(key) {
    var actions = getThemeActions();
    var grid = getGridActions();

    if (key === 'P' && actions && typeof actions.togglePantone === 'function') {
      actions.togglePantone();
      return true;
    }

    if (key === 'G' && grid && typeof grid.toggle === 'function') {
      grid.toggle();
      return true;
    }

    if (key === 'B' && actions && typeof actions.toggleBlend === 'function') {
      actions.toggleBlend();
      return true;
    }

    if (key === 'N' && actions && typeof actions.toggleGrain === 'function') {
      actions.toggleGrain();
      return true;
    }

    if (
      key === 'M' &&
      actions &&
      typeof actions.toggleReducedMotion === 'function'
    ) {
      actions.toggleReducedMotion();
      return true;
    }

    return false;
  }

  function handlePrimaryKey(key) {
    if (key === 'G') {
      var grid = getGridActions();
      if (grid && typeof grid.toggle === 'function') {
        grid.toggle();
      }
      return true;
    }
    if (key === 'P') {
      var actions = getThemeActions();
      if (actions && typeof actions.togglePantone === 'function') {
        actions.togglePantone();
      }
      return true;
    }
    if (key === 'M' || key === 'L' || key === 'T' || key === 'E') {
      armChord(key);
      return true;
    }
    return false;
  }

  function handleChordKey(key) {
    var theme = getThemeActions();
    var language = getLanguageActions();

    if (prefixKey === 'M' && theme && typeof theme.setMode === 'function') {
      if (key === 'L') {theme.setMode('light');}
      if (key === 'D') {theme.setMode('dark');}
      if (key === 'S') {theme.setMode('system');}
      clearChord();
      return true;
    }

    if (prefixKey === 'L' && language && typeof language.setLanguage === 'function') {
      if (key === 'E') {language.setLanguage('en');}
      if (key === 'S') {language.setLanguage('sv');}
      clearChord();
      return true;
    }

    if (prefixKey === 'T') {
      if (key === 'E') {setTypographyByIndex(0);}
      if (key === 'R') {setTypographyByIndex(1);}
      if (key === 'X') {setTypographyByIndex(2);}
      if (key === 'T') {setTypographyByIndex(3);}
      if (key === 'S') {setTypographyByIndex(4);}
      clearChord();
      return true;
    }

    if (prefixKey === 'E') {
      toggleEffectByKey(key);
      clearChord();
      return true;
    }

    clearChord();
    return false;
  }

  function toChordKey(e) {
    if (!e || !e.key) {return '';}
    if (e.key.length !== 1) {return '';}
    return e.key.toUpperCase();
  }

  function handleKeydown(e) {
    if (e.defaultPrevented) {return;}
    if (e.repeat) {return;}
    if (isTypingTarget(e.target)) {return;}

    if (e.key === 'Escape') {
      if (prefixKey) {
        e.preventDefault();
        clearChord();
      }
      return;
    }

    if (e.metaKey || e.ctrlKey || e.altKey) {return;}

    var key = toChordKey(e);
    if (!key) {return;}

    if (!prefixKey) {
      if (handlePrimaryKey(key)) {e.preventDefault();}
      return;
    }

    if (handleChordKey(key)) {e.preventDefault();}
  }

  function init() {
    renderShortcutChips();
    document.addEventListener('keydown', handleKeydown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
