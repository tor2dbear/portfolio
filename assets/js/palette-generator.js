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
    const cotyYearSelect = root.querySelector('[data-js="coty-year"]');
    const cotyControlsRoot = root.querySelector('[data-js="coty-controls"]');
    const cotyOverrideGroupsRoot = root.querySelector(
      '[data-js="coty-override-groups"]'
    );
    const cotyRoleModeSelect = null;
    const cotyAnchorStepSelect = null;
    const cotySourceStepLabel = root.querySelector(
      '[data-js="coty-source-step"]'
    );
    const cotyResetYearButton = root.querySelector(
      '[data-js="coty-reset-year"]'
    );
    const cotyResetAllButton = root.querySelector('[data-js="coty-reset-all"]');
    const cotyOverrideSelects = {};
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
    const COTY_LAB_DRAFT_KEY_PREFIX = "pantone-lab::";
    const COTY_OVERRIDE_OPTION_VALUES_BASE = [
      "",
      "--coty-1",
      "--coty-2",
      "--coty-3",
      "--coty-4",
      "--coty-5",
      "--coty-6",
      "--coty-7",
      "--coty-8",
      "--coty-9",
      "--coty-10",
      "--coty-11",
      "--coty-12",
    ];
    const COTY_OVERRIDE_OPTION_VALUES_SECONDARY = [
      "--coty-secondary-1",
      "--coty-secondary-2",
      "--coty-secondary-3",
      "--coty-secondary-4",
      "--coty-secondary-5",
      "--coty-secondary-6",
      "--coty-secondary-7",
      "--coty-secondary-8",
      "--coty-secondary-9",
      "--coty-secondary-10",
      "--coty-secondary-11",
      "--coty-secondary-12",
    ];
    const COTY_OVERRIDE_GROUPS = [
      {
        id: "text",
        label: "Text",
        fields: [
          { key: "text_default", token: "--text-default" },
          { key: "text_muted", token: "--text-muted" },
          { key: "text_link", token: "--text-link" },
          { key: "text_link_hover", token: "--text-link-hover" },
          { key: "text_inverse", token: "--text-inverse" },
          { key: "text_accent", token: "--text-accent" },
          { key: "surface_ink_strong", token: "--surface-ink-strong" },
        ],
      },
      {
        id: "surface",
        label: "Surface",
        fields: [
          { key: "surface_page", token: "--surface-page" },
          { key: "surface_default", token: "--surface-default" },
          { key: "surface_elevated", token: "--surface-elevated" },
          { key: "surface_subtle", token: "--surface-subtle" },
          { key: "surface_disabled", token: "--surface-disabled" },
          { key: "surface_inverse", token: "--surface-inverse" },
          {
            key: "surface_accent",
            token: "--surface-accent",
            legacyKeys: ["surface_tag"],
          },
          { key: "image_background", token: "--image-background" },
        ],
      },
      {
        id: "border",
        label: "Border",
        fields: [
          { key: "border_subtle", token: "--border-subtle" },
          { key: "border_default", token: "--border-default" },
          { key: "border_strong", token: "--border-strong" },
        ],
      },
      {
        id: "primary",
        label: "Primary",
        fields: [
          {
            key: "primary",
            token: "--primary",
            legacyKeys: ["accent_primary", "brand_primary"],
          },
          {
            key: "primary_strong",
            token: "--primary-strong",
            legacyKeys: ["accent_primary_strong"],
          },
          {
            key: "on_primary",
            token: "--on-primary",
            legacyKeys: ["brand_on_primary"],
          },
          { key: "action", token: "--action" },
          { key: "on_action", token: "--on-action" },
          { key: "state_focus", token: "--state-focus" },
          { key: "state_selected", token: "--state-selected" },
        ],
      },
      {
        id: "secondary",
        label: "Secondary",
        fields: [
          {
            key: "secondary",
            token: "--secondary",
            legacyKeys: ["accent_secondary"],
          },
          {
            key: "secondary_strong",
            token: "--secondary-strong",
            legacyKeys: ["accent_secondary_strong"],
          },
          {
            key: "on_secondary",
            token: "--on-secondary",
          },
        ],
      },
      {
        id: "tritone",
        label: "Tritone",
        fields: [
          { key: "tritone_shadow_step", token: "--tritone-shadow-step" },
          { key: "tritone_mid_step", token: "--tritone-mid-step" },
          { key: "tritone_highlight_step", token: "--tritone-highlight-step" },
        ],
      },
      {
        id: "components",
        label: "Components",
        fields: [
          { key: "component_form_bg", token: "--component-form-bg" },
          {
            key: "component_form_placeholder",
            token: "--component-form-placeholder",
            hiddenInUi: true,
          },
          {
            key: "component_nav_cta_bg",
            token: "--component-nav-cta-bg",
            hiddenInUi: true,
          },
          {
            key: "component_nav_cta_text",
            token: "--component-nav-cta-text",
            hiddenInUi: true,
          },
          {
            key: "component_toc_active_indicator",
            token: "--component-toc-active-indicator",
            hiddenInUi: true,
          },
          {
            key: "component_section_headline_bg",
            token: "--component-section-headline-bg",
            legacyKeys: ["surface_headline"],
            hiddenInUi: true,
          },
        ],
      },
    ];
    const COTY_OVERRIDE_FIELDS = COTY_OVERRIDE_GROUPS.flatMap(
      (group) => group.fields
    );
    const cotyDraftByYear = {};
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
        applyCotyDraftForSelectedYear();
        updateExport(currentRoles(), currentPolicies(currentPresetName()));
      } else {
        applyFromRoles(
          currentRoles(),
          currentPresetName(),
          currentPolicies(currentPresetName())
        );
      }
      updateCotySourceStepLabel();
      updateCotyOverrideOptionLabels();
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

    function normalizeCotyOverrideValue(value) {
      if (!value) {
        return "";
      }
      return String(value).trim();
    }

    function currentCotyMode() {
      const mode =
        document.documentElement.getAttribute("data-mode") || "light";
      return mode === "dark" ? "dark" : "light";
    }

    function renderCotyOverrideControls() {
      if (!cotyOverrideGroupsRoot) {
        return;
      }
      cotyOverrideGroupsRoot.innerHTML = "";

      COTY_OVERRIDE_GROUPS.forEach((group) => {
        const visibleFields = group.fields.filter((field) => !field.hiddenInUi);
        if (!visibleFields.length) {
          return;
        }
        const section = document.createElement("details");
        section.className = "accordion-nested palette-generator__coty-group";
        section.setAttribute("data-group-id", group.id);
        section.open = true;

        const summary = document.createElement("summary");
        summary.className = "accordion-nested__trigger";

        const heading = document.createElement("h4");
        heading.className =
          "palette-generator__coty-group-title type-body-large";
        heading.textContent = group.label;
        summary.appendChild(heading);
        section.appendChild(summary);

        const grid = document.createElement("div");
        grid.className =
          "accordion-nested__content palette-generator__grid palette-generator__grid--coty-overrides";

        visibleFields.forEach((field) => {
          const row = document.createElement("div");
          row.className = "palette-generator__row";

          const id = "coty-override-" + field.key;

          const label = document.createElement("label");
          label.className = "palette-generator__label";
          label.setAttribute("for", id);
          label.textContent = field.token;

          const select = document.createElement("select");
          select.id = id;
          select.setAttribute("data-js", "coty-override-" + field.key);

          const wrap = document.createElement("div");
          wrap.className = "select-wrap";
          wrap.appendChild(select);

          row.appendChild(label);
          row.appendChild(wrap);
          grid.appendChild(row);

          cotyOverrideSelects[field.key] = select;
        });

        section.appendChild(grid);
        cotyOverrideGroupsRoot.appendChild(section);
      });
    }

    function currentCotyYear() {
      if (!cotyYearSelect) {
        return 0;
      }
      return Number(cotyYearSelect.value) || 0;
    }

    function isCotyEntryDuo(year) {
      const actions = window.CotyScaleActions;
      if (!actions || typeof actions.getEntry !== "function") {
        return false;
      }
      const entry = actions.getEntry(Number(year) || currentCotyYear());
      return Boolean(entry && entry.tone_mode === "duo");
    }

    function cotyOverrideOptionsForYear(year) {
      return isCotyEntryDuo(year)
        ? COTY_OVERRIDE_OPTION_VALUES_BASE.concat(
            COTY_OVERRIDE_OPTION_VALUES_SECONDARY
          )
        : COTY_OVERRIDE_OPTION_VALUES_BASE.slice();
    }

    function syncCotyOverrideUIForYear(year) {
      const optionValues = cotyOverrideOptionsForYear(year);
      const isDuo = isCotyEntryDuo(year);

      const tritoneStepKeys = new Set([
        "tritone_shadow_step",
        "tritone_mid_step",
        "tritone_highlight_step",
      ]);
      Object.keys(cotyOverrideSelects).forEach((key) => {
        const select = cotyOverrideSelects[key];
        if (!select) {
          return;
        }
        const values = tritoneStepKeys.has(key)
          ? isDuo
            ? COTY_OVERRIDE_OPTION_VALUES_BASE.concat(
                COTY_OVERRIDE_OPTION_VALUES_SECONDARY
              )
            : COTY_OVERRIDE_OPTION_VALUES_BASE.slice()
          : optionValues;
        const valueSet = new Set(values);
        const currentValue = select.value || "";
        select.innerHTML = "";
        values.forEach((value) => {
          const opt = document.createElement("option");
          opt.value = value;
          opt.textContent = value || "auto";
          select.appendChild(opt);
        });
        select.value = valueSet.has(currentValue) ? currentValue : "";
      });

      if (!cotyOverrideGroupsRoot) {
        return;
      }
      const secondaryGroups = cotyOverrideGroupsRoot.querySelectorAll(
        '[data-group-id="secondary"]'
      );
      secondaryGroups.forEach((group) => {
        if (isDuo) {
          group.removeAttribute("hidden");
        } else {
          group.setAttribute("hidden", "");
        }
      });
    }

    function updateCotyOverrideOptionLabels() {
      const computedStyle = getComputedStyle(document.documentElement);
      const sourceStep = computedStyle
        .getPropertyValue("--coty-source-step")
        .trim();
      const secondarySourceStep = computedStyle
        .getPropertyValue("--coty-secondary-source-step")
        .trim();
      const isSwedish = document.documentElement.lang === "sv";
      const sourceSuffix = " (source)";
      const secondarySourceSuffix = isSwedish
        ? " (sekundär source)"
        : " (secondary source)";

      // Resolve what "auto" maps to for each field:
      // 1. From the entry's TOML baseline overrides (reliable regardless of current select value)
      // 2. From computed CSS when the select is currently on auto (catches CotyScaleActions defaults)
      const actions = window.CotyScaleActions;
      const entry =
        actions && typeof actions.getEntry === "function"
          ? actions.getEntry(currentCotyYear())
          : null;
      const entryConfig = entry ? getEntryYearConfig(entry) : null;
      const modeKey = currentCotyMode();
      const baselineOverrides = entryConfig
        ? modeKey === "dark"
          ? entryConfig.overrides_dark
          : entryConfig.overrides_light
        : {};

      function resolveToCotyStep(tokenName, depth) {
        if (depth <= 0) return "";
        const raw = computedStyle.getPropertyValue(tokenName).trim();
        // Match var(--coty-N) or var(--coty-secondary-N) as the primary token
        // (with or without a fallback after the comma)
        const cotyMatch = raw.match(
          /^var\(\s*(--coty(?:-secondary)?-\d+)\s*[,)]/
        );
        if (cotyMatch) return cotyMatch[1];
        // Follow any other var() reference; strip fallback — just take the token name
        const varMatch = raw.match(/^var\(\s*(--[a-z0-9-]+)/);
        if (varMatch) return resolveToCotyStep(varMatch[1], depth - 1);
        return "";
      }

      Object.keys(cotyOverrideSelects).forEach((key) => {
        const select = cotyOverrideSelects[key];
        if (!select) {
          return;
        }

        let autoResolvesTo = (baselineOverrides && baselineOverrides[key]) || "";
        if (!autoResolvesTo && select.value === "") {
          const field = COTY_OVERRIDE_FIELDS.find((f) => f.key === key);
          if (field) {
            autoResolvesTo = resolveToCotyStep(field.token, 5);
          }
        }

        Array.from(select.options).forEach((option) => {
          const value = option.value || "";
          if (!value) {
            option.textContent = autoResolvesTo
              ? "auto (→ " + autoResolvesTo + ")"
              : "auto";
            return;
          }
          let label = value;
          if (sourceStep && value === "--coty-" + sourceStep) {
            label += sourceSuffix;
          }
          if (
            secondarySourceStep &&
            value === "--coty-secondary-" + secondarySourceStep
          ) {
            label += secondarySourceSuffix;
          }
          if (autoResolvesTo && value === autoResolvesTo) {
            label += " (= auto)";
          }
          option.textContent = label;
        });
      });
    }

    function getEntryYearConfig(entry) {
      const baseOverrides =
        entry && entry.overrides && typeof entry.overrides === "object"
          ? entry.overrides
          : {};
      const lightOverridesRaw =
        entry &&
        entry.overrides_light &&
        typeof entry.overrides_light === "object"
          ? entry.overrides_light
          : {};
      const darkOverridesRaw =
        entry &&
        entry.overrides_dark &&
        typeof entry.overrides_dark === "object"
          ? entry.overrides_dark
          : {};
      // Backward compatibility: legacy overrides act as light overrides unless explicit mode blocks exist.
      const lightOverrides = Object.keys(lightOverridesRaw).length
        ? lightOverridesRaw
        : baseOverrides;
      const darkOverrides = darkOverridesRaw;
      const getOverride = (source, field) => {
        const keys = [
          field.key,
          field.key.replace(/_/g, "-"),
          field.token,
        ].concat(field.legacyKeys || []);
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          if (typeof source[key] !== "undefined") {
            return normalizeCotyOverrideValue(source[key]);
          }
        }
        return "";
      };
      const buildBucket = (source) =>
        COTY_OVERRIDE_FIELDS.reduce((bucket, field) => {
          const value = getOverride(source, field);
          if (value) {
            bucket[field.key] = value;
          }
          return bucket;
        }, {});
      return {
        role_mode: entry && entry.role_mode ? String(entry.role_mode) : "auto",
        anchor_step:
          entry && entry.anchor_step ? Number(entry.anchor_step) : "",
        overrides_light: buildBucket(lightOverrides),
        overrides_dark: buildBucket(darkOverrides),
      };
    }

    function readCotyControls(currentDraft) {
      const modeKey = currentCotyMode();
      const next = Object.assign(
        {
          role_mode: "auto",
          anchor_step: "",
          overrides_light: {},
          overrides_dark: {},
        },
        currentDraft || {}
      );
      const bucketKey =
        modeKey === "dark" ? "overrides_dark" : "overrides_light";
      const bucket = Object.assign({}, next[bucketKey] || {});
      Object.keys(cotyOverrideSelects).forEach((key) => {
        bucket[key] =
          (cotyOverrideSelects[key] && cotyOverrideSelects[key].value) || "";
      });
      next[bucketKey] = bucket;
      const selectedAnchorStep = cotyAnchorStepSelect
        ? cotyAnchorStepSelect.value
        : next.anchor_step
        ? String(next.anchor_step)
        : "";
      return {
        role_mode:
          (cotyRoleModeSelect && cotyRoleModeSelect.value) ||
          next.role_mode ||
          "auto",
        anchor_step: selectedAnchorStep,
        overrides_light: next.overrides_light || {},
        overrides_dark: next.overrides_dark || {},
      };
    }

    function writeCotyControls(config) {
      const modeKey = currentCotyMode();
      const next = config || {
        role_mode: "auto",
        anchor_step: "",
        overrides_light: {},
        overrides_dark: {},
      };
      const bucket =
        modeKey === "dark"
          ? next.overrides_dark || {}
          : next.overrides_light || {};
      if (cotyRoleModeSelect) {
        cotyRoleModeSelect.value = next.role_mode || "auto";
      }
      if (cotyAnchorStepSelect) {
        cotyAnchorStepSelect.value = next.anchor_step
          ? String(next.anchor_step)
          : "";
      }
      Object.keys(cotyOverrideSelects).forEach((key) => {
        const select = cotyOverrideSelects[key];
        if (!select) {
          return;
        }
        select.value = bucket[key] || "";
      });
    }

    function getCotyDraftForYear(year) {
      const numericYear = Number(year) || 0;
      if (!numericYear) {
        return null;
      }
      if (cotyDraftByYear[numericYear]) {
        return cotyDraftByYear[numericYear];
      }
      const storedDraft = loadCotyDraftFromStorage(numericYear);
      if (storedDraft) {
        cotyDraftByYear[numericYear] = sanitizeCotyDraft(
          storedDraft,
          numericYear
        );
        return cotyDraftByYear[numericYear];
      }
      const actions = window.CotyScaleActions;
      const entry =
        actions && typeof actions.getEntry === "function"
          ? actions.getEntry(numericYear)
          : null;
      const config = getEntryYearConfig(entry);
      cotyDraftByYear[numericYear] = sanitizeCotyDraft(config, numericYear);
      return cotyDraftByYear[numericYear];
    }

    function sanitizeCotyDraft(draft, year) {
      const safe = draft || {
        role_mode: "auto",
        anchor_step: "",
        overrides_light: {},
        overrides_dark: {},
      };
      const mode = String(safe.role_mode || "auto").toLowerCase();
      const normalizedMode =
        mode === "primary" || mode === "surface" ? mode : "auto";
      const anchor = Number(safe.anchor_step || 0);
      const normalizedAnchor = anchor >= 1 && anchor <= 12 ? anchor : "";
      const allowed = new Set(
        cotyOverrideOptionsForYear(Number(year) || currentCotyYear())
      );
      const getOverrideValue = (source, field) => {
        const keys = [field.key].concat(field.legacyKeys || []);
        for (let i = 0; i < keys.length; i += 1) {
          const candidate = keys[i];
          const value = normalizeCotyOverrideValue(source && source[candidate]);
          if (value) {
            return value;
          }
        }
        return "";
      };
      const sanitizeOverrideBucket = (source) => {
        const out = {};
        COTY_OVERRIDE_FIELDS.forEach((field) => {
          const value = getOverrideValue(source, field);
          if (!value) {
            return;
          }
          if (!allowed.has(value)) {
            return;
          }
          out[field.key] = value;
        });
        return out;
      };
      const overridesLight = sanitizeOverrideBucket(safe.overrides_light || {});
      const overridesDark = sanitizeOverrideBucket(safe.overrides_dark || {});
      return {
        role_mode: normalizedMode,
        anchor_step: normalizedAnchor,
        overrides_light: overridesLight,
        overrides_dark: overridesDark,
      };
    }

    function buildEntryOverrideFromDraft(draft) {
      const modeKey = currentCotyMode();
      return {
        mode: modeKey,
        role_mode: draft.role_mode,
        anchor_step: draft.anchor_step,
        overrides_light: draft.overrides_light || {},
        overrides_dark: draft.overrides_dark || {},
      };
    }

    function cotyDraftStorageKey(year) {
      return COTY_LAB_DRAFT_KEY_PREFIX + String(Number(year) || "");
    }

    function loadCotyDraftFromStorage(year) {
      const numericYear = Number(year) || 0;
      if (!numericYear) {
        return null;
      }
      try {
        const raw = localStorage.getItem(cotyDraftStorageKey(numericYear));
        if (!raw) {
          return null;
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
          return null;
        }
        return sanitizeCotyDraft(parsed, numericYear);
      } catch {
        return null;
      }
    }

    function persistCotyDraftForYear(year, draft) {
      const numericYear = Number(year) || 0;
      if (!numericYear) {
        return;
      }
      try {
        localStorage.setItem(
          cotyDraftStorageKey(numericYear),
          JSON.stringify(sanitizeCotyDraft(draft, numericYear))
        );
      } catch {
        // Ignore localStorage failures
      }
    }

    function removeCotyDraftForYear(year) {
      const numericYear = Number(year) || 0;
      if (!numericYear) {
        return;
      }
      try {
        localStorage.removeItem(cotyDraftStorageKey(numericYear));
      } catch {
        // Ignore localStorage failures
      }
    }

    function clearAllCotyDrafts() {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i);
          if (key && key.indexOf(COTY_LAB_DRAFT_KEY_PREFIX) === 0) {
            keys.push(key);
          }
        }
        keys.forEach((key) => localStorage.removeItem(key));
      } catch {
        // Ignore localStorage failures
      }
    }

    function applyCotyDraftForSelectedYear() {
      const year = currentCotyYear();
      if (!year) {
        return;
      }
      const draft = sanitizeCotyDraft(getCotyDraftForYear(year), year);
      const entryOverride = buildEntryOverrideFromDraft(draft);
      if (
        window.ThemeActions &&
        typeof window.ThemeActions.setCotyYear === "function"
      ) {
        window.ThemeActions.setCotyYear(year, {
          entryOverride: entryOverride,
          silent: true,
        });
      } else if (
        window.CotyScaleActions &&
        typeof window.CotyScaleActions.setYear === "function"
      ) {
        window.CotyScaleActions.setYear(year, {
          entryOverride: entryOverride,
          skipStorage: true,
        });
      }
    }

    function updateCotyControlsVisibility() {
      if (!cotyControlsRoot) {
        return;
      }
      cotyControlsRoot.removeAttribute("hidden");
    }

    function updateCotySourceStepLabel() {
      if (!cotySourceStepLabel) {
        return;
      }
      const isSwedish = document.documentElement.lang === "sv";
      const sourceStep = getComputedStyle(document.documentElement)
        .getPropertyValue("--coty-source-step")
        .trim();
      const secondaryStep = getComputedStyle(document.documentElement)
        .getPropertyValue("--coty-secondary-source-step")
        .trim();
      const anchorStep = cotyAnchorStepSelect
        ? (cotyAnchorStepSelect.value || "").trim()
        : "";
      const hasExplicitSource =
        document.documentElement.getAttribute("data-coty-source-explicit") ===
        "true";
      if (!sourceStep) {
        cotySourceStepLabel.textContent = isSwedish
          ? "Source: --coty-?"
          : "Source: --coty-?";
        return;
      }
      const prefix = isSwedish
        ? "Source i skalan: --coty-"
        : "Source in scale: --coty-";
      const duoPart = secondaryStep
        ? " · duo: --coty-secondary-" + secondaryStep
        : "";
      const anchorPart =
        !hasExplicitSource && anchorStep
          ? isSwedish
            ? " · manuell anchor: --coty-" + anchorStep
            : " · manual anchor: --coty-" + anchorStep
          : "";
      cotySourceStepLabel.textContent =
        prefix + sourceStep + duoPart + anchorPart;
    }

    function buildCotyOverrideToml() {
      if (currentActiveSource() !== "pantone") {
        return "";
      }
      const year = currentCotyYear();
      if (!year) {
        return "";
      }
      const actions = window.CotyScaleActions;
      const entry =
        actions && typeof actions.getEntry === "function"
          ? actions.getEntry(year)
          : null;
      if (!entry) {
        return "";
      }
      const draft = sanitizeCotyDraft(getCotyDraftForYear(year), year);

      const lines = [
        "[[colors]]",
        "year = " + year,
        'name = "' + (entry.primary_name || entry.name || "") + '"',
        'hex = "' + (entry.primary_hex || entry.hex || "") + '"',
      ];

      if (draft.role_mode !== "auto") {
        lines.push('role_mode = "' + draft.role_mode + '"');
      }
      if (draft.anchor_step) {
        lines.push("anchor_step = " + draft.anchor_step);
      }

      const overrideLightKeys = COTY_OVERRIDE_FIELDS.map(
        (field) => field.key
      ).filter((key) => draft.overrides_light && draft.overrides_light[key]);
      const overrideDarkKeys = COTY_OVERRIDE_FIELDS.map(
        (field) => field.key
      ).filter((key) => draft.overrides_dark && draft.overrides_dark[key]);

      if (overrideLightKeys.length) {
        lines.push("");
        lines.push("[colors.overrides_light]");
        overrideLightKeys.forEach((key) => {
          lines.push(key + ' = "' + draft.overrides_light[key] + '"');
        });
      }

      if (overrideDarkKeys.length) {
        lines.push("");
        lines.push("[colors.overrides_dark]");
        overrideDarkKeys.forEach((key) => {
          lines.push(key + ' = "' + draft.overrides_dark[key] + '"');
        });
      }
      return lines.join("\n");
    }

    function initCotyYearControl() {
      if (!cotyYearSelect) {
        return;
      }
      const actions = window.CotyScaleActions;
      if (!actions || typeof actions.getEntries !== "function") {
        cotyYearSelect.disabled = true;
        if (cotyControlsRoot) {
          cotyControlsRoot.setAttribute("hidden", "");
        }
        return;
      }

      const entries = actions.getEntries();
      cotyYearSelect.innerHTML = "";
      entries.forEach((entry) => {
        const option = document.createElement("option");
        option.value = String(entry.year);
        option.textContent = String(entry.year) + " \u2014 " + entry.name;
        cotyYearSelect.appendChild(option);
      });

      cotyYearSelect.value = String(actions.getCurrentYear());
      syncCotyOverrideUIForYear(cotyYearSelect.value);
      writeCotyControls(getCotyDraftForYear(cotyYearSelect.value));
      reapplyGeneratorState();
      const applyCurrentYearSelection = () => {
        syncCotyOverrideUIForYear(cotyYearSelect.value);
        writeCotyControls(getCotyDraftForYear(cotyYearSelect.value));
        reapplyGeneratorState();
      };

      cotyYearSelect.addEventListener("change", applyCurrentYearSelection);

      function shiftYear(delta) {
        if (!cotyYearSelect) {
          return;
        }
        const optionValues = Array.from(cotyYearSelect.options).map(
          (option) => option.value
        );
        if (!optionValues.length) {
          return;
        }
        const currentIndex = optionValues.indexOf(cotyYearSelect.value);
        const safeCurrent = currentIndex < 0 ? 0 : currentIndex;
        const nextIndex =
          (safeCurrent + delta + optionValues.length) % optionValues.length;
        cotyYearSelect.value = optionValues[nextIndex];
        applyCurrentYearSelection();
      }

      window.addEventListener("keydown", (evt) => {
        if (currentActiveSource() !== "pantone" || !evt.altKey) {
          return;
        }
        const target = evt.target;
        const tagName = target && target.tagName ? target.tagName : "";
        const isTextEditable =
          (target &&
            target.getAttribute &&
            target.getAttribute("contenteditable") === "true") ||
          tagName === "INPUT" ||
          tagName === "TEXTAREA";
        const isAnyEditable = isTextEditable || tagName === "SELECT";
        if (evt.key === "ArrowLeft") {
          if (isAnyEditable) return;
          evt.preventDefault();
          shiftYear(-1);
          return;
        }
        if (evt.key === "ArrowRight") {
          if (isAnyEditable) return;
          evt.preventDefault();
          shiftYear(1);
          return;
        }
        if (evt.key === "Enter" && cotyApplyDraftButton) {
          if (isTextEditable) return;
          evt.preventDefault();
          cotyApplyDraftButton.click();
        }
      });

      const onCotyControlChange = () => {
        const year = currentCotyYear();
        if (!year) {
          return;
        }
        const currentDraft = getCotyDraftForYear(year);
        cotyDraftByYear[year] = sanitizeCotyDraft(
          readCotyControls(currentDraft),
          year
        );
        persistCotyDraftForYear(year, cotyDraftByYear[year]);
        reapplyGeneratorState();
      };

      Object.keys(cotyOverrideSelects).forEach((key) => {
        const select = cotyOverrideSelects[key];
        if (!select) {
          return;
        }
        select.addEventListener("change", () => {
          onCotyControlChange();
        });
      });

      if (cotyResetYearButton) {
        cotyResetYearButton.addEventListener("click", () => {
          const year = currentCotyYear();
          if (!year) {
            return;
          }
          delete cotyDraftByYear[year];
          removeCotyDraftForYear(year);
          syncCotyOverrideUIForYear(year);
          writeCotyControls(getCotyDraftForYear(year));
          reapplyGeneratorState();
        });
      }

      if (cotyResetAllButton) {
        cotyResetAllButton.addEventListener("click", () => {
          Object.keys(cotyDraftByYear).forEach((key) => {
            delete cotyDraftByYear[key];
          });
          clearAllCotyDrafts();
          const year = currentCotyYear();
          syncCotyOverrideUIForYear(year);
          writeCotyControls(getCotyDraftForYear(year));
          reapplyGeneratorState();
        });
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

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function highlightTomlLine(line) {
      if (!line.trim()) {
        return "";
      }

      if (/^\s*#/.test(line)) {
        return '<span class="toml-comment">' + escapeHtml(line) + "</span>";
      }

      var sectionMatch = line.match(/^\s*\[([^\]]+)\]\s*$/);
      if (sectionMatch) {
        return (
          '<span class="toml-section-bracket">[</span><span class="toml-section">' +
          escapeHtml(sectionMatch[1]) +
          '</span><span class="toml-section-bracket">]</span>'
        );
      }

      var kvMatch = line.match(/^(\s*)([A-Za-z0-9_.-]+)(\s*=\s*)(.*)$/);
      if (kvMatch) {
        var indent = escapeHtml(kvMatch[1] || "");
        var key =
          '<span class="toml-key">' + escapeHtml(kvMatch[2]) + "</span>";
        var eq =
          '<span class="toml-equals">' + escapeHtml(kvMatch[3]) + "</span>";
        var rawValue = kvMatch[4] || "";
        var valueClass = "toml-value";
        if (/^".*"$/.test(rawValue)) {
          valueClass = "toml-string";
        }
        if (/^(true|false)$/.test(rawValue)) {
          valueClass = "toml-bool";
        }
        if (/^-?\d+(\.\d+)?$/.test(rawValue)) {
          valueClass = "toml-number";
        }
        var value =
          '<span class="' +
          valueClass +
          '">' +
          escapeHtml(rawValue) +
          "</span>";
        return indent + key + eq + value;
      }

      return escapeHtml(line);
    }

    function renderHighlightedToml(source) {
      return source.split("\n").map(highlightTomlLine).join("\n");
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

      const cotyPatch = buildCotyOverrideToml();
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
      updateCotyControlsVisibility();
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
        applyCotyDraftForSelectedYear();
      } else {
        applyFromRoles(currentRoles(), name, currentPolicies(name));
      }
      updateCotySourceStepLabel();
      updateCotyOverrideOptionLabels();
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

    renderCotyOverrideControls();
    initCotyYearControl();

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
      updateCotyControlsVisibility();
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

    if (cotyApplyDraftButton) {
      cotyApplyDraftButton.addEventListener("click", () => {
        if (currentActiveSource() !== "pantone") {
          return;
        }
        applyCotyDraftForSelectedYear();
        reapplyGeneratorState();
      });
    }

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
    updateCotyControlsVisibility();
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
      updateCotyControlsVisibility();
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

    window.addEventListener("theme:mode-changed", () => {
      syncCotyOverrideUIForYear(currentCotyYear());
      writeCotyControls(getCotyDraftForYear(currentCotyYear()));
      reapplyGeneratorState();
    });

    window.addEventListener("theme:coty-year-changed", (evt) => {
      const year = evt && evt.detail ? Number(evt.detail.year) : 0;
      if (cotyYearSelect && year) {
        cotyYearSelect.value = String(year);
      }
      syncCotyOverrideUIForYear(cotyYearSelect ? cotyYearSelect.value : year);
      writeCotyControls(
        getCotyDraftForYear(cotyYearSelect ? cotyYearSelect.value : year)
      );
      reapplyGeneratorState();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
