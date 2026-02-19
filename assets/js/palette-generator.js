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
    const cotyRoleModeSelect = root.querySelector('[data-js="coty-role-mode"]');
    const cotyAnchorStepSelect = root.querySelector(
      '[data-js="coty-anchor-step"]'
    );
    const cotySourceStepLabel = root.querySelector(
      '[data-js="coty-source-step"]'
    );
    const cotyResetYearButton = root.querySelector(
      '[data-js="coty-reset-year"]'
    );
    const cotyResetAllButton = root.querySelector('[data-js="coty-reset-all"]');
    const cotyYearPrevButton = root.querySelector('[data-js="coty-year-prev"]');
    const cotyYearNextButton = root.querySelector('[data-js="coty-year-next"]');
    const cotyYearRandomButton = root.querySelector(
      '[data-js="coty-year-random"]'
    );
    const cotyControlColorValueInput = root.querySelector(
      '[data-js="coty-control-color-value"]'
    );
    const cotyControlColorScopeSelect = root.querySelector(
      '[data-js="coty-control-color-scope"]'
    );
    const cotyControlColorTokenSelect = root.querySelector(
      '[data-js="coty-control-color-token"]'
    );
    const cotyControlColorTokenRow = root.querySelector(
      '[data-js="coty-control-color-token-row"]'
    );
    const cotyControlColorToggleButton = root.querySelector(
      '[data-js="coty-control-color-toggle"]'
    );
    const cotyControlColorResetButton = root.querySelector(
      '[data-js="coty-control-color-reset"]'
    );
    const cotyControlColorCountLabel = root.querySelector(
      '[data-js="coty-control-color-count"]'
    );
    const cotyDiffRoot = root.querySelector('[data-js="coty-diff"]');
    const cotyContrastChecksRoot = root.querySelector(
      '[data-js="coty-contrast-checks"]'
    );
    const cotyTokenUsageRoot = root.querySelector(
      '[data-js="coty-token-usage"]'
    );
    const cotyTokenUsageSelect = root.querySelector(
      '[data-js="coty-token-usage-select"]'
    );
    const cotyTokenUsageList = root.querySelector(
      '[data-js="coty-token-usage-list"]'
    );
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
    const controlColorAppliedTokens = new Set();
    const currentTokenValues = {};
    const CUSTOM_PALETTE_KEY = "theme-custom-palette";
    const COTY_LAB_DRAFT_KEY_PREFIX = "pantone-lab::";
    const COTY_CONTROL_COLOR_KEY = "pantone-lab-control-color";
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
          { key: "text_tag", token: "--text-tag" },
          { key: "text_accent", token: "--text-accent" },
          { key: "surface_ink_strong", token: "--surface-ink-strong" },
        ],
      },
      {
        id: "surface",
        label: "Surface",
        fields: [
          { key: "bg_page", token: "--bg-page" },
          { key: "bg_surface", token: "--bg-surface" },
          { key: "bg_tag", token: "--bg-tag" },
          { key: "bg_tag_hover", token: "--bg-tag-hover" },
          { key: "component_form_bg", token: "--component-form-bg" },
          {
            key: "component_form_placeholder",
            token: "--component-form-placeholder",
          },
          { key: "image_background", token: "--image-background" },
          {
            key: "component_newsletter_bg",
            token: "--component-newsletter-bg",
          },
          {
            key: "component_newsletter_text",
            token: "--component-newsletter-text",
          },
          {
            key: "component_newsletter_illustration_bg",
            token: "--component-newsletter-illustration-bg",
          },
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
          { key: "component_nav_cta_bg", token: "--component-nav-cta-bg" },
          { key: "component_nav_cta_text", token: "--component-nav-cta-text" },
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
            key: "component_toc_active_indicator",
            token: "--component-toc-active-indicator",
          },
          {
            key: "component_section_headline_bg",
            token: "--component-section-headline-bg",
          },
        ],
      },
    ];
    const COTY_OVERRIDE_FIELDS = COTY_OVERRIDE_GROUPS.flatMap(
      (group) => group.fields
    );
    const COTY_TOKEN_USAGE_INDEX = {
      "--text-default": [
        {
          file: "assets/css/style.css",
          selector: "body",
          note: "Global default text color.",
        },
        {
          file: "assets/css/utilities/typography.css",
          selector: "text elements",
          note: "Typographic defaults and prose styles.",
        },
        {
          file: "assets/css/components/theme-dropdown.css",
          selector: ".theme-dropdown",
          note: "Theme menu text rendering.",
        },
      ],
      "--text-muted": [
        {
          file: "assets/css/pages/palette-generator.css",
          selector: ".palette-generator__label",
          note: "Generator labels and helper text.",
        },
        {
          file: "assets/css/style.css",
          selector: ".meta and subdued text",
          note: "Muted metadata and secondary copy.",
        },
      ],
      "--text-link": [
        {
          file: "assets/css/utilities/typography.css",
          selector: "a",
          note: "Base link color.",
        },
      ],
      "--text-link-hover": [
        {
          file: "assets/css/utilities/typography.css",
          selector: "a:hover",
          note: "Link hover color.",
        },
      ],
      "--text-inverse": [
        {
          file: "assets/css/components/button.css",
          selector: ".button--primary",
          note: "Inverse text on strong surfaces.",
        },
      ],
      "--text-tag": [
        {
          file: "assets/css/components/tags.css",
          selector: ".tag-link",
          note: "Tag pill text color.",
        },
      ],
      "--text-accent": [
        {
          file: "assets/css/tokens/legacy.css",
          selector: ":root",
          note: "Legacy alias used by some components.",
        },
      ],
      "--surface-ink-strong": [
        {
          file: "assets/css/tokens/semantic.css",
          selector: ":root",
          note: "Strong ink basis for derived muted text.",
        },
      ],
      "--bg-page": [
        {
          file: "assets/css/style.css",
          selector: "body",
          note: "Global page background.",
        },
        {
          file: "assets/css/components/footer.css",
          selector: ".footer",
          note: "Footer surface and separators.",
        },
        {
          file: "assets/css/pages/palette-generator.css",
          selector: ".palette-generator__export and code blocks",
          note: "Generator preview surfaces.",
        },
      ],
      "--bg-surface": [
        {
          file: "assets/css/pages/palette-generator.css",
          selector: ".palette-generator__panel",
          note: "Generator card/background surfaces.",
        },
        {
          file: "assets/css/components/tabs.css",
          selector: ".tabs-nav",
          note: "Tab container surfaces.",
        },
        {
          file: "assets/css/components/download-card.css",
          selector: ".download-card",
          note: "Content cards and utility surfaces.",
        },
      ],
      "--bg-tag": [
        {
          file: "assets/css/components/tags.css",
          selector: ".tag-link",
          note: "Tag background color.",
        },
      ],
      "--bg-tag-hover": [
        {
          file: "assets/css/components/tags.css",
          selector: ".tag-link:hover",
          note: "Tag hover/active background.",
        },
      ],
      "--border-subtle": [
        {
          file: "assets/css/tokens/semantic.css",
          selector: ":root",
          note: "Default low-contrast borders.",
        },
      ],
      "--border-default": [
        {
          file: "assets/css/components/form.css",
          selector: ".form-input, .form-textarea, .form-select",
          note: "Default control and field borders.",
        },
        {
          file: "assets/css/components/theme-dropdown.css",
          selector: ".theme-dropdown and select controls",
          note: "Default panel/control separators.",
        },
      ],
      "--border-strong": [
        {
          file: "assets/css/components/accordion.css",
          selector: ".accordion*",
          note: "Strong separator and open-state emphasis.",
        },
        {
          file: "assets/css/components/theme-dropdown.css",
          selector: ".theme-dropdown",
          note: "Panel and interactive border contrast.",
        },
      ],
      "--component-form-bg": [
        {
          file: "assets/css/components/form.css",
          selector: ".form-input, .form-textarea, .form-select",
          note: "Input field background.",
        },
      ],
      "--component-form-placeholder": [
        {
          file: "assets/css/components/form.css",
          selector: "::placeholder",
          note: "Placeholder text in form controls.",
        },
      ],
      "--image-background": [
        {
          file: "assets/css/style.css",
          selector: "picture::after, .video-wrapper::after",
          note: "Image treatment overlay background.",
        },
        {
          file: "assets/js/coty-scale.js",
          selector: "runtime token assignment",
          note: "Pantone mode and duo-gradient defaults.",
        },
      ],
      "--component-newsletter-bg": [
        {
          file: "assets/css/components/footer.css",
          selector: ".newsletter",
          note: "Newsletter card background.",
        },
      ],
      "--component-newsletter-text": [
        {
          file: "assets/css/components/footer.css",
          selector: ".newsletter__title and copy",
          note: "Newsletter text color.",
        },
      ],
      "--component-newsletter-illustration-bg": [
        {
          file: "assets/css/components/footer.css",
          selector: ".newsletter__illustration",
          note: "Newsletter illustration block bg.",
        },
      ],
      "--primary": [
        {
          file: "assets/css/tokens/semantic.css",
          selector: ":root",
          note: "Primary accent base used by roles and components.",
        },
      ],
      "--primary-strong": [
        {
          file: "assets/css/components/button.css",
          selector: ".button interactions",
          note: "Primary accent strong/hover states.",
        },
      ],
      "--on-primary": [
        {
          file: "assets/css/components/button.css",
          selector: ".button--primary",
          note: "Text/icon color on primary backgrounds.",
        },
        {
          file: "assets/js/coty-scale.js",
          selector: "runtime selection",
          note: "Set from COTY scale steps, not fixed white/black.",
        },
      ],
      "--secondary": [
        {
          file: "assets/css/tokens/semantic.css",
          selector: ":root",
          note: "Secondary accent role.",
        },
      ],
      "--secondary-strong": [
        {
          file: "assets/css/tokens/semantic.css",
          selector: ":root",
          note: "Secondary accent strong variant.",
        },
      ],
      "--state-focus": [
        {
          file: "assets/css/utilities/typography.css",
          selector: ":focus-visible outlines",
          note: "Focus ring and emphasis states.",
        },
      ],
      "--state-selected": [
        {
          file: "assets/css/pages/palette-generator.css",
          selector: ".palette-generator__contrast-status[data-pass='true']",
          note: "Pass-state indicator color.",
        },
      ],
      "--component-nav-cta-bg": [
        {
          file: "assets/css/components/navigation.css",
          selector: ".menu__cta",
          note: "Header CTA background.",
        },
        {
          file: "assets/js/theme-derive.js",
          selector: "derived token mapping",
          note: "Mapped from role/policy at runtime.",
        },
      ],
      "--component-nav-cta-text": [
        {
          file: "assets/css/components/navigation.css",
          selector: ".menu__cta",
          note: "Header CTA text color.",
        },
        {
          file: "assets/js/theme-derive.js",
          selector: "derived token mapping",
          note: "Mapped from role/policy at runtime.",
        },
      ],
      "--component-toc-active-indicator": [
        {
          file: "assets/css/components/table-of-contents.css",
          selector: ".table-of-contents .active",
          note: "Active ToC indicator.",
        },
      ],
      "--component-section-headline-bg": [
        {
          file: "assets/css/utilities/typography.css",
          selector: ".section-headline",
          note: "Section headline background accent.",
        },
      ],
    };
    const cotyDraftByYear = {};
    const cotyControlColorState = {
      enabled: false,
      color: "#ff4d4d",
      scope: "primary",
      token: "--primary",
    };
    let syncingFromThemeEvent = false;
    let activeTab = "palette";
    let contrastMeasureNode = null;

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
        copyButton.textContent = inPantoneLab
          ? isSwedish
            ? "Kopiera Pantone-utkast"
            : "Copy Pantone draft"
          : isSwedish
          ? "Kopiera spec"
          : "Copy spec";
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

    function uniqueTokenList(tokens) {
      const seen = new Set();
      return tokens.filter((token) => {
        if (!token || seen.has(token)) {
          return false;
        }
        seen.add(token);
        return true;
      });
    }

    function getControlColorTokenGroups() {
      const textGroup = COTY_OVERRIDE_GROUPS.find(
        (group) => group.id === "text"
      );
      const surfaceGroup = COTY_OVERRIDE_GROUPS.find(
        (group) => group.id === "surface"
      );
      const primaryGroup = COTY_OVERRIDE_GROUPS.find(
        (group) => group.id === "primary"
      );
      const secondaryGroup = COTY_OVERRIDE_GROUPS.find(
        (group) => group.id === "secondary"
      );
      const borderGroup = COTY_OVERRIDE_GROUPS.find(
        (group) => group.id === "border"
      );

      const textTokens = textGroup
        ? textGroup.fields.map((field) => field.token)
        : [];
      const surfaceTokens = surfaceGroup
        ? surfaceGroup.fields.map((field) => field.token)
        : [];
      const primaryTokens = primaryGroup
        ? primaryGroup.fields.map((field) => field.token)
        : [];
      const secondaryTokens = secondaryGroup
        ? secondaryGroup.fields.map((field) => field.token)
        : [];
      const borderTokens = borderGroup
        ? borderGroup.fields.map((field) => field.token)
        : [];

      return {
        text: uniqueTokenList(textTokens),
        surface: uniqueTokenList(surfaceTokens),
        border: uniqueTokenList(borderTokens),
        primary: uniqueTokenList(primaryTokens.concat(secondaryTokens)),
      };
    }

    function ensureContrastMeasureNode() {
      if (contrastMeasureNode) {
        return contrastMeasureNode;
      }
      const node = document.createElement("span");
      node.style.position = "absolute";
      node.style.visibility = "hidden";
      node.style.pointerEvents = "none";
      node.style.inset = "-9999px auto auto -9999px";
      node.style.inlineSize = "1px";
      node.style.blockSize = "1px";
      node.style.color = "#000";
      document.body.appendChild(node);
      contrastMeasureNode = node;
      return node;
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function linearToSrgb(value) {
      if (value <= 0.0031308) {
        return 12.92 * value;
      }
      return 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
    }

    function parseRgbComponent(part) {
      const value = String(part || "").trim();
      if (!value) {
        return NaN;
      }
      if (value.endsWith("%")) {
        return (Number(value.slice(0, -1)) / 100) * 255;
      }
      return Number(value);
    }

    function parseRgbColor(value) {
      const raw = String(value || "").trim();
      if (!raw) {
        return null;
      }

      const rgbMatch = raw.match(/^rgba?\(([^)]+)\)$/i);
      if (rgbMatch) {
        const body = rgbMatch[1].trim();
        const colorPart = body.split("/")[0].trim();
        const pieces = colorPart.includes(",")
          ? colorPart.split(",").map((part) => part.trim())
          : colorPart.split(/\s+/).map((part) => part.trim());
        if (pieces.length < 3) {
          return null;
        }
        return {
          r: parseRgbComponent(pieces[0]),
          g: parseRgbComponent(pieces[1]),
          b: parseRgbComponent(pieces[2]),
        };
      }

      const srgbMatch = raw.match(/^color\(\s*srgb\s+([^)]+)\)$/i);
      if (srgbMatch) {
        const colorPart = srgbMatch[1].split("/")[0].trim();
        const pieces = colorPart.split(/\s+/).map((part) => part.trim());
        if (pieces.length < 3) {
          return null;
        }
        const asUnit = pieces.map((part) => {
          if (part.endsWith("%")) {
            return Number(part.slice(0, -1)) / 100;
          }
          return Number(part);
        });
        if (asUnit.some((number) => Number.isNaN(number))) {
          return null;
        }
        return {
          r: asUnit[0] * 255,
          g: asUnit[1] * 255,
          b: asUnit[2] * 255,
        };
      }

      const oklchMatch = raw.match(
        /^oklch\(\s*([0-9.]+)%\s+([0-9.]+)\s+([0-9.]+)(?:deg)?(?:\s*\/\s*[0-9.]+%?)?\s*\)$/i
      );
      if (oklchMatch) {
        const l = Number(oklchMatch[1]) / 100;
        const c = Number(oklchMatch[2]);
        const h = Number(oklchMatch[3]) * (Math.PI / 180);
        if ([l, c, h].some((number) => Number.isNaN(number))) {
          return null;
        }

        const oka = c * Math.cos(h);
        const okb = c * Math.sin(h);

        const l_ = l + 0.3963377774 * oka + 0.2158037573 * okb;
        const m_ = l - 0.1055613458 * oka - 0.0638541728 * okb;
        const s_ = l - 0.0894841775 * oka - 1.291485548 * okb;

        const l3 = l_ * l_ * l_;
        const m3 = m_ * m_ * m_;
        const s3 = s_ * s_ * s_;

        const linearR =
          4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
        const linearG =
          -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
        const linearB =
          -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

        return {
          r: clamp(linearToSrgb(linearR), 0, 1) * 255,
          g: clamp(linearToSrgb(linearG), 0, 1) * 255,
          b: clamp(linearToSrgb(linearB), 0, 1) * 255,
        };
      }

      return null;
    }

    function resolveVarToken(value) {
      const match = String(value || "")
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

    function resolveColorValue(value, styles, depth) {
      const currentDepth = typeof depth === "number" ? depth : 0;
      if (currentDepth > 8) {
        return String(value || "").trim();
      }
      const trimmed = String(value || "").trim();
      if (!trimmed) {
        return "";
      }
      const varToken = resolveVarToken(trimmed);
      if (!varToken) {
        return trimmed;
      }
      const resolved = styles.getPropertyValue(varToken.name).trim();
      if (resolved) {
        return resolveColorValue(resolved, styles, currentDepth + 1);
      }
      if (varToken.fallback) {
        return resolveColorValue(varToken.fallback, styles, currentDepth + 1);
      }
      return "";
    }

    function resolveColorToRgb(value) {
      if (!value) {
        return null;
      }
      const node = ensureContrastMeasureNode();
      const styles = getComputedStyle(document.documentElement);
      const resolvedValue = resolveColorValue(value, styles, 0);
      if (!resolvedValue) {
        return null;
      }
      node.style.color = "";
      node.style.color = String(resolvedValue);
      const computed = getComputedStyle(node).color;
      const parsedComputed = parseRgbColor(computed);
      if (parsedComputed) {
        return parsedComputed;
      }
      return parseRgbColor(resolvedValue);
    }

    function relativeLuminance(rgb) {
      if (!rgb) {
        return 0;
      }
      const channel = (component) => {
        const value = component / 255;
        return value <= 0.03928
          ? value / 12.92
          : Math.pow((value + 0.055) / 1.055, 2.4);
      };
      return (
        0.2126 * channel(rgb.r) +
        0.7152 * channel(rgb.g) +
        0.0722 * channel(rgb.b)
      );
    }

    function contrastRatio(foreground, background) {
      const fg = resolveColorToRgb(foreground);
      const bg = resolveColorToRgb(background);
      if (!fg || !bg) {
        return null;
      }
      const l1 = relativeLuminance(fg);
      const l2 = relativeLuminance(bg);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    function formatContrastRatio(value) {
      if (!value || !isFinite(value)) {
        return "-";
      }
      return value.toFixed(2) + ":1";
    }

    function updateCotyContrastChecks() {
      if (!cotyContrastChecksRoot) {
        return;
      }
      const isSwedish = document.documentElement.lang === "sv";
      const pairs = [
        {
          label: "--bg-page / --text-default",
          foreground: "--text-default",
          background: "--bg-page",
          threshold: 4.5,
          requirement: "text",
        },
        {
          label: "--bg-surface / --text-default",
          foreground: "--text-default",
          background: "--bg-surface",
          threshold: 4.5,
          requirement: "text",
        },
        {
          label: "--primary / --on-primary",
          foreground: "--on-primary",
          background: "--primary",
          threshold: 4.5,
          requirement: "text",
        },
        {
          label: "--component-nav-cta-bg / --component-nav-cta-text",
          foreground: "--component-nav-cta-text",
          background: "--component-nav-cta-bg",
          threshold: 4.5,
          requirement: "text",
        },
        {
          label: "--bg-surface / --border-default",
          foreground: "--border-default",
          background: "--bg-surface",
          threshold: 3,
          requirement: "non-text",
        },
        {
          label: "--bg-page / --border-strong",
          foreground: "--border-strong",
          background: "--bg-page",
          threshold: 3,
          requirement: "non-text",
        },
      ];
      const rootStyles = getComputedStyle(document.documentElement);
      cotyContrastChecksRoot.innerHTML = "";

      pairs.forEach((pair) => {
        const fg = rootStyles.getPropertyValue(pair.foreground).trim();
        const bg = rootStyles.getPropertyValue(pair.background).trim();
        const ratio = contrastRatio(fg, bg);
        const pass = Boolean(ratio && ratio >= pair.threshold);

        const item = document.createElement("div");
        item.className = "palette-generator__contrast-item";

        const pairLabel = document.createElement("div");
        pairLabel.className = "palette-generator__contrast-pair";
        pairLabel.textContent = pair.label;

        const ratioLabel = document.createElement("div");
        ratioLabel.className = "palette-generator__contrast-ratio";
        ratioLabel.textContent =
          (isSwedish ? "Kontrast: " : "Contrast: ") +
          formatContrastRatio(ratio);

        const status = document.createElement("div");
        status.className = "palette-generator__contrast-status";
        status.setAttribute("data-pass", pass ? "true" : "false");
        const requirementLabel =
          pair.requirement === "non-text"
            ? isSwedish
              ? "AA UI/non-text (3:1)"
              : "AA UI/non-text (3:1)"
            : isSwedish
            ? "AA normal text (4.5:1)"
            : "AA normal text (4.5:1)";
        status.textContent = requirementLabel + ": " + (pass ? "Pass" : "Fail");

        item.appendChild(pairLabel);
        item.appendChild(ratioLabel);
        item.appendChild(status);
        cotyContrastChecksRoot.appendChild(item);
      });
    }

    function formatDiffValue(value) {
      return value ? String(value) : "auto";
    }

    function getCotyTokenChangeState(token) {
      const year = currentCotyYear();
      const actions = window.CotyScaleActions;
      if (!year || !actions || typeof actions.getEntry !== "function") {
        return {
          lightChanged: false,
          darkChanged: false,
          lightBase: "auto",
          lightCurrent: "auto",
          darkBase: "auto",
          darkCurrent: "auto",
        };
      }

      const entry = actions.getEntry(year);
      if (!entry) {
        return {
          lightChanged: false,
          darkChanged: false,
          lightBase: "auto",
          lightCurrent: "auto",
          darkBase: "auto",
          darkCurrent: "auto",
        };
      }

      const field = COTY_OVERRIDE_FIELDS.find(
        (candidate) => candidate.token === token
      );
      if (!field) {
        return {
          lightChanged: false,
          darkChanged: false,
          lightBase: "auto",
          lightCurrent: "auto",
          darkBase: "auto",
          darkCurrent: "auto",
        };
      }

      const baseConfig = sanitizeCotyDraft(getEntryYearConfig(entry), year);
      const currentConfig = sanitizeCotyDraft(getCotyDraftForYear(year), year);
      const lightBase = formatDiffValue(
        (baseConfig.overrides_light || {})[field.key] || ""
      );
      const lightCurrent = formatDiffValue(
        (currentConfig.overrides_light || {})[field.key] || ""
      );
      const darkBase = formatDiffValue(
        (baseConfig.overrides_dark || {})[field.key] || ""
      );
      const darkCurrent = formatDiffValue(
        (currentConfig.overrides_dark || {})[field.key] || ""
      );

      return {
        lightChanged: lightBase !== lightCurrent,
        darkChanged: darkBase !== darkCurrent,
        lightBase: lightBase,
        lightCurrent: lightCurrent,
        darkBase: darkBase,
        darkCurrent: darkCurrent,
      };
    }

    function updateCotyDiffView() {
      if (!cotyDiffRoot) {
        return;
      }
      const isSwedish = document.documentElement.lang === "sv";
      const year = currentCotyYear();
      const actions = window.CotyScaleActions;
      if (!year || !actions || typeof actions.getEntry !== "function") {
        cotyDiffRoot.textContent = isSwedish
          ? "Ingen årsdata tillgänglig."
          : "No year data available.";
        return;
      }

      const entry = actions.getEntry(year);
      if (!entry) {
        cotyDiffRoot.textContent = isSwedish
          ? "Ingen årsdata tillgänglig."
          : "No year data available.";
        return;
      }

      const baseConfig = sanitizeCotyDraft(getEntryYearConfig(entry), year);
      const currentConfig = sanitizeCotyDraft(getCotyDraftForYear(year), year);
      const tokenLabelByKey = {};
      COTY_OVERRIDE_FIELDS.forEach((field) => {
        tokenLabelByKey[field.key] = field.token;
      });

      const changes = [];

      if (
        (baseConfig.role_mode || "auto") !== (currentConfig.role_mode || "auto")
      ) {
        changes.push({
          mode: "all",
          token: "--coty-role-mode",
          base: formatDiffValue(baseConfig.role_mode),
          current: formatDiffValue(currentConfig.role_mode),
        });
      }

      if (
        String(baseConfig.anchor_step || "") !==
        String(currentConfig.anchor_step || "")
      ) {
        changes.push({
          mode: "all",
          token: "--coty-anchor-step",
          base: formatDiffValue(baseConfig.anchor_step),
          current: formatDiffValue(currentConfig.anchor_step),
        });
      }

      ["light", "dark"].forEach((mode) => {
        const baseBucket = baseConfig["overrides_" + mode] || {};
        const currentBucket = currentConfig["overrides_" + mode] || {};
        Object.keys(tokenLabelByKey).forEach((key) => {
          const baseValue = formatDiffValue(baseBucket[key] || "");
          const currentValue = formatDiffValue(currentBucket[key] || "");
          if (baseValue === currentValue) {
            return;
          }
          changes.push({
            mode: mode,
            token: tokenLabelByKey[key],
            base: baseValue,
            current: currentValue,
          });
        });
      });

      const lightCount = changes.filter(
        (change) => change.mode === "light"
      ).length;
      const darkCount = changes.filter(
        (change) => change.mode === "dark"
      ).length;
      const globalCount = changes.filter(
        (change) => change.mode === "all"
      ).length;
      const visibleChanges = changes.slice();

      cotyDiffRoot.innerHTML = "";

      const summary = document.createElement("div");
      summary.className = "palette-generator__diff-summary";

      const allBadge = document.createElement("span");
      allBadge.className = "palette-generator__diff-badge";
      allBadge.textContent = isSwedish
        ? "Totalt: " + changes.length
        : "Total: " + changes.length;

      const lightBadge = document.createElement("span");
      lightBadge.className = "palette-generator__diff-badge";
      lightBadge.textContent = isSwedish
        ? "Light: " + lightCount
        : "Light: " + lightCount;

      const darkBadge = document.createElement("span");
      darkBadge.className = "palette-generator__diff-badge";
      darkBadge.textContent = isSwedish
        ? "Dark: " + darkCount
        : "Dark: " + darkCount;

      const globalBadge = document.createElement("span");
      globalBadge.className = "palette-generator__diff-badge";
      globalBadge.textContent = isSwedish
        ? "Globalt: " + globalCount
        : "Global: " + globalCount;

      summary.appendChild(allBadge);
      summary.appendChild(lightBadge);
      summary.appendChild(darkBadge);
      summary.appendChild(globalBadge);
      cotyDiffRoot.appendChild(summary);

      if (!visibleChanges.length) {
        const empty = document.createElement("p");
        empty.className = "palette-generator__hint";
        empty.textContent = isSwedish
          ? "Inga avvikelser mot bas för år " + year + "."
          : "No differences vs base for year " + year + ".";
        cotyDiffRoot.appendChild(empty);
        return;
      }

      const list = document.createElement("div");
      list.className = "palette-generator__diff-list";

      visibleChanges.forEach((change) => {
        const item = document.createElement("article");
        item.className = "palette-generator__diff-item";

        const token = document.createElement("div");
        token.className = "palette-generator__diff-token";
        token.textContent =
          (change.mode === "all" ? "[all] " : "[" + change.mode + "] ") +
          change.token;
        token.tabIndex = 0;
        token.setAttribute("role", "button");
        token.setAttribute("data-token", change.token);
        token.setAttribute(
          "aria-label",
          (isSwedish ? "Visa usage för " : "Show usage for ") + change.token
        );
        token.addEventListener("click", () => {
          setSelectedUsageToken(change.token, { focus: true });
          updateCotyTokenUsagePanel();
        });
        token.addEventListener("keydown", (evt) => {
          if (evt.key !== "Enter" && evt.key !== " ") {
            return;
          }
          evt.preventDefault();
          setSelectedUsageToken(change.token, { focus: true });
          updateCotyTokenUsagePanel();
        });

        const base = document.createElement("div");
        base.className = "palette-generator__diff-value";
        const baseLabel = document.createElement("strong");
        baseLabel.textContent = "base: ";
        const baseValue = document.createElement("span");
        baseValue.textContent = change.base;
        base.appendChild(baseLabel);
        base.appendChild(baseValue);

        const current = document.createElement("div");
        current.className = "palette-generator__diff-value";
        const currentLabel = document.createElement("strong");
        currentLabel.textContent = "current: ";
        const currentValue = document.createElement("span");
        currentValue.textContent = change.current;
        current.appendChild(currentLabel);
        current.appendChild(currentValue);

        item.appendChild(token);
        item.appendChild(base);
        item.appendChild(current);
        list.appendChild(item);
      });

      cotyDiffRoot.appendChild(list);
    }

    function populateCotyTokenUsageSelect() {
      if (!cotyTokenUsageSelect) {
        return;
      }
      const tokens = uniqueTokenList(
        COTY_OVERRIDE_FIELDS.map((field) => field.token).concat(
          Object.keys(COTY_TOKEN_USAGE_INDEX)
        )
      );
      const current = cotyTokenUsageSelect.value;
      cotyTokenUsageSelect.innerHTML = "";
      tokens.forEach((token) => {
        const option = document.createElement("option");
        option.value = token;
        option.textContent = token;
        cotyTokenUsageSelect.appendChild(option);
      });
      if (tokens.indexOf(current) > -1) {
        cotyTokenUsageSelect.value = current;
      } else {
        cotyTokenUsageSelect.value = tokens[0] || "";
      }
    }

    function focusTokenUsagePanel() {
      if (!cotyTokenUsageRoot) {
        return;
      }
      const details = cotyTokenUsageRoot.closest("details");
      if (details) {
        details.open = true;
      }
      cotyTokenUsageRoot.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }

    function setSelectedUsageToken(token, options) {
      if (!cotyTokenUsageSelect || !token) {
        return;
      }
      const option = cotyTokenUsageSelect.querySelector(
        'option[value="' + token + '"]'
      );
      if (!option) {
        return;
      }
      cotyTokenUsageSelect.value = token;
      const opts = options || {};
      if (opts.focus) {
        focusTokenUsagePanel();
      }
    }

    function updateCotyTokenUsagePanel() {
      if (!cotyTokenUsageRoot || !cotyTokenUsageList) {
        return;
      }
      const isSwedish = document.documentElement.lang === "sv";
      const token = cotyTokenUsageSelect ? cotyTokenUsageSelect.value : "";
      cotyTokenUsageList.innerHTML = "";
      if (!token) {
        const empty = document.createElement("p");
        empty.className = "palette-generator__hint";
        empty.textContent = isSwedish ? "Välj en token." : "Select a token.";
        cotyTokenUsageList.appendChild(empty);
        return;
      }

      const rootStyles = getComputedStyle(document.documentElement);
      const currentValue = rootStyles.getPropertyValue(token).trim() || "auto";
      const entries = COTY_TOKEN_USAGE_INDEX[token] || [];

      const summary = document.createElement("div");
      summary.className = "palette-generator__diff-summary";

      const valueBadge = document.createElement("span");
      valueBadge.className = "palette-generator__diff-badge";
      valueBadge.textContent =
        (isSwedish ? "Aktuellt värde: " : "Current value: ") + currentValue;

      const refsBadge = document.createElement("span");
      refsBadge.className = "palette-generator__diff-badge";
      refsBadge.textContent =
        (isSwedish ? "Referenser: " : "References: ") + entries.length;

      const changeState = getCotyTokenChangeState(token);
      const lightBadge = document.createElement("span");
      lightBadge.className = "palette-generator__diff-badge";
      lightBadge.textContent = isSwedish
        ? "Light: " + (changeState.lightChanged ? "ändrad" : "bas")
        : "Light: " + (changeState.lightChanged ? "changed" : "base");

      const darkBadge = document.createElement("span");
      darkBadge.className = "palette-generator__diff-badge";
      darkBadge.textContent = isSwedish
        ? "Dark: " + (changeState.darkChanged ? "ändrad" : "bas")
        : "Dark: " + (changeState.darkChanged ? "changed" : "base");

      summary.appendChild(valueBadge);
      summary.appendChild(refsBadge);
      summary.appendChild(lightBadge);
      summary.appendChild(darkBadge);
      cotyTokenUsageList.appendChild(summary);

      if (changeState.lightChanged || changeState.darkChanged) {
        const changeItem = document.createElement("article");
        changeItem.className = "palette-generator__usage-item";

        const title = document.createElement("div");
        title.className = "palette-generator__usage-file";
        title.textContent = isSwedish
          ? "Diff mot bas för token"
          : "Diff against base for token";
        changeItem.appendChild(title);

        const lightLine = document.createElement("div");
        lightLine.className = "palette-generator__usage-selector";
        lightLine.textContent =
          "light: " + changeState.lightBase + " -> " + changeState.lightCurrent;
        changeItem.appendChild(lightLine);

        const darkLine = document.createElement("div");
        darkLine.className = "palette-generator__usage-selector";
        darkLine.textContent =
          "dark: " + changeState.darkBase + " -> " + changeState.darkCurrent;
        changeItem.appendChild(darkLine);

        cotyTokenUsageList.appendChild(changeItem);
      }

      if (!entries.length) {
        const empty = document.createElement("p");
        empty.className = "palette-generator__hint";
        empty.textContent = isSwedish
          ? "Ingen usage-mappning ännu för denna token."
          : "No usage mapping yet for this token.";
        cotyTokenUsageList.appendChild(empty);
        return;
      }

      entries.forEach((entry) => {
        const item = document.createElement("article");
        item.className = "palette-generator__usage-item";

        const file = document.createElement("div");
        file.className = "palette-generator__usage-file";
        file.textContent = entry.file || "";

        const selector = document.createElement("div");
        selector.className = "palette-generator__usage-selector";
        selector.textContent = entry.selector || "";

        item.appendChild(file);
        item.appendChild(selector);

        if (entry.note) {
          const note = document.createElement("div");
          note.className = "palette-generator__usage-note";
          note.textContent = entry.note;
          item.appendChild(note);
        }

        cotyTokenUsageList.appendChild(item);
      });
    }

    function controlColorStoragePayload() {
      return {
        enabled: Boolean(cotyControlColorState.enabled),
        color: cotyControlColorState.color,
        scope: cotyControlColorState.scope,
        token: cotyControlColorState.token,
      };
    }

    function saveControlColorState() {
      try {
        localStorage.setItem(
          COTY_CONTROL_COLOR_KEY,
          JSON.stringify(controlColorStoragePayload())
        );
      } catch {
        // Ignore localStorage failures
      }
    }

    function loadControlColorState() {
      try {
        const raw = localStorage.getItem(COTY_CONTROL_COLOR_KEY);
        if (!raw) {
          return;
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
          return;
        }
        cotyControlColorState.enabled = Boolean(parsed.enabled);
        cotyControlColorState.color =
          typeof parsed.color === "string"
            ? parsed.color
            : cotyControlColorState.color;
        cotyControlColorState.scope =
          typeof parsed.scope === "string"
            ? parsed.scope
            : cotyControlColorState.scope;
        cotyControlColorState.token =
          typeof parsed.token === "string"
            ? parsed.token
            : cotyControlColorState.token;
      } catch {
        // Ignore localStorage failures
      }
    }

    function clearControlColorOverrides() {
      controlColorAppliedTokens.forEach((token) => {
        document.documentElement.style.removeProperty(token);
      });
      controlColorAppliedTokens.clear();
    }

    function controlColorTargetTokens() {
      const groups = getControlColorTokenGroups();
      if (cotyControlColorState.scope === "text") {
        return groups.text;
      }
      if (cotyControlColorState.scope === "surface") {
        return groups.surface;
      }
      if (cotyControlColorState.scope === "border") {
        return groups.border;
      }
      if (cotyControlColorState.scope === "token") {
        return cotyControlColorState.token ? [cotyControlColorState.token] : [];
      }
      return groups.primary;
    }

    function updateControlColorCountLabel() {
      if (!cotyControlColorCountLabel) {
        return;
      }
      const isSwedish = document.documentElement.lang === "sv";
      const count = controlColorTargetTokens().length;
      const active = cotyControlColorState.enabled
        ? isSwedish
          ? "aktiv"
          : "active"
        : isSwedish
        ? "av"
        : "off";
      cotyControlColorCountLabel.textContent = isSwedish
        ? "Påverkade tokens: " + count + " (" + active + ")"
        : "Affected tokens: " + count + " (" + active + ")";
    }

    function applyControlColorOverrides() {
      clearControlColorOverrides();
      if (!cotyControlColorState.enabled) {
        return;
      }
      if (currentActiveSource() !== "pantone") {
        return;
      }
      const targets = controlColorTargetTokens();
      targets.forEach((token) => {
        document.documentElement.style.setProperty(
          token,
          cotyControlColorState.color
        );
        controlColorAppliedTokens.add(token);
      });
    }

    function populateControlColorTokenSelect() {
      if (!cotyControlColorTokenSelect) {
        return;
      }
      const tokens = uniqueTokenList(
        COTY_OVERRIDE_FIELDS.map((field) => field.token)
      );
      cotyControlColorTokenSelect.innerHTML = "";
      tokens.forEach((token) => {
        const option = document.createElement("option");
        option.value = token;
        option.textContent = token;
        cotyControlColorTokenSelect.appendChild(option);
      });
      if (tokens.indexOf(cotyControlColorState.token) > -1) {
        cotyControlColorTokenSelect.value = cotyControlColorState.token;
      } else {
        cotyControlColorState.token = tokens[0] || "";
        cotyControlColorTokenSelect.value = cotyControlColorState.token;
      }
    }

    function syncControlColorUI() {
      if (cotyControlColorValueInput) {
        cotyControlColorValueInput.value = cotyControlColorState.color;
      }
      if (cotyControlColorScopeSelect) {
        cotyControlColorScopeSelect.value = cotyControlColorState.scope;
      }
      if (cotyControlColorTokenSelect) {
        cotyControlColorTokenSelect.value = cotyControlColorState.token;
      }
      if (cotyControlColorTokenRow) {
        if (cotyControlColorState.scope === "token") {
          cotyControlColorTokenRow.removeAttribute("hidden");
        } else {
          cotyControlColorTokenRow.setAttribute("hidden", "");
        }
      }
      if (cotyControlColorToggleButton) {
        setToggleState(
          cotyControlColorToggleButton,
          cotyControlColorState.enabled,
          {
            on: document.documentElement.lang === "sv" ? "Aktiv" : "Active",
            off: document.documentElement.lang === "sv" ? "Aktivera" : "Enable",
          }
        );
      }
      updateControlColorCountLabel();
    }

    function reapplyGeneratorState() {
      if (currentPresetName() === "pantone") {
        // Pantone Lab owns runtime tokens via CotyScaleActions.
        // Clear previously applied Palette Builder tokens so they don't override Pantone.
        clearTokens();
        applyCotyDraftForSelectedYear();
      } else {
        applyFromRoles(
          currentRoles(),
          currentPresetName(),
          currentPolicies(currentPresetName())
        );
      }
      applyControlColorOverrides();
      updateCotyDiffView();
      updateCotyContrastChecks();
      updateCotyTokenUsagePanel();
      updateCotySourceStepLabel();
      updateCotyOverrideOptionLabels();
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

        group.fields.forEach((field) => {
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

          row.appendChild(label);
          row.appendChild(select);
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
      const allowed = new Set(optionValues);
      const isDuo = isCotyEntryDuo(year);

      Object.keys(cotyOverrideSelects).forEach((key) => {
        const select = cotyOverrideSelects[key];
        if (!select) {
          return;
        }
        const currentValue = select.value || "";
        select.innerHTML = "";
        optionValues.forEach((value) => {
          const opt = document.createElement("option");
          opt.value = value;
          opt.textContent = value || "auto";
          select.appendChild(opt);
        });
        select.value = allowed.has(currentValue) ? currentValue : "";
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
      const sourceStep = getComputedStyle(document.documentElement)
        .getPropertyValue("--coty-source-step")
        .trim();
      const secondarySourceStep = getComputedStyle(document.documentElement)
        .getPropertyValue("--coty-secondary-source-step")
        .trim();
      const isSwedish = document.documentElement.lang === "sv";
      const sourceSuffix = isSwedish ? " (source)" : " (source)";
      const secondarySourceSuffix = isSwedish
        ? " (sekundär source)"
        : " (secondary source)";

      Object.keys(cotyOverrideSelects).forEach((key) => {
        const select = cotyOverrideSelects[key];
        if (!select) {
          return;
        }
        Array.from(select.options).forEach((option) => {
          const value = option.value || "";
          if (!value) {
            option.textContent = "auto";
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
      const sanitizeOverrideBucket = (source) => {
        const out = {};
        Object.keys(cotyOverrideSelects).forEach((key) => {
          const value = normalizeCotyOverrideValue(source && source[key]);
          if (!value) {
            return;
          }
          if (!allowed.has(value)) {
            return;
          }
          out[key] = value;
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
      const anchorPart = anchorStep
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

      if (cotyAnchorStepSelect) {
        cotyAnchorStepSelect.innerHTML = "";
        const autoOption = document.createElement("option");
        autoOption.value = "";
        autoOption.textContent = "auto";
        cotyAnchorStepSelect.appendChild(autoOption);
        for (let step = 1; step <= 12; step += 1) {
          const stepOption = document.createElement("option");
          stepOption.value = String(step);
          stepOption.textContent = String(step);
          cotyAnchorStepSelect.appendChild(stepOption);
        }
      }

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

      if (cotyYearPrevButton) {
        cotyYearPrevButton.addEventListener("click", () => shiftYear(-1));
      }
      if (cotyYearNextButton) {
        cotyYearNextButton.addEventListener("click", () => shiftYear(1));
      }
      if (cotyYearRandomButton) {
        cotyYearRandomButton.addEventListener("click", () => {
          if (!cotyYearSelect) {
            return;
          }
          const optionValues = Array.from(cotyYearSelect.options).map(
            (option) => option.value
          );
          if (optionValues.length <= 1) {
            return;
          }
          const currentValue = cotyYearSelect.value;
          const candidates = optionValues.filter(
            (value) => value !== currentValue
          );
          const randomIndex = Math.floor(Math.random() * candidates.length);
          cotyYearSelect.value = candidates[randomIndex];
          applyCurrentYearSelection();
        });
      }

      window.addEventListener("keydown", (evt) => {
        if (currentActiveSource() !== "pantone") {
          return;
        }
        const target = evt.target;
        const tagName = target && target.tagName ? target.tagName : "";
        const isEditable =
          (target &&
            target.getAttribute &&
            target.getAttribute("contenteditable") === "true") ||
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT";
        if (isEditable || !evt.altKey) {
          return;
        }
        if (evt.key === "ArrowLeft") {
          evt.preventDefault();
          shiftYear(-1);
          return;
        }
        if (evt.key === "ArrowRight") {
          evt.preventDefault();
          shiftYear(1);
          return;
        }
        if (evt.key.toLowerCase() === "r" && cotyYearRandomButton) {
          evt.preventDefault();
          cotyYearRandomButton.click();
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

      if (cotyRoleModeSelect) {
        cotyRoleModeSelect.addEventListener("change", onCotyControlChange);
      }
      if (cotyAnchorStepSelect) {
        cotyAnchorStepSelect.addEventListener("change", onCotyControlChange);
      }
      Object.keys(cotyOverrideSelects).forEach((key) => {
        const select = cotyOverrideSelects[key];
        if (!select) {
          return;
        }
        select.addEventListener("change", () => {
          const field = COTY_OVERRIDE_FIELDS.find(
            (candidate) => candidate.key === key
          );
          if (field) {
            setSelectedUsageToken(field.token);
          }
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

    function initControlColorControls() {
      if (
        !cotyControlColorValueInput ||
        !cotyControlColorScopeSelect ||
        !cotyControlColorTokenSelect
      ) {
        return;
      }
      loadControlColorState();
      populateControlColorTokenSelect();
      syncControlColorUI();

      cotyControlColorValueInput.addEventListener("input", () => {
        cotyControlColorState.color =
          cotyControlColorValueInput.value || "#ff4d4d";
        saveControlColorState();
        reapplyGeneratorState();
      });

      cotyControlColorScopeSelect.addEventListener("change", () => {
        cotyControlColorState.scope =
          cotyControlColorScopeSelect.value || "primary";
        syncControlColorUI();
        saveControlColorState();
        reapplyGeneratorState();
      });

      cotyControlColorTokenSelect.addEventListener("change", () => {
        cotyControlColorState.token = cotyControlColorTokenSelect.value || "";
        saveControlColorState();
        reapplyGeneratorState();
      });

      if (cotyControlColorToggleButton) {
        cotyControlColorToggleButton.addEventListener("click", () => {
          cotyControlColorState.enabled = !cotyControlColorState.enabled;
          syncControlColorUI();
          saveControlColorState();
          reapplyGeneratorState();
        });
      }

      if (cotyControlColorResetButton) {
        cotyControlColorResetButton.addEventListener("click", () => {
          cotyControlColorState.enabled = false;
          syncControlColorUI();
          saveControlColorState();
          reapplyGeneratorState();
        });
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
      setDerivedToken("--secondary", ctx.secondary.base);
      setDerivedToken("--secondary-strong", ctx.secondary.strong);
      setDerivedToken("--on-secondary", ctx.text.default);

      // Keep legacy aliases synchronized during migration.
      setDerivedToken("--accent-primary", ctx.primary.base);
      setDerivedToken("--accent-primary-strong", ctx.primary.strong);
      setDerivedToken("--accent-secondary", ctx.secondary.base);
      setDerivedToken("--accent-secondary-strong", ctx.secondary.strong);
      setDerivedToken("--brand-primary", ctx.primary.base);
      setDerivedToken("--brand-on-primary", ctx.primary.on);
      setDerivedToken(
        "--text-accent",
        resolveSource(textSteps.accent_source, ctx)
      );
      setDerivedToken("--component-toc-active-indicator", ctx.primary.base);
      setDerivedToken("--component-section-headline-bg", ctx.primary.base);

      setDerivedToken("--text-default", ctx.text.default);
      setDerivedToken(
        "--text-tag",
        scaleVar(effectiveRoles.surface, surfaceSteps.tag_text_step || 11)
      );
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

      setDerivedToken("--bg-page", ctx.surface.page);
      setDerivedToken("--bg-surface", ctx.surface.surface);
      setDerivedToken("--bg-tag", ctx.surface.tag);
      setDerivedToken("--bg-tag-hover", ctx.surface.tag_hover);
      setDerivedToken("--border-subtle", ctx.surface.border_subtle);

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
        setToken("--image-grayscale", "100%");
        setToken("--image-blend-mode", "screen");
        if (document.documentElement.getAttribute("data-mode") === "dark") {
          setToken("--image-background", scaleVar(effectiveRoles.surface, 7));
        } else {
          setToken("--image-background", scaleVar(effectiveRoles.surface, 12));
        }
      } else {
        setToken("--image-grayscale", "0%");
        setToken("--image-blend-mode", "normal");
        setToken("--image-background", "transparent");
      }

      let navCtaBgSource = baseline.roles.component.nav_cta.bg_source;
      let navCtaTextSource = baseline.roles.component.nav_cta.text_source;
      navCtaBgSource = componentOverrides.nav_cta_bg_source || navCtaBgSource;
      navCtaTextSource =
        componentOverrides.nav_cta_text_source || navCtaTextSource;
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
            effectiveRoles[newsletter.button_text_role || "primary"],
            newsletter.button_text_step
          );

      setDerivedToken("--component-newsletter-bg", newsletterBg);
      setDerivedToken("--component-newsletter-text", newsletterText);
      setDerivedToken(
        "--component-newsletter-illustration-bg",
        newsletterIllustrationBg
      );
      setDerivedToken("--component-newsletter-button-bg", newsletterButtonBg);
      setDerivedToken(
        "--component-newsletter-button-text",
        newsletterButtonText
      );

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
        el.value = preset.roles[role] || el.value;
      });
      syncSecondaryAvailability();
      if (name === "pantone") {
        clearTokens();
        applyCotyDraftForSelectedYear();
      } else {
        applyFromRoles(currentRoles(), name, currentPolicies(name));
      }
      applyControlColorOverrides();
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
    populateCotyTokenUsageSelect();
    initCotyYearControl();
    initControlColorControls();
    if (cotyTokenUsageSelect) {
      cotyTokenUsageSelect.addEventListener("change", () => {
        updateCotyTokenUsagePanel();
      });
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
      clearControlColorOverrides();
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
              derived["--bg-page"] ||
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
      syncControlColorUI();
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
