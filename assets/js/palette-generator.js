(function () {
  function init() {
    const root = document.querySelector('[data-js="palette-generator-root"]');
    if (!root) return;

    const baselineNode = root.querySelector('[data-js="palette-baseline-json"]');
    const presetsNode = root.querySelector('[data-js="palette-presets-json"]');
    if (!baselineNode || !presetsNode) return;

    let baseline;
    let presets;
    try {
      baseline = JSON.parse(baselineNode.textContent || '{}');
      presets = JSON.parse(presetsNode.textContent || '{}');
      // Some Hugo pipelines may emit JSON script content as a quoted JSON string.
      if (typeof baseline === 'string') baseline = JSON.parse(baseline);
      if (typeof presets === 'string') presets = JSON.parse(presets);
    } catch (_err) {
      return;
    }

    const familyOptions = ['gray', 'iris', 'green', 'amber', 'cloud', 'teal', 'blue', 'purple', 'orange', 'red'];
    const roleSelects = {
      text: root.querySelector('select[data-role="text"]'),
      surface: root.querySelector('select[data-role="surface"]'),
      primary: root.querySelector('select[data-role="primary"]'),
      secondary: root.querySelector('select[data-role="secondary"]')
    };

    const presetSelect = root.querySelector('[data-js="palette-preset"]');
    const toneModeSelect = root.querySelector('[data-js="tone-mode"]');
    const policySelects = {
      surface_profile: root.querySelector('[data-js="policy-surface-profile"]'),
      form_policy: root.querySelector('[data-js="policy-form-policy"]'),
      image_treatment: root.querySelector('[data-js="policy-image-treatment"]')
    };
    const resetButton = root.querySelector('[data-js="palette-reset"]');
    const saveButton = root.querySelector('[data-js="palette-save"]');
    const copyButton = root.querySelector('[data-js="palette-copy"]');
    const exportArea = root.querySelector('[data-js="palette-export"]');
    const exportCode = root.querySelector('[data-js="palette-export-code"]');
    const toastSavedLabel = root.getAttribute('data-toast-palette-saved') || 'Palette saved';
    const customPaletteLabel = root.getAttribute('data-palette-custom-label') || 'Custom palette';

    const appliedTokens = new Set();
    const currentTokenValues = {};
    const CUSTOM_PALETTE_KEY = 'theme-custom-palette';
    let syncingFromThemeEvent = false;

    function tokenVar(token) {
      return 'var(--' + token + ')';
    }

    function scaleVar(family, step) {
      return tokenVar(family + '-' + step);
    }

    function setToken(name, value) {
      document.documentElement.style.setProperty(name, value);
      appliedTokens.add(name);
      currentTokenValues[name] = value;
    }

    function clearTokens() {
      appliedTokens.forEach(name => {
        document.documentElement.style.removeProperty(name);
        delete currentTokenValues[name];
      });
      appliedTokens.clear();
    }

    function resolveSource(source, ctx) {
      if (!source) return '';
      if (source.indexOf('.') > -1) {
        const parts = source.split('.');
        const role = parts[0];
        const key = parts[1];
        if (ctx[role] && ctx[role][key]) return ctx[role][key];
      }
      return tokenVar(source);
    }

    function normalizeOverrideValue(raw, ctx) {
      if (typeof raw !== 'string') return String(raw);
      if (raw.indexOf('.') > -1) return resolveSource(raw, ctx);
      if (raw.indexOf('(') > -1) return raw;
      return tokenVar(raw);
    }

    function currentRoles() {
      return {
        text: roleSelects.text.value,
        surface: roleSelects.surface.value,
        primary: roleSelects.primary.value,
        secondary: roleSelects.secondary.value
      };
    }

    function currentToneMode() {
      return (toneModeSelect && toneModeSelect.value) || 'mono';
    }

    function loadCustomPalette() {
      try {
        const raw = localStorage.getItem(CUSTOM_PALETTE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return parsed;
      } catch (_err) {
        return null;
      }
    }

    function hasCustomPalette() {
      return Boolean(loadCustomPalette());
    }

    function setThemePalette(palette) {
      if (window.ThemeActions && typeof window.ThemeActions.setPalette === 'function') {
        window.ThemeActions.setPalette(palette);
        return;
      }
      document.documentElement.setAttribute('data-palette', palette);
      try {
        localStorage.setItem('theme-palette', palette);
      } catch (_err) {
        // Ignore localStorage failures
      }
    }

    function syncCustomPresetOption() {
      if (!presetSelect) return;
      const customExists = hasCustomPalette();
      const existing = presetSelect.querySelector('option[value="custom"]');

      if (customExists && !existing) {
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = customPaletteLabel;
        presetSelect.appendChild(customOption);
      }

      if (!customExists && existing) {
        const wasSelected = presetSelect.value === 'custom';
        existing.remove();
        if (wasSelected) {
          presetSelect.value = presetSelect.options.length ? presetSelect.options[0].value : '';
        }
      }
    }

    function currentPolicies(presetName) {
      const preset = presets[presetName] || {};
      const presetPolicies = preset.policies || {};
      return {
        tone_mode: currentToneMode(),
        surface_profile:
          (policySelects.surface_profile && policySelects.surface_profile.value) ||
          policyValue(presetPolicies, 'surface_profile', 'standard'),
        form_policy:
          (policySelects.form_policy && policySelects.form_policy.value) ||
          policyValue(presetPolicies, 'form_policy', 'neutral'),
        image_treatment:
          (policySelects.image_treatment && policySelects.image_treatment.value) ||
          policyValue(presetPolicies, 'image_treatment', 'none')
      };
    }

    function policyValue(policies, key, fallback) {
      if (!policies || typeof policies[key] === 'undefined') return fallback;
      return policies[key];
    }

    function syncSecondaryAvailability() {
      const toneMode = currentToneMode();
      if (!roleSelects.secondary || !roleSelects.primary) return;
      const isDuo = toneMode === 'duo';
      roleSelects.secondary.disabled = !isDuo;
      if (!isDuo) {
        roleSelects.secondary.value = roleSelects.primary.value;
      }
    }

    function applyFromRoles(roles, presetName, policyOverrides) {
      const textSteps = baseline.roles.text;
      const surfaceSteps = baseline.roles.surface;
      const primarySteps = baseline.roles.primary;
      const secondarySteps = baseline.roles.secondary;
      const preset = presets[presetName] || {};
      const presetOverrides = preset.overrides || {};
      const componentOverrides = preset.component_overrides || {};
      const presetPolicies = preset.policies || {};
      const policies = Object.assign({}, presetPolicies, policyOverrides || {});
      const toneMode = policies.tone_mode || currentToneMode();
      const effectiveRoles = {
        text: roles.text,
        surface: roles.surface,
        primary: roles.primary,
        secondary: toneMode === 'duo' ? roles.secondary : roles.primary
      };

      const ctx = {
        text: {
          default: scaleVar(effectiveRoles.text, textSteps.default_step),
          muted: '',
          inverse: tokenVar(textSteps.inverse_token),
          link: '',
          link_hover: ''
        },
        surface: {
          page: scaleVar(effectiveRoles.surface, surfaceSteps.page_step),
          surface: scaleVar(effectiveRoles.surface, surfaceSteps.surface_step),
          muted_text: scaleVar(effectiveRoles.surface, surfaceSteps.muted_text_step || 10),
          tag: scaleVar(effectiveRoles.surface, surfaceSteps.tag_step),
          tag_hover: scaleVar(effectiveRoles.surface, surfaceSteps.tag_hover_step),
          nav: '',
          border_subtle: ''
        },
        primary: {
          base: scaleVar(effectiveRoles.primary, primarySteps.base_step),
          strong: scaleVar(effectiveRoles.primary, primarySteps.strong_step),
          hover: scaleVar(effectiveRoles.primary, primarySteps.hover_step || primarySteps.strong_step),
          on: tokenVar(primarySteps.on_token)
        },
        secondary: {
          base: scaleVar(effectiveRoles.secondary, secondarySteps.base_step),
          strong: scaleVar(effectiveRoles.secondary, secondarySteps.strong_step)
        }
      };

      ctx.text.link =
        textSteps.link_source
          ? resolveSource(textSteps.link_source, ctx)
          : scaleVar(effectiveRoles.text, textSteps.link_step);
      ctx.text.link_hover =
        textSteps.link_hover_source
          ? resolveSource(textSteps.link_hover_source, ctx)
          : scaleVar(effectiveRoles.text, textSteps.link_hover_step);
      ctx.text.muted = 'color-mix(in oklch, ' + tokenVar('gray-11') + ' 60%, ' + scaleVar(effectiveRoles.surface, surfaceSteps.surface_ink_strong_step || surfaceSteps.tag_text_step || 11) + ')';
      ctx.surface.nav =
        surfaceSteps.nav_source
          ? resolveSource(surfaceSteps.nav_source, ctx)
          : scaleVar(effectiveRoles.surface, surfaceSteps.nav_step);
      ctx.surface.border_subtle =
        surfaceSteps.border_subtle_source
          ? resolveSource(surfaceSteps.border_subtle_source, ctx)
          : scaleVar(effectiveRoles.surface, surfaceSteps.border_subtle_step);

      const surfaceProfile = policyValue(policies, 'surface_profile', 'standard');
      const formPolicy = policyValue(policies, 'form_policy', 'neutral');
      const imageTreatment = policyValue(policies, 'image_treatment', 'none');
      const runtimeDerived = window.ThemeDerive && typeof window.ThemeDerive.deriveRuntimeTokens === 'function'
        ? window.ThemeDerive.deriveRuntimeTokens({
            roles: effectiveRoles,
            policies: {
              tone_mode: toneMode,
              form_policy: formPolicy
            }
          })
        : null;

      if (surfaceProfile === 'deep') {
        ctx.surface.page = scaleVar(effectiveRoles.surface, 2);
        ctx.surface.surface = scaleVar(effectiveRoles.surface, 4);
        ctx.surface.tag = scaleVar(effectiveRoles.surface, 4);
        ctx.surface.tag_hover = scaleVar(effectiveRoles.surface, 5);
        ctx.surface.nav = scaleVar(effectiveRoles.surface, 5);
        ctx.surface.border_subtle = scaleVar(effectiveRoles.surface, 5);
      }

      ctx.text.link = ctx.primary.strong;
      ctx.text.link_hover = ctx.primary.hover;

      clearTokens();

      setToken('--accent-primary', ctx.primary.base);
      setToken('--accent-primary-strong', ctx.primary.strong);
      setToken('--accent-secondary', ctx.secondary.base);
      setToken('--accent-secondary-strong', ctx.secondary.strong);

      setToken('--brand-primary', ctx.primary.base);
      setToken('--text-accent', resolveSource(textSteps.accent_source, ctx));
      setToken(
        '--component-toc-active-indicator',
        runtimeDerived && runtimeDerived['--component-toc-active-indicator']
          ? runtimeDerived['--component-toc-active-indicator']
          : toneMode === 'duo'
            ? ctx.secondary.strong
            : ctx.primary.base
      );
      setToken(
        '--component-section-headline-bg',
        runtimeDerived && runtimeDerived['--component-section-headline-bg']
          ? runtimeDerived['--component-section-headline-bg']
          : toneMode === 'duo'
            ? ctx.secondary.strong
            : ctx.primary.base
      );

      setToken('--text-default', ctx.text.default);
      setToken(
        '--text-tag',
        runtimeDerived && runtimeDerived['--text-tag']
          ? runtimeDerived['--text-tag']
          : scaleVar(effectiveRoles.surface, surfaceSteps.tag_text_step || 11)
      );
      setToken(
        '--surface-ink-strong',
        runtimeDerived && runtimeDerived['--surface-ink-strong']
          ? runtimeDerived['--surface-ink-strong']
          : scaleVar(effectiveRoles.surface, surfaceSteps.surface_ink_strong_step || surfaceSteps.tag_text_step || 11)
      );
      setToken(
        '--text-muted',
        runtimeDerived && runtimeDerived['--text-muted']
          ? runtimeDerived['--text-muted']
          : ctx.text.muted
      );
      setToken('--text-link', ctx.text.link);
      setToken('--text-link-hover', ctx.text.link_hover);
      setToken('--text-inverse', ctx.text.inverse);
      setToken('--text-nav', ctx.text.default);

      setToken('--bg-page', ctx.surface.page);
      setToken('--bg-surface', ctx.surface.surface);
      setToken('--bg-tag', ctx.surface.tag);
      setToken('--bg-tag-hover', ctx.surface.tag_hover);
      setToken('--bg-nav', ctx.surface.nav);
      setToken('--border-subtle', ctx.surface.border_subtle);

      setToken('--state-focus', resolveSource(baseline.roles.state.focus_source, ctx));
      setToken('--state-selected', resolveSource(baseline.roles.state.selected_source, ctx));

      if (imageTreatment === 'pantone-blend') {
        setToken('--image-grayscale', '100%');
        setToken('--image-blend-mode', 'screen');
        if (document.documentElement.getAttribute('data-mode') === 'dark') {
          setToken('--image-background', scaleVar(effectiveRoles.surface, 7));
        } else {
          setToken('--image-background', scaleVar(effectiveRoles.surface, 12));
        }
      } else {
        setToken('--image-grayscale', '0%');
        setToken('--image-blend-mode', 'normal');
        setToken('--image-background', 'transparent');
      }

      let navCtaBgSource = baseline.roles.component.nav_cta.bg_source;
      let navCtaTextSource = baseline.roles.component.nav_cta.text_source;
      navCtaBgSource = componentOverrides.nav_cta_bg_source || navCtaBgSource;
      navCtaTextSource = componentOverrides.nav_cta_text_source || navCtaTextSource;
      if (toneMode === 'duo') {
        navCtaBgSource = 'primary.base';
        navCtaTextSource = 'primary.on';
      }
      setToken(
        '--component-nav-cta-bg',
        runtimeDerived && runtimeDerived['--component-nav-cta-bg']
          ? runtimeDerived['--component-nav-cta-bg']
          : resolveSource(navCtaBgSource, ctx)
      );
      setToken(
        '--component-nav-cta-text',
        runtimeDerived && runtimeDerived['--component-nav-cta-text']
          ? runtimeDerived['--component-nav-cta-text']
          : resolveSource(navCtaTextSource, ctx)
      );

      const form = baseline.roles.component.form;
      let formBg = form.bg_source ? resolveSource(form.bg_source, ctx) : scaleVar(effectiveRoles.surface, form.bg_step);
      let formPlaceholder = form.placeholder_source
        ? resolveSource(form.placeholder_source, ctx)
        : scaleVar(effectiveRoles.surface, form.placeholder_step);
      if (formPolicy === 'surface-derived') {
        formBg = scaleVar(effectiveRoles.surface, 3);
        formPlaceholder = runtimeDerived && runtimeDerived['--component-form-placeholder']
          ? runtimeDerived['--component-form-placeholder']
          : ctx.text.muted;
      }
      if (formPolicy !== 'surface-derived' && runtimeDerived && runtimeDerived['--component-form-placeholder']) {
        formPlaceholder = runtimeDerived['--component-form-placeholder'];
      }
      setToken('--component-form-bg', formBg);
      setToken('--component-form-placeholder', formPlaceholder);

      const newsletter = baseline.roles.component.newsletter;
      const newsletterBg = newsletter.bg_source
        ? resolveSource(newsletter.bg_source, ctx)
        : scaleVar(effectiveRoles.surface, newsletter.bg_step);
      const newsletterText = newsletter.text_source
        ? resolveSource(newsletter.text_source, ctx)
        : scaleVar(effectiveRoles.surface, newsletter.text_step);
      const newsletterIllustrationBg = newsletter.illustration_bg_source
        ? resolveSource(newsletter.illustration_bg_source, ctx)
        : scaleVar(effectiveRoles.surface, newsletter.illustration_bg_step);
      const newsletterButtonBg = newsletter.button_bg_source
        ? resolveSource(newsletter.button_bg_source, ctx)
        : scaleVar(effectiveRoles.surface, newsletter.button_bg_step);
      const newsletterButtonText = newsletter.button_text_source
        ? resolveSource(newsletter.button_text_source, ctx)
        : scaleVar(
            effectiveRoles[newsletter.button_text_role || 'primary'],
            newsletter.button_text_step
          );

      setToken('--component-newsletter-bg', newsletterBg);
      setToken('--component-newsletter-text', newsletterText);
      setToken('--component-newsletter-illustration-bg', newsletterIllustrationBg);
      setToken('--component-newsletter-button-bg', newsletterButtonBg);
      setToken('--component-newsletter-button-text', newsletterButtonText);

      Object.keys(presetOverrides).forEach(key => {
        const tokenName = '--' + key.replace(/_/g, '-');
        const tokenValue = normalizeOverrideValue(presetOverrides[key], ctx);
        setToken(tokenName, tokenValue);
      });

      updateExport(roles, {
        tone_mode: toneMode,
        surface_profile: surfaceProfile,
        form_policy: formPolicy,
        image_treatment: imageTreatment
      });
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function highlightTomlLine(line) {
      if (!line.trim()) return '';

      if (/^\s*#/.test(line)) {
        return '<span class="toml-comment">' + escapeHtml(line) + '</span>';
      }

      var sectionMatch = line.match(/^\s*\[([^\]]+)\]\s*$/);
      if (sectionMatch) {
        return '<span class="toml-section-bracket">[</span><span class="toml-section">' +
          escapeHtml(sectionMatch[1]) +
          '</span><span class="toml-section-bracket">]</span>';
      }

      var kvMatch = line.match(/^(\s*)([A-Za-z0-9_.-]+)(\s*=\s*)(.*)$/);
      if (kvMatch) {
        var indent = escapeHtml(kvMatch[1] || '');
        var key = '<span class="toml-key">' + escapeHtml(kvMatch[2]) + '</span>';
        var eq = '<span class="toml-equals">' + escapeHtml(kvMatch[3]) + '</span>';
        var rawValue = kvMatch[4] || '';
        var valueClass = 'toml-value';
        if (/^".*"$/.test(rawValue)) valueClass = 'toml-string';
        if (/^(true|false)$/.test(rawValue)) valueClass = 'toml-bool';
        if (/^-?\d+(\.\d+)?$/.test(rawValue)) valueClass = 'toml-number';
        var value = '<span class="' + valueClass + '">' + escapeHtml(rawValue) + '</span>';
        return indent + key + eq + value;
      }

      return escapeHtml(line);
    }

    function renderHighlightedToml(source) {
      return source
        .split('\n')
        .map(highlightTomlLine)
        .join('\n');
    }

    function updateExport(roles, policies) {
      const out = [
        '[roles]',
        'text = "' + roles.text + '"',
        'surface = "' + roles.surface + '"',
        'primary = "' + roles.primary + '"',
        'secondary = "' + (currentToneMode() === 'duo' ? roles.secondary : roles.primary) + '"',
        '',
        '[policies]',
        'tone_mode = "' + (policies.tone_mode || currentToneMode()) + '"',
        'surface_profile = "' + (policies.surface_profile || 'standard') + '"',
        'form_policy = "' + (policies.form_policy || 'neutral') + '"',
        'image_treatment = "' + (policies.image_treatment || 'none') + '"',
        '',
        '[overrides]',
        '# add optional token overrides here',
        '',
        '[component_overrides]',
        '# add optional component exceptions here'
      ].join('\n');
      exportArea.value = out;
      if (exportCode) exportCode.innerHTML = renderHighlightedToml(out);
    }

    function setSelectOptions(select, values) {
      if (!select) return;
      select.innerHTML = '';
      values.forEach(value => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = value;
        select.appendChild(opt);
      });
    }

    function applyPreset(name) {
      const preset = presets[name];
      if (!preset || !preset.roles) return;
      const presetPolicies = preset.policies || {};
      const toneMode = policyValue(presetPolicies, 'tone_mode', 'mono');
      if (toneModeSelect) toneModeSelect.value = toneMode;
      if (policySelects.surface_profile) {
        policySelects.surface_profile.value = policyValue(presetPolicies, 'surface_profile', 'standard');
      }
      if (policySelects.form_policy) {
        policySelects.form_policy.value = policyValue(presetPolicies, 'form_policy', 'neutral');
      }
      if (policySelects.image_treatment) {
        policySelects.image_treatment.value = policyValue(presetPolicies, 'image_treatment', 'none');
      }
      Object.keys(roleSelects).forEach(role => {
        const el = roleSelects[role];
        if (!el) return;
        el.value = preset.roles[role] || el.value;
      });
      syncSecondaryAvailability();
      applyFromRoles(currentRoles(), name, currentPolicies(name));
    }

    function hydrateFromCustomPalette() {
      const custom = loadCustomPalette();
      if (!custom || !custom.roles) return false;

      const roles = custom.roles;
      const policies = custom.policies || {};

      if (toneModeSelect) toneModeSelect.value = policies.tone_mode || 'mono';

      if (policySelects.surface_profile) {
        policySelects.surface_profile.value = policies.surface_profile || 'standard';
      }
      if (policySelects.form_policy) {
        policySelects.form_policy.value = policies.form_policy || 'neutral';
      }
      if (policySelects.image_treatment) {
        policySelects.image_treatment.value = policies.image_treatment || 'none';
      }

      Object.keys(roleSelects).forEach(role => {
        const el = roleSelects[role];
        if (!el) return;
        if (roles[role]) el.value = roles[role];
      });

      syncSecondaryAvailability();
      applyFromRoles(currentRoles(), presetSelect.value, currentPolicies(presetSelect.value));
      return true;
    }

    Object.entries(roleSelects).forEach(([role, select]) => {
      setSelectOptions(select, familyOptions);
      select.addEventListener('change', () => {
        if (role === 'primary' && currentToneMode() !== 'duo') {
          syncSecondaryAvailability();
        }
        applyFromRoles(currentRoles(), presetSelect.value, currentPolicies(presetSelect.value));
      });
    });

    if (toneModeSelect) {
      toneModeSelect.addEventListener('change', () => {
        syncSecondaryAvailability();
        applyFromRoles(currentRoles(), presetSelect.value, currentPolicies(presetSelect.value));
      });
    }

    Object.values(policySelects).forEach(select => {
      if (!select) return;
      select.addEventListener('change', () => {
        applyFromRoles(currentRoles(), presetSelect.value, currentPolicies(presetSelect.value));
      });
    });

    const presetNames = Object.keys(presets).sort();
    presetSelect.innerHTML = '';
    presetNames.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      presetSelect.appendChild(opt);
    });

    const initialActivePalette = document.documentElement.getAttribute('data-palette') || 'standard';
    presetSelect.value = presets[initialActivePalette] ? initialActivePalette : presetNames[0];

    presetSelect.addEventListener('change', () => {
      if (!syncingFromThemeEvent) {
        setThemePalette(presetSelect.value);
      }
      if (presetSelect.value === 'custom') {
        hydrateFromCustomPalette();
      } else {
        applyPreset(presetSelect.value);
      }
    });

    resetButton.addEventListener('click', () => {
      clearTokens();
      const currentPalette = document.documentElement.getAttribute('data-palette') || 'standard';
      const fallbackPalette = presets[currentPalette] ? currentPalette : presetNames[0];
      presetSelect.value = fallbackPalette;
      applyPreset(fallbackPalette);
    });

    copyButton.addEventListener('click', async () => {
      const text = exportArea.value;
      try {
        await navigator.clipboard.writeText(text);
      } catch (_err) {
        exportArea.select();
      }
    });

    if (saveButton) {
      saveButton.addEventListener('click', () => {
        const roles = currentRoles();
        const policies = currentPolicies(presetSelect.value);
        const existing = loadCustomPalette() || {};
        const derived = window.ThemeDerive && typeof window.ThemeDerive.derivePaletteTokens === 'function'
          ? window.ThemeDerive.derivePaletteTokens({
              roles: roles,
              policies: policies,
              component_overrides: existing.component_overrides || {}
            })
          : {};
        const derivedPreview = window.ThemeDerive && typeof window.ThemeDerive.derivePreview === 'function'
          ? window.ThemeDerive.derivePreview({
              roles: roles,
              policies: policies,
              component_overrides: existing.component_overrides || {}
            })
          : null;

        const payload = {
          version: 2,
          saved_at: new Date().toISOString(),
          roles: roles,
          policies: policies,
          overrides: existing.overrides || {},
          component_overrides: existing.component_overrides || {},
          preview: {
            primary: (derivedPreview && derivedPreview.primary) || derived['--accent-primary-strong'] || derived['--accent-primary'] || '',
            surface: (derivedPreview && derivedPreview.surface) || derived['--bg-page'] || '',
            secondary: (derivedPreview && derivedPreview.secondary) || derived['--accent-secondary-strong'] || derived['--accent-secondary'] || '',
            tone_mode: (derivedPreview && derivedPreview.toneMode) || policies.tone_mode || 'mono'
          }
        };

        try {
          localStorage.setItem(CUSTOM_PALETTE_KEY, JSON.stringify(payload));
          localStorage.setItem('theme-palette', 'custom');
        } catch (_err) {
          return;
        }

        syncCustomPresetOption();
        presetSelect.value = 'custom';
        document.documentElement.setAttribute('data-palette', 'custom');

        if (window.ThemeActions && typeof window.ThemeActions.refreshCustomPalette === 'function') {
          window.ThemeActions.refreshCustomPalette();
        }
        window.dispatchEvent(new Event('theme:custom-palette-updated'));

        if (window.Toast && typeof window.Toast.show === 'function') {
          window.Toast.show(toastSavedLabel, customPaletteLabel, { icon: 'icon-palette-micro' });
        }
      });
    }

    syncCustomPresetOption();
    if (initialActivePalette === 'custom') {
      if (hasCustomPalette()) {
        presetSelect.value = 'custom';
      }
      hydrateFromCustomPalette();
    } else {
      applyPreset(presetSelect.value);
    }

    window.addEventListener('theme:palette-changed', evt => {
      const palette = evt && evt.detail ? evt.detail.palette : '';
      if (!palette) return;
      syncingFromThemeEvent = true;
      syncCustomPresetOption();
      if (presets[palette]) {
        presetSelect.value = palette;
        applyPreset(palette);
      } else if (palette === 'custom') {
        if (presetSelect.querySelector('option[value="custom"]')) {
          presetSelect.value = 'custom';
        }
        hydrateFromCustomPalette();
      }
      syncingFromThemeEvent = false;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
