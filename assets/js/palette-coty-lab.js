/**
 * Pantone/COTY Lab — the per-year override workbench on /palette-generator/.
 *
 * The second sub-app of the generator page: per-year override drafts (edit,
 * persist to localStorage, apply, reset), the override control rendering, and
 * the TOML patch for the export panel. Extracted from palette-generator.js,
 * where it shared a 2200-line init closure with the Palette Builder.
 *
 * The implicit closure-sharing is now an explicit contract:
 * window.PaletteCotyLab.create(ctx) takes the generator context —
 * { root, currentActiveSource, reapplyGeneratorState } — and returns the lab's
 * public surface (init, applyDraftForSelectedYear, updateSourceStepLabel,
 * updateOverrideOptionLabels, updateControlsVisibility, buildOverrideToml).
 * Token application is delegated to window.CotyScaleActions /
 * window.ThemeActions; the lab never touches the builder's token machinery.
 * init() wires the lab's own listeners (the apply-draft button and the
 * theme:mode-changed / theme:coty-year-changed handlers). Load BEFORE
 * palette-generator.js on the generator page.
 */

(function () {
  "use strict";

  function create(ctx) {
    var root = ctx.root;
    var currentActiveSource = ctx.currentActiveSource;
    var reapplyGeneratorState = ctx.reapplyGeneratorState;

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
    const cotyApplyDraftButton = root.querySelector(
      '[data-js="coty-apply-draft"]'
    );
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
          {
            key: "tritone_shadow_step",
            token: "--tritone-shadow-step",
            kind: "step",
          },
          {
            key: "tritone_mid_step",
            token: "--tritone-mid-step",
            kind: "step",
          },
          {
            key: "tritone_highlight_step",
            token: "--tritone-highlight-step",
            kind: "step",
          },
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

      const cotyActions = window.CotyScaleActions;
      const entry =
        cotyActions && typeof cotyActions.getEntry === "function"
          ? cotyActions.getEntry(currentCotyYear())
          : null;
      const entryConfig = entry ? getEntryYearConfig(entry) : null;
      const modeKey = currentCotyMode();
      const baselineOverrides = entryConfig
        ? modeKey === "dark"
          ? entryConfig.overrides_dark
          : entryConfig.overrides_light
        : {};

      // Determine the "auto" baseline for each field — two complementary paths:
      //   1. TOML baseline (authoritative): getEntry() returns the unmodified TOML
      //      entry, so baselineOverrides reflects what "auto" means regardless of
      //      what the user has drafted. Used when the year's TOML explicitly defines
      //      a default (e.g. surface_default = "--coty-7").
      //   2. Color-probe fallback: for fields without a TOML default, apply the
      //      token as a CSS `color` and read back the fully-resolved computed value.
      //      Works even when the chain passes through role tokens that coty-scale.js
      //      sets as literal oklch strings (not var() references). Only attempted
      //      when select.value === "" (field is at auto, no draft override active —
      //      a draft override would have changed the token, making the probe
      //      misleading).
      //
      //      Fields with kind:"step" (tritone) are excluded from color probing
      //      because their tokens are not CSS custom properties — probing them
      //      would return the inherited text color as a false positive.
      const probe = document.body && document.createElement("span");
      if (probe) {
        probe.style.cssText =
          "position:absolute;left:-9999px;visibility:hidden;pointer-events:none";
        document.body.appendChild(probe);
      }

      function resolveColorOf(varName) {
        if (!probe) {
          return "";
        }
        probe.style.color = "var(" + varName + ")";
        return getComputedStyle(probe).color || "";
      }

      try {
        // Build separate reverse maps for primary and secondary steps so that
        // primary always wins when a token's resolved color matches both scales.
        const primaryColorToStep = {};
        const secondaryColorToStep = {};
        for (let i = 1; i <= 12; i++) {
          const c = resolveColorOf("--coty-" + i);
          if (c && !primaryColorToStep[c]) {
            primaryColorToStep[c] = "--coty-" + i;
          }
          const cs = resolveColorOf("--coty-secondary-" + i);
          if (cs && !secondaryColorToStep[cs]) {
            secondaryColorToStep[cs] = "--coty-secondary-" + i;
          }
        }

        Object.keys(cotyOverrideSelects).forEach((key) => {
          const select = cotyOverrideSelects[key];
          if (!select) {
            return;
          }

          let autoResolvesTo =
            (baselineOverrides && baselineOverrides[key]) || "";
          if (!autoResolvesTo && select.value === "") {
            const field = COTY_OVERRIDE_FIELDS.find((f) => f.key === key);
            if (field && field.kind !== "step") {
              const color = resolveColorOf(field.token);
              autoResolvesTo =
                (color &&
                  (primaryColorToStep[color] || secondaryColorToStep[color])) ||
                "";
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
      } finally {
        if (probe && probe.parentNode) {
          probe.parentNode.removeChild(probe);
        }
      }
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
          if (isAnyEditable) {
            return;
          }
          evt.preventDefault();
          shiftYear(-1);
          return;
        }
        if (evt.key === "ArrowRight") {
          if (isAnyEditable) {
            return;
          }
          evt.preventDefault();
          shiftYear(1);
          return;
        }
        if (evt.key === "Enter" && cotyApplyDraftButton) {
          if (isTextEditable) {
            return;
          }
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

    // One-time bootstrap, called by the builder at the position the inlined
    // init code used to run: render the override controls, wire the year
    // select, and register the lab's own listeners.
    function init() {
      renderCotyOverrideControls();
      initCotyYearControl();

      if (cotyApplyDraftButton) {
        cotyApplyDraftButton.addEventListener("click", () => {
          if (currentActiveSource() !== "pantone") {
            return;
          }
          applyCotyDraftForSelectedYear();
          reapplyGeneratorState();
        });
      }

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

    return {
      init: init,
      applyDraftForSelectedYear: applyCotyDraftForSelectedYear,
      updateSourceStepLabel: updateCotySourceStepLabel,
      updateOverrideOptionLabels: updateCotyOverrideOptionLabels,
      updateControlsVisibility: updateCotyControlsVisibility,
      buildOverrideToml: buildCotyOverrideToml,
    };
  }

  window.PaletteCotyLab = { create: create };
})();
