(function () {
  function init() {
    const root = document.querySelector('[data-js="palette-generator-root"]');
    if (!root) {
      return;
    }

    const baselineNode = root.querySelector(
      '[data-js="palette-baseline-json"]'
    );
    const presetsNode = root.querySelector('[data-js="palette-presets-json"]');
    if (!baselineNode || !presetsNode) {
      return;
    }

    let baseline;
    let presets;
    try {
      baseline = JSON.parse(baselineNode.textContent || "{}");
      presets = JSON.parse(presetsNode.textContent || "{}");
      // Some Hugo pipelines may emit JSON script content as a quoted JSON string.
      if (typeof baseline === "string") {
        baseline = JSON.parse(baseline);
      }
      if (typeof presets === "string") {
        presets = JSON.parse(presets);
      }
    } catch {
      return;
    }

    const familyOptionsPalette = [
      "gray",
      "iris",
      "green",
      "amber",
      "cloud",
      "teal",
      "blue",
      "purple",
      "orange",
      "red",
    ];
    const familyOptionsPantone = [
      "gray",
      "iris",
      "green",
      "amber",
      "cloud",
      "coty",
      "teal",
      "blue",
      "purple",
      "orange",
      "red",
    ];
    const roleSelects = {
      text: root.querySelector('select[data-role="text"]'),
      surface: root.querySelector('select[data-role="surface"]'),
      border: root.querySelector('select[data-role="border"]'),
      primary: root.querySelector('select[data-role="primary"]'),
      secondary: root.querySelector('select[data-role="secondary"]'),
    };

    const tabsRoot = root.querySelector('[data-js="palette-generator-tabs"]');
    const tabButtons = tabsRoot
      ? Array.from(tabsRoot.querySelectorAll(".tab-button[data-tab]"))
      : [];
    const tabPanels = Array.from(
      root.querySelectorAll(".tab-panel[data-panel]")
    );
    const presetSelect = root.querySelector('[data-js="palette-preset"]');
    const toneModeToggle = root.querySelector('[data-js="tone-mode-toggle"]');
    const surfaceProfileInputs = Array.from(
      root.querySelectorAll('input[data-js="policy-surface-profile"]')
    );
    const surfaceDerivedToggle = root.querySelector(
      '[data-js="surface-derived-toggle"]'
    );
    const cotyResetYearButton = root.querySelector(
      '[data-js="coty-reset-year"]'
    );
    const cotyResetAllButton = root.querySelector('[data-js="coty-reset-all"]');
    const resetButton = root.querySelector('[data-js="palette-reset"]');
    const saveButton = root.querySelector('[data-js="palette-save"]');
    const cotyApplyDraftButton = root.querySelector(
      '[data-js="coty-apply-draft"]'
    );
    const copyButton = root.querySelector('[data-js="palette-copy"]');
    const footerHint = root.querySelector(
      '[data-js="palette-generator-footer-hint"]'
    );
    const exportArea = root.querySelector('[data-js="palette-export"]');
    const exportCode = root.querySelector('[data-js="palette-export-code"]');
    const toastSavedLabel =
      root.getAttribute("data-toast-palette-saved") || "Palette saved";
    const customPaletteLabel =
      root.getAttribute("data-palette-custom-label") || "Custom palette";

    const appliedTokens = new Set();
    const currentTokenValues = {};
    const CUSTOM_PALETTE_KEY = "theme-custom-palette";
    // The Pantone/COTY Lab sub-app lives in palette-coty-lab.js (loaded before
    // this file on the generator page). It gets the shared root plus the two
    // builder bridges — the active-tab query and the full re-render — and
    // returns its public surface. Null when the module is absent; every call
    // site below guards on it. currentActiveSource/reapplyGeneratorState are
    // hoisted function declarations, so the references are valid here.
    const cotyLab = window.PaletteCotyLab
      ? window.PaletteCotyLab.create({
          root: root,
          currentActiveSource: currentActiveSource,
          reapplyGeneratorState: reapplyGeneratorState,
        })
      : null;
    let syncingFromThemeEvent = false;
    let activeTab = "palette";

    function isPressed(button) {
      if (!button) {
        return false;
      }
      return button.getAttribute("aria-pressed") === "true";
    }

    function setToggleState(button, active, labels) {
      if (!button) {
        return;
      }
      button.setAttribute("aria-pressed", active ? "true" : "false");
      if (labels) {
        button.textContent = active ? labels.on : labels.off;
      }
    }

    function currentActiveSource() {
      return activeTab === "pantone" ? "pantone" : "palette";
    }

    function setActiveSource(value) {
      activeTab = value === "pantone" ? "pantone" : "palette";
      tabButtons.forEach((button) => {
        const isActive = button.getAttribute("data-tab") === activeTab;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
      });
      tabPanels.forEach((panel) => {
        const isActive = panel.getAttribute("data-panel") === activeTab;
        panel.classList.toggle("is-active", isActive);
      });
      syncRoleFamilyOptionsForActiveSource();
      syncSaveButtonState();
    }

    function syncRoleFamilyOptionsForActiveSource() {
      const options =
        currentActiveSource() === "pantone"
          ? familyOptionsPantone
          : familyOptionsPalette;
      Object.values(roleSelects).forEach((select) => {
        if (!select) {
          return;
        }
        const previousValue = select.value;
        setSelectOptions(select, options);
        if (options.includes(previousValue)) {
          select.value = previousValue;
        }
      });
    }

    function syncSaveButtonState() {
      if (!saveButton) {
        return;
      }
      const isSwedish = document.documentElement.lang === "sv";
      const inPantoneLab = currentActiveSource() === "pantone";
      if (resetButton) {
        resetButton.disabled = inPantoneLab;
        resetButton.setAttribute(
          "aria-disabled",
          inPantoneLab ? "true" : "false"
        );
        resetButton.hidden = inPantoneLab;
        resetButton.style.display = inPantoneLab ? "none" : "";
        resetButton.setAttribute(
          "aria-hidden",
          inPantoneLab ? "true" : "false"
        );
      }
      saveButton.disabled = inPantoneLab;
      saveButton.setAttribute("aria-disabled", inPantoneLab ? "true" : "false");
      saveButton.hidden = inPantoneLab;
      saveButton.style.display = inPantoneLab ? "none" : "";
      saveButton.setAttribute("aria-hidden", inPantoneLab ? "true" : "false");
      if (cotyApplyDraftButton) {
        cotyApplyDraftButton.hidden = !inPantoneLab;
        cotyApplyDraftButton.style.display = inPantoneLab ? "" : "none";
        cotyApplyDraftButton.setAttribute(
          "aria-hidden",
          inPantoneLab ? "false" : "true"
        );
      }
      if (cotyResetYearButton) {
        cotyResetYearButton.hidden = !inPantoneLab;
        cotyResetYearButton.style.display = inPantoneLab ? "" : "none";
        cotyResetYearButton.setAttribute(
          "aria-hidden",
          inPantoneLab ? "false" : "true"
        );
      }
      if (cotyResetAllButton) {
        cotyResetAllButton.hidden = !inPantoneLab;
        cotyResetAllButton.style.display = inPantoneLab ? "" : "none";
        cotyResetAllButton.setAttribute(
          "aria-hidden",
          inPantoneLab ? "false" : "true"
        );
      }
      if (copyButton) {
        copyButton.setAttribute(
          "aria-label",
          inPantoneLab
            ? isSwedish
              ? "Kopiera Pantone-utkast"
              : "Copy Pantone draft"
            : isSwedish
            ? "Kopiera spec"
            : "Copy spec"
        );
      }
      if (footerHint) {
        const paletteHint = footerHint.getAttribute("data-hint-palette") || "";
        const pantoneHint = footerHint.getAttribute("data-hint-pantone") || "";
        footerHint.textContent = inPantoneLab ? pantoneHint : paletteHint;
      }
      saveButton.title = inPantoneLab
        ? isSwedish
          ? "Spara palette gäller bara Palette Builder. Använd Pantone-utkast i Pantone Lab."
          : "Save palette is for Palette Builder only. Use Pantone draft in Pantone Lab."
        : "";
    }

    function currentSurfaceProfile() {
      const selected = surfaceProfileInputs.find((input) => input.checked);
      return selected ? selected.value : "standard";
    }

    function reapplyGeneratorState() {
      if (currentPresetName() === "pantone") {
        // Pantone Lab owns runtime tokens via CotyScaleActions.
        // Clear previously applied Palette Builder tokens so they don't override Pantone.
        clearTokens();
        if (cotyLab) {
          cotyLab.applyDraftForSelectedYear();
        }
        updateExport(currentRoles(), currentPolicies(currentPresetName()));
      } else {
        applyFromRoles(
          currentRoles(),
          currentPresetName(),
          currentPolicies(currentPresetName())
        );
      }
      if (cotyLab) {
        cotyLab.updateSourceStepLabel();
        cotyLab.updateOverrideOptionLabels();
      }
      updateRoleSwatches();
    }

    function updateRoleSwatches() {
      const ROLE_TOKENS = {
        text: "--text-default",
        surface: "--surface-page",
        border: "--border-default",
        primary: "--primary",
        secondary: "--secondary",
      };
      Object.entries(roleSelects).forEach(([role, select]) => {
        if (!select) {
          return;
        }
        const row = select.closest(".palette-generator__row");
        const swatch = row ? row.querySelector("[data-role-swatch]") : null;
        if (!swatch) {
          return;
        }
        const token = ROLE_TOKENS[role];
        swatch.style.background = token ? "var(" + token + ")" : "";
      });
    }

    function tokenVar(token) {
      return "var(--" + token + ")";
    }

    function scaleVar(family, step) {
      return tokenVar(family + "-" + step);
    }

    function setToken(name, value) {
      document.documentElement.style.setProperty(name, value);
      appliedTokens.add(name);
      currentTokenValues[name] = value;
    }

    function clearTokens() {
      appliedTokens.forEach((name) => {
        document.documentElement.style.removeProperty(name);
        delete currentTokenValues[name];
      });
      appliedTokens.clear();
    }

    function resolveSource(source, ctx) {
      if (!source) {
        return "";
      }
      if (source.indexOf(".") > -1) {
        const parts = source.split(".");
        const role = parts[0];
        const key = parts[1];
        if (ctx[role] && ctx[role][key]) {
          return ctx[role][key];
        }
      }
      return tokenVar(source);
    }

    function normalizeOverrideValue(raw, ctx) {
      if (typeof raw !== "string") {
        return String(raw);
      }
      if (raw.indexOf(".") > -1) {
        return resolveSource(raw, ctx);
      }
      if (raw.indexOf("(") > -1) {
        return raw;
      }
      return tokenVar(raw);
    }

    function currentRoles() {
      return {
        text: roleSelects.text.value,
        surface: roleSelects.surface.value,
        border: roleSelects.border.value,
        primary: roleSelects.primary.value,
        secondary: roleSelects.secondary.value,
      };
    }

    function currentToneMode() {
      return isPressed(toneModeToggle) ? "duo" : "mono";
    }

    function loadCustomPalette() {
      try {
        const raw = localStorage.getItem(CUSTOM_PALETTE_KEY);
        if (!raw) {
          return null;
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    }

    function hasCustomPalette() {
      return Boolean(loadCustomPalette());
    }

    function setThemePalette(palette) {
      if (
        window.ThemeActions &&
        typeof window.ThemeActions.setPalette === "function"
      ) {
        window.ThemeActions.setPalette(palette);
        return;
      }
      document.documentElement.setAttribute("data-palette", palette);
      if (window.CotyScaleActions) {
        if (
          palette === "pantone" &&
          typeof window.CotyScaleActions.applyForMode === "function"
        ) {
          window.CotyScaleActions.applyForMode(
            document.documentElement.getAttribute("data-mode") || "light"
          );
        } else if (
          palette !== "pantone" &&
          typeof window.CotyScaleActions.clearRuntime === "function"
        ) {
          window.CotyScaleActions.clearRuntime();
        }
      }
      try {
        localStorage.setItem("theme-palette", palette);
      } catch {
        // Ignore localStorage failures
      }
    }

    function syncCustomPresetOption() {
      if (!presetSelect) {
        return;
      }
      const customExists = hasCustomPalette();
      const existing = presetSelect.querySelector('option[value="custom"]');

      if (customExists && !existing) {
        const customOption = document.createElement("option");
        customOption.value = "custom";
        customOption.textContent = customPaletteLabel;
        presetSelect.appendChild(customOption);
      }

      if (!customExists && existing) {
        const wasSelected = presetSelect.value === "custom";
        existing.remove();
        if (wasSelected) {
          presetSelect.value = presetSelect.options.length
            ? presetSelect.options[0].value
            : "";
        }
      }
    }

    function currentPolicies(presetName) {
      const preset = presets[presetName] || {};
      const presetPolicies = preset.policies || {};
      const isPantone = presetName === "pantone";
      return {
        tone_mode: currentToneMode(),
        surface_profile:
          currentSurfaceProfile() ||
          policyValue(presetPolicies, "surface_profile", "standard"),
        form_policy: isPressed(surfaceDerivedToggle)
          ? "surface-derived"
          : "neutral",
        image_treatment: isPantone ? "pantone-blend" : "none",
      };
    }

    function policyValue(policies, key, fallback) {
      if (!policies || typeof policies[key] === "undefined") {
        return fallback;
      }
      return policies[key];
    }

    function currentPresetName() {
      if (currentActiveSource() === "pantone") {
        return "pantone";
      }
      return presetSelect ? presetSelect.value : "standard";
    }

    function syncSecondaryAvailability() {
      const toneMode = currentToneMode();
      if (!roleSelects.secondary || !roleSelects.primary) {
        return;
      }
      const isDuo = toneMode === "duo";
      roleSelects.secondary.disabled = !isDuo;
      if (!isDuo) {
        roleSelects.secondary.value = roleSelects.primary.value;
      }
    }

    function applyFromRoles(roles, presetName, policyOverrides) {
      const textSteps = baseline.roles.text;
      const surfaceSteps = baseline.roles.surface;
      const borderSteps = baseline.roles.border || {};
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
        border: roles.border || roles.surface,
        primary: roles.primary,
        secondary: toneMode === "duo" ? roles.secondary : roles.primary,
      };

      const ctx = {
        text: {
          default: scaleVar(effectiveRoles.text, textSteps.default_step),
          muted: "",
          inverse: tokenVar(textSteps.inverse_token),
          link: "",
          link_hover: "",
        },
        surface: {
          page: scaleVar(effectiveRoles.surface, surfaceSteps.page_step),
          surface: scaleVar(effectiveRoles.surface, surfaceSteps.surface_step),
          muted_text: scaleVar(
            effectiveRoles.surface,
            surfaceSteps.muted_text_step || 10
          ),
          tag: scaleVar(effectiveRoles.surface, surfaceSteps.tag_step),
          tag_hover: scaleVar(
            effectiveRoles.surface,
            surfaceSteps.tag_hover_step
          ),
          border_subtle: "",
        },
        border: {
          subtle: "",
          default: "",
          strong: "",
        },
        action: {
          base: "",
          on: "",
        },
        primary: {
          base: scaleVar(effectiveRoles.primary, primarySteps.base_step),
          strong: scaleVar(effectiveRoles.primary, primarySteps.strong_step),
          hover: scaleVar(
            effectiveRoles.primary,
            primarySteps.hover_step || primarySteps.strong_step
          ),
          on: tokenVar(primarySteps.on_token),
        },
        secondary: {
          base: scaleVar(effectiveRoles.secondary, secondarySteps.base_step),
          strong: scaleVar(
            effectiveRoles.secondary,
            secondarySteps.strong_step
          ),
        },
      };

      ctx.text.link = textSteps.link_source
        ? resolveSource(textSteps.link_source, ctx)
        : scaleVar(effectiveRoles.text, textSteps.link_step);
      ctx.text.link_hover = textSteps.link_hover_source
        ? resolveSource(textSteps.link_hover_source, ctx)
        : scaleVar(effectiveRoles.text, textSteps.link_hover_step);
      ctx.text.muted =
        "color-mix(in oklch, " +
        tokenVar("gray-11") +
        " 60%, " +
        scaleVar(
          effectiveRoles.surface,
          surfaceSteps.surface_ink_strong_step ||
            surfaceSteps.tag_text_step ||
            11
        ) +
        ")";
      ctx.surface.border_subtle = surfaceSteps.border_subtle_source
        ? resolveSource(surfaceSteps.border_subtle_source, ctx)
        : scaleVar(effectiveRoles.surface, surfaceSteps.border_subtle_step);
      ctx.border.subtle = borderSteps.subtle_source
        ? resolveSource(borderSteps.subtle_source, ctx)
        : scaleVar(effectiveRoles.border, borderSteps.subtle_step || 4);
      ctx.border.default = borderSteps.default_source
        ? resolveSource(borderSteps.default_source, ctx)
        : scaleVar(effectiveRoles.border, borderSteps.default_step || 6);
      ctx.border.strong = borderSteps.strong_source
        ? resolveSource(borderSteps.strong_source, ctx)
        : scaleVar(effectiveRoles.border, borderSteps.strong_step || 8);
      ctx.action.base = ctx.text.default;
      ctx.action.on = ctx.surface.page;
      if (toneMode === "duo") {
        ctx.action.base = ctx.primary.base;
        ctx.action.on = ctx.primary.on;
      }

      const surfaceProfile = policyValue(
        policies,
        "surface_profile",
        "standard"
      );
      const formPolicy = policyValue(policies, "form_policy", "neutral");
      const imageTreatment = policyValue(policies, "image_treatment", "none");
      const derivedPalette =
        window.ThemeDerive &&
        typeof window.ThemeDerive.derivePaletteTokens === "function"
          ? window.ThemeDerive.derivePaletteTokens({
              roles: effectiveRoles,
              policies: {
                tone_mode: toneMode,
                surface_profile: surfaceProfile,
                form_policy: formPolicy,
                image_treatment: imageTreatment,
              },
              component_overrides: componentOverrides,
            })
          : null;

      if (surfaceProfile === "deep") {
        ctx.surface.page = scaleVar(effectiveRoles.surface, 2);
        ctx.surface.surface = scaleVar(effectiveRoles.surface, 4);
        ctx.surface.tag = scaleVar(effectiveRoles.surface, 4);
        ctx.surface.tag_hover = scaleVar(effectiveRoles.surface, 5);
        ctx.surface.border_subtle = scaleVar(effectiveRoles.surface, 5);
      }

      ctx.text.link = ctx.primary.strong;
      ctx.text.link_hover = ctx.primary.hover;

      clearTokens();
      const getDerivedToken = (name) =>
        (derivedPalette && derivedPalette[name]) || "";
      const setDerivedToken = (name, fallbackValue) => {
        setToken(name, getDerivedToken(name) || fallbackValue);
      };

      setDerivedToken("--primary", ctx.primary.base);
      setDerivedToken("--primary-strong", ctx.primary.strong);
      setDerivedToken("--on-primary", ctx.primary.on);
      setDerivedToken("--action", ctx.action.base);
      setDerivedToken("--on-action", ctx.action.on);
      setDerivedToken("--secondary", ctx.secondary.base);
      setDerivedToken("--secondary-strong", ctx.secondary.strong);
      setDerivedToken("--on-secondary", ctx.text.default);

      setDerivedToken(
        "--text-accent",
        resolveSource(textSteps.accent_source, ctx)
      );
      setDerivedToken("--component-toc-active-indicator", ctx.primary.base);

      setDerivedToken("--text-default", ctx.text.default);
      setDerivedToken(
        "--surface-ink-strong",
        scaleVar(
          effectiveRoles.surface,
          surfaceSteps.surface_ink_strong_step ||
            surfaceSteps.tag_text_step ||
            11
        )
      );
      setDerivedToken("--text-muted", ctx.text.muted);
      setDerivedToken("--text-link", ctx.text.link);
      setDerivedToken("--text-link-hover", ctx.text.link_hover);
      setDerivedToken("--text-inverse", ctx.text.inverse);

      setDerivedToken("--surface-page", ctx.surface.page);
      setDerivedToken("--surface-default", ctx.surface.surface);
      const surfaceElevatedValue =
        getDerivedToken("--surface-elevated") ||
        "color-mix(in srgb, var(--surface-page) 88%, white)";
      const surfaceSubtleValue =
        getDerivedToken("--surface-subtle") || surfaceElevatedValue;
      const surfaceDisabledValue =
        getDerivedToken("--surface-disabled") || surfaceSubtleValue;
      const surfaceInverseValue =
        getDerivedToken("--surface-inverse") || ctx.text.default;
      const componentSectionHeadlineBgValue =
        getDerivedToken("--component-section-headline-bg") || ctx.primary.base;
      setToken("--surface-elevated", surfaceElevatedValue);
      setToken("--surface-subtle", surfaceSubtleValue);
      setToken("--surface-disabled", surfaceDisabledValue);
      setToken("--surface-inverse", surfaceInverseValue);
      setToken(
        "--component-section-headline-bg",
        componentSectionHeadlineBgValue
      );
      setToken("--surface-headline", componentSectionHeadlineBgValue);
      const surfaceAccentValue =
        getDerivedToken("--surface-accent") || ctx.surface.tag;
      setToken("--surface-accent", surfaceAccentValue);
      setToken("--surface-tag", surfaceAccentValue);
      setDerivedToken("--surface-tag-hover", ctx.surface.tag_hover);
      setDerivedToken("--border-subtle", ctx.border.subtle);
      setDerivedToken("--border-default", ctx.border.default);
      setDerivedToken("--border-strong", ctx.border.strong);

      setDerivedToken(
        "--state-focus",
        resolveSource(baseline.roles.state.focus_source, ctx)
      );
      setDerivedToken(
        "--state-selected",
        resolveSource(baseline.roles.state.selected_source, ctx)
      );

      const deriveImageTokens =
        window.ThemeDerive && window.ThemeDerive.deriveImageTokens;
      if (typeof deriveImageTokens === "function") {
        const imageTokens = deriveImageTokens({
          roles: effectiveRoles,
          policies: {
            image_treatment: imageTreatment,
          },
          mode: document.documentElement.getAttribute("data-mode") || "light",
        });
        Object.keys(imageTokens).forEach((name) =>
          setToken(name, imageTokens[name])
        );
      } else if (imageTreatment === "pantone-blend") {
        const isDarkMode =
          document.documentElement.getAttribute("data-mode") === "dark";
        const shadowStep = isDarkMode ? 11 : 3;
        const highlightStep = isDarkMode ? 3 : 11;
        setToken("--image-grayscale", "100%");
        setToken("--image-shadow-blend-mode", "multiply");
        setToken("--image-highlight-blend-mode", "screen");
        setToken(
          "--image-shadow-background",
          scaleVar(effectiveRoles.surface, shadowStep)
        );
        setToken("--image-shadow-opacity", isDarkMode ? "0.9" : "0.78");
        setToken("--image-highlight-opacity", isDarkMode ? "0.72" : "0.68");
        setToken("--image-blend-mode", "screen");
        setToken(
          "--image-highlight-background",
          scaleVar(effectiveRoles.surface, highlightStep)
        );
        setToken(
          "--image-background",
          scaleVar(effectiveRoles.surface, highlightStep)
        );
      } else {
        setToken("--image-grayscale", "0%");
        setToken("--image-shadow-blend-mode", "normal");
        setToken("--image-highlight-blend-mode", "normal");
        setToken("--image-shadow-background", "transparent");
        setToken("--image-highlight-background", "transparent");
        setToken("--image-shadow-opacity", "1");
        setToken("--image-highlight-opacity", "1");
        setToken("--image-blend-mode", "normal");
        setToken("--image-background", "transparent");
      }

      const navCtaBgSource =
        componentOverrides.nav_cta_bg_source || "primary.base";
      const navCtaTextSource =
        componentOverrides.nav_cta_text_source || "primary.on";
      setDerivedToken(
        "--component-nav-cta-bg",
        resolveSource(navCtaBgSource, ctx)
      );
      setDerivedToken(
        "--component-nav-cta-text",
        resolveSource(navCtaTextSource, ctx)
      );

      const form = baseline.roles.component.form;
      let formBg = form.bg_source
        ? resolveSource(form.bg_source, ctx)
        : scaleVar(effectiveRoles.surface, form.bg_step);
      let formPlaceholder = form.placeholder_source
        ? resolveSource(form.placeholder_source, ctx)
        : scaleVar(effectiveRoles.surface, form.placeholder_step);
      if (formPolicy === "surface-derived") {
        formBg = scaleVar(effectiveRoles.surface, 3);
        formPlaceholder =
          derivedPalette && derivedPalette["--component-form-placeholder"]
            ? derivedPalette["--component-form-placeholder"]
            : ctx.text.muted;
      }
      if (
        formPolicy !== "surface-derived" &&
        derivedPalette &&
        derivedPalette["--component-form-placeholder"]
      ) {
        formPlaceholder = derivedPalette["--component-form-placeholder"];
      }
      setDerivedToken("--component-form-bg", formBg);
      setToken("--component-form-placeholder", formPlaceholder);

      Object.keys(presetOverrides).forEach((key) => {
        const tokenName = "--" + key.replace(/_/g, "-");
        const tokenValue = normalizeOverrideValue(presetOverrides[key], ctx);
        setToken(tokenName, tokenValue);
      });

      updateExport(roles, {
        tone_mode: toneMode,
        surface_profile: surfaceProfile,
        form_policy: formPolicy,
        image_treatment: imageTreatment,
      });
    }

    // TOML syntax highlighting lives in toml-highlight.js (window.TomlHighlight,
    // loaded before this file on the generator page) — pure helpers, unit-tested
    // there. Falls back to plain text if the module is absent.
    function renderHighlightedToml(source) {
      return window.TomlHighlight
        ? window.TomlHighlight.renderHighlightedToml(source)
        : source;
    }

    function updateExport(roles, policies) {
      const base = [
        "[roles]",
        'text = "' + roles.text + '"',
        'surface = "' + roles.surface + '"',
        'border = "' + (roles.border || roles.surface) + '"',
        'primary = "' + roles.primary + '"',
        'secondary = "' +
          (currentToneMode() === "duo" ? roles.secondary : roles.primary) +
          '"',
        "",
        "[policies]",
        'tone_mode = "' + (policies.tone_mode || currentToneMode()) + '"',
        'surface_profile = "' + (policies.surface_profile || "standard") + '"',
        'form_policy = "' + (policies.form_policy || "neutral") + '"',
        'image_treatment = "' + (policies.image_treatment || "none") + '"',
        "",
        "[overrides]",
        "# add optional token overrides here",
        "",
        "[component_overrides]",
        "# add optional component exceptions here",
      ];

      const cotyPatch = cotyLab ? cotyLab.buildOverrideToml() : "";
      if (cotyPatch) {
        base.push("");
        base.push("# COTY per-year override patch");
        base.push(cotyPatch);
      }

      const out = base.join("\n");
      exportArea.value = out;
      if (exportCode) {
        exportCode.innerHTML = renderHighlightedToml(out);
      }
    }

    function setSelectOptions(select, values) {
      if (!select) {
        return;
      }
      select.innerHTML = "";
      values.forEach((value) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = value;
        select.appendChild(opt);
      });
    }

    function applyPreset(name) {
      const preset = presets[name];
      if (!preset || !preset.roles) {
        return;
      }
      if (cotyLab) {
        cotyLab.updateControlsVisibility();
      }
      const presetPolicies = preset.policies || {};
      const toneMode = policyValue(presetPolicies, "tone_mode", "mono");
      setToggleState(toneModeToggle, toneMode === "duo", {
        on: document.documentElement.lang === "sv" ? "På" : "On",
        off: document.documentElement.lang === "sv" ? "Av" : "Off",
      });
      const surfaceProfile = policyValue(
        presetPolicies,
        "surface_profile",
        "standard"
      );
      surfaceProfileInputs.forEach((input) => {
        input.checked = input.value === surfaceProfile;
      });
      setToggleState(
        surfaceDerivedToggle,
        policyValue(presetPolicies, "form_policy", "neutral") ===
          "surface-derived",
        {
          on: document.documentElement.lang === "sv" ? "På" : "On",
          off: document.documentElement.lang === "sv" ? "Av" : "Off",
        }
      );
      Object.keys(roleSelects).forEach((role) => {
        const el = roleSelects[role];
        if (!el) {
          return;
        }
        if (preset.roles[role]) {
          el.value = preset.roles[role];
          return;
        }
        if (role === "border") {
          el.value = preset.roles.surface || el.value;
        }
      });
      syncSecondaryAvailability();
      if (name === "pantone") {
        clearTokens();
        if (cotyLab) {
          cotyLab.applyDraftForSelectedYear();
        }
      } else {
        applyFromRoles(currentRoles(), name, currentPolicies(name));
      }
      if (cotyLab) {
        cotyLab.updateSourceStepLabel();
        cotyLab.updateOverrideOptionLabels();
      }
    }

    function hydrateFromCustomPalette() {
      const custom = loadCustomPalette();
      if (!custom || !custom.roles) {
        return false;
      }

      const roles = custom.roles;
      const policies = custom.policies || {};

      setToggleState(toneModeToggle, (policies.tone_mode || "mono") === "duo", {
        on: document.documentElement.lang === "sv" ? "På" : "On",
        off: document.documentElement.lang === "sv" ? "Av" : "Off",
      });
      surfaceProfileInputs.forEach((input) => {
        input.checked =
          input.value === (policies.surface_profile || "standard");
      });
      setToggleState(
        surfaceDerivedToggle,
        (policies.form_policy || "neutral") === "surface-derived",
        {
          on: document.documentElement.lang === "sv" ? "På" : "On",
          off: document.documentElement.lang === "sv" ? "Av" : "Off",
        }
      );

      Object.keys(roleSelects).forEach((role) => {
        const el = roleSelects[role];
        if (!el) {
          return;
        }
        if (roles[role]) {
          el.value = roles[role];
          return;
        }
        if (role === "border" && roles.surface) {
          el.value = roles.surface;
        }
      });

      syncSecondaryAvailability();
      reapplyGeneratorState();
      return true;
    }

    Object.entries(roleSelects).forEach(([role, select]) => {
      setSelectOptions(select, familyOptionsPalette);
      select.addEventListener("change", () => {
        if (role === "primary" && currentToneMode() !== "duo") {
          syncSecondaryAvailability();
        }
        reapplyGeneratorState();
      });
    });

    if (toneModeToggle) {
      toneModeToggle.addEventListener("click", () => {
        const next = !isPressed(toneModeToggle);
        setToggleState(toneModeToggle, next, {
          on: document.documentElement.lang === "sv" ? "På" : "On",
          off: document.documentElement.lang === "sv" ? "Av" : "Off",
        });
        syncSecondaryAvailability();
        reapplyGeneratorState();
      });
    }

    surfaceProfileInputs.forEach((input) => {
      input.addEventListener("change", () => {
        reapplyGeneratorState();
      });
    });

    if (surfaceDerivedToggle) {
      surfaceDerivedToggle.addEventListener("click", () => {
        const next = !isPressed(surfaceDerivedToggle);
        setToggleState(surfaceDerivedToggle, next, {
          on: document.documentElement.lang === "sv" ? "På" : "On",
          off: document.documentElement.lang === "sv" ? "Av" : "Off",
        });
        reapplyGeneratorState();
      });
    }

    if (cotyLab) {
      cotyLab.init();
    }

    const presetNames = Object.keys(presets)
      .filter((name) => name !== "pantone")
      .sort();
    presetSelect.innerHTML = "";
    presetNames.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      presetSelect.appendChild(opt);
    });

    const initialActivePalette =
      document.documentElement.getAttribute("data-palette") || "standard";
    presetSelect.value = presetNames.includes(initialActivePalette)
      ? initialActivePalette
      : presetNames[0];
    setActiveSource(initialActivePalette === "pantone" ? "pantone" : "palette");
    syncRoleFamilyOptionsForActiveSource();

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tab = button.getAttribute("data-tab") || "palette";
        setActiveSource(tab);
        if (!syncingFromThemeEvent) {
          if (tab === "pantone") {
            setThemePalette("pantone");
          } else {
            setThemePalette(presetSelect.value);
          }
        }
        reapplyGeneratorState();
      });
    });

    presetSelect.addEventListener("change", () => {
      if (cotyLab) {
        cotyLab.updateControlsVisibility();
      }
      if (currentActiveSource() !== "palette") {
        return;
      }
      if (!syncingFromThemeEvent && currentActiveSource() === "palette") {
        setThemePalette(presetSelect.value);
      }
      if (presetSelect.value === "custom") {
        hydrateFromCustomPalette();
      } else {
        applyPreset(presetSelect.value);
      }
    });

    resetButton.addEventListener("click", () => {
      clearTokens();
      const currentPalette =
        document.documentElement.getAttribute("data-palette") || "standard";
      const fallbackPalette = presetNames.includes(currentPalette)
        ? currentPalette
        : presetNames[0];
      presetSelect.value = fallbackPalette;
      setActiveSource("palette");
      setThemePalette(fallbackPalette);
      applyPreset(fallbackPalette);
    });

    copyButton.addEventListener("click", async () => {
      const text = exportArea.value;
      try {
        await navigator.clipboard.writeText(text);
        copyButton.classList.add("is-copied");
        setTimeout(() => copyButton.classList.remove("is-copied"), 1500);
      } catch {
        exportArea.select();
      }
    });

    if (saveButton) {
      saveButton.addEventListener("click", () => {
        if (currentActiveSource() === "pantone") {
          return;
        }
        const roles = currentRoles();
        const policies = currentPolicies(currentPresetName());
        const existing = loadCustomPalette() || {};
        const derived =
          window.ThemeDerive &&
          typeof window.ThemeDerive.derivePaletteTokens === "function"
            ? window.ThemeDerive.derivePaletteTokens({
                roles: roles,
                policies: policies,
                component_overrides: existing.component_overrides || {},
              })
            : {};
        const derivedPreview =
          window.ThemeDerive &&
          typeof window.ThemeDerive.derivePreview === "function"
            ? window.ThemeDerive.derivePreview({
                roles: roles,
                policies: policies,
                component_overrides: existing.component_overrides || {},
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
            primary:
              (derivedPreview && derivedPreview.primary) ||
              derived["--primary-strong"] ||
              derived["--primary"] ||
              "",
            surface:
              (derivedPreview && derivedPreview.surface) ||
              derived["--surface-page"] ||
              "",
            secondary:
              (derivedPreview && derivedPreview.secondary) ||
              derived["--secondary-strong"] ||
              derived["--secondary"] ||
              "",
            tone_mode:
              (derivedPreview && derivedPreview.toneMode) ||
              policies.tone_mode ||
              "mono",
          },
        };

        try {
          localStorage.setItem(CUSTOM_PALETTE_KEY, JSON.stringify(payload));
          localStorage.setItem("theme-palette", "custom");
        } catch {
          return;
        }

        syncCustomPresetOption();
        presetSelect.value = "custom";
        document.documentElement.setAttribute("data-palette", "custom");

        if (
          window.ThemeActions &&
          typeof window.ThemeActions.refreshCustomPalette === "function"
        ) {
          window.ThemeActions.refreshCustomPalette();
        }
        window.dispatchEvent(new Event("theme:custom-palette-updated"));

        if (window.Toast && typeof window.Toast.show === "function") {
          window.Toast.show(toastSavedLabel, customPaletteLabel, {
            icon: "icon-palette-micro",
          });
        }
      });
    }

    syncCustomPresetOption();
    if (cotyLab) {
      cotyLab.updateControlsVisibility();
    }
    syncSaveButtonState();
    if (
      initialActivePalette === "custom" &&
      currentActiveSource() === "palette"
    ) {
      if (hasCustomPalette()) {
        presetSelect.value = "custom";
      }
      hydrateFromCustomPalette();
    } else if (currentActiveSource() === "pantone") {
      applyPreset("pantone");
    } else {
      applyPreset(presetSelect.value);
    }

    window.addEventListener("theme:palette-changed", (evt) => {
      const palette = evt && evt.detail ? evt.detail.palette : "";
      if (!palette) {
        return;
      }
      syncingFromThemeEvent = true;
      syncCustomPresetOption();
      if (cotyLab) {
        cotyLab.updateControlsVisibility();
      }
      if (palette === "pantone") {
        setActiveSource("pantone");
        applyPreset("pantone");
      } else if (presets[palette] && palette !== "pantone") {
        setActiveSource("palette");
        presetSelect.value = palette;
        applyPreset(palette);
      } else if (palette === "custom") {
        setActiveSource("palette");
        if (presetSelect.querySelector('option[value="custom"]')) {
          presetSelect.value = "custom";
        }
        hydrateFromCustomPalette();
      }
      syncingFromThemeEvent = false;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
