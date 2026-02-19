(function () {
  "use strict";

  function tokenVar(token) {
    return "var(--" + token + ")";
  }

  function scaleVar(family, step) {
    return tokenVar(family + "-" + step);
  }

  function resolveSource(source, ctx) {
    if (!source) {
      return "";
    }
    if (source.indexOf(".") > -1) {
      var parts = source.split(".");
      var role = parts[0];
      var key = parts[1];
      if (ctx[role] && ctx[role][key]) {
        return ctx[role][key];
      }
    }
    return tokenVar(source);
  }

  function derivePaletteTokens(input) {
    var roles = (input && input.roles) || {};
    var policies = (input && input.policies) || {};
    var componentOverrides = (input && input.component_overrides) || {};

    var toneMode = policies.tone_mode || "mono";
    var surfaceProfile = policies.surface_profile || "standard";
    var formPolicy = policies.form_policy || "neutral";

    var effectiveRoles = {
      text: roles.text || "gray",
      surface: roles.surface || "gray",
      border: roles.border || roles.surface || "gray",
      primary: roles.primary || "gray",
      secondary:
        toneMode === "duo"
          ? roles.secondary || roles.primary || "gray"
          : roles.primary || "gray",
    };

    var ctx = {
      text: {
        default: scaleVar(effectiveRoles.text, 12),
        inverse: tokenVar("gray-1"),
        link: "",
        link_hover: "",
        accent: "",
      },
      surface: {
        page: scaleVar(effectiveRoles.surface, 1),
        surface: scaleVar(effectiveRoles.surface, 2),
        tag: scaleVar(effectiveRoles.surface, 3),
        tag_hover: scaleVar(effectiveRoles.surface, 4),
        border_subtle: "",
        ink_strong: scaleVar(effectiveRoles.surface, 11),
      },
      border: {
        subtle: "",
        default: scaleVar(effectiveRoles.border, 6),
        strong: scaleVar(effectiveRoles.border, 8),
      },
      primary: {
        base: scaleVar(effectiveRoles.primary, 9),
        strong: scaleVar(effectiveRoles.primary, 11),
        hover: scaleVar(effectiveRoles.primary, 12),
        on: tokenVar("white"),
      },
      secondary: {
        base: scaleVar(effectiveRoles.secondary, 4),
        strong: scaleVar(effectiveRoles.secondary, 8),
      },
      action: {
        base: "",
        on: "",
      },
    };

    ctx.text.link = ctx.primary.strong;
    ctx.text.link_hover = ctx.primary.hover;
    ctx.text.accent = ctx.primary.strong;
    ctx.surface.border_subtle = tokenVar("gray-4");
    ctx.border.subtle = ctx.surface.border_subtle;
    ctx.action.base = ctx.surface.ink_strong;
    ctx.action.on = ctx.surface.page;

    if (toneMode === "duo") {
      ctx.action.base = ctx.primary.base;
      ctx.action.on = ctx.primary.on;
    }

    if (surfaceProfile === "deep") {
      ctx.surface.page = scaleVar(effectiveRoles.surface, 2);
      ctx.surface.surface = scaleVar(effectiveRoles.surface, 4);
      ctx.surface.tag = scaleVar(effectiveRoles.surface, 4);
      ctx.surface.tag_hover = scaleVar(effectiveRoles.surface, 5);
      ctx.surface.border_subtle = scaleVar(effectiveRoles.surface, 5);
      ctx.border.subtle = ctx.surface.border_subtle;
    }

    var tokens = {};

    tokens["--primary"] = ctx.primary.base;
    tokens["--primary-strong"] = ctx.primary.strong;
    tokens["--on-primary"] = ctx.primary.on;
    tokens["--action"] = ctx.action.base;
    tokens["--on-action"] = ctx.action.on;
    tokens["--secondary"] = ctx.secondary.base;
    tokens["--secondary-strong"] = ctx.secondary.strong;
    tokens["--on-secondary"] = ctx.text.default;

    // Keep legacy aliases synchronized during migration.
    tokens["--accent-primary"] = tokens["--primary"];
    tokens["--accent-primary-strong"] = tokens["--primary-strong"];
    tokens["--accent-secondary"] = tokens["--secondary"];
    tokens["--accent-secondary-strong"] = tokens["--secondary-strong"];

    tokens["--text-accent"] = ctx.text.accent;

    tokens["--text-default"] = ctx.text.default;
    tokens["--text-tag"] = ctx.surface.ink_strong;
    tokens["--surface-ink-strong"] = ctx.surface.ink_strong;
    tokens["--text-muted"] =
      "color-mix(in oklch, var(--gray-11) 60%, var(--surface-ink-strong))";
    tokens["--text-link"] = ctx.text.link;
    tokens["--text-link-hover"] = ctx.text.link_hover;
    tokens["--text-inverse"] = ctx.text.inverse;

    tokens["--bg-page"] = ctx.surface.page;
    tokens["--bg-surface"] = ctx.surface.surface;
    tokens["--bg-tag"] = ctx.surface.tag;
    tokens["--bg-tag-hover"] = ctx.surface.tag_hover;
    tokens["--border-subtle"] = ctx.border.subtle;
    tokens["--border-default"] = ctx.border.default;
    tokens["--border-strong"] = ctx.border.strong;

    tokens["--state-focus"] = ctx.primary.base;
    tokens["--state-selected"] = ctx.text.accent;

    tokens["--component-toc-active-indicator"] =
      toneMode === "duo" ? ctx.secondary.strong : ctx.primary.base;
    tokens["--component-section-headline-bg"] =
      toneMode === "duo" ? ctx.secondary.strong : ctx.primary.base;

    var navCtaBgSource = componentOverrides.nav_cta_bg_source || "action.base";
    var navCtaTextSource =
      componentOverrides.nav_cta_text_source || "action.on";
    tokens["--component-nav-cta-bg"] = resolveSource(navCtaBgSource, ctx);
    tokens["--component-nav-cta-text"] = resolveSource(navCtaTextSource, ctx);

    tokens["--component-form-bg"] =
      formPolicy === "surface-derived"
        ? scaleVar(effectiveRoles.surface, 3)
        : tokenVar("gray-2");
    tokens["--component-form-placeholder"] =
      formPolicy === "surface-derived"
        ? tokens["--text-muted"]
        : tokenVar("gray-10");

    tokens["--component-newsletter-bg"] = scaleVar(effectiveRoles.surface, 12);
    tokens["--component-newsletter-text"] = scaleVar(effectiveRoles.surface, 2);
    tokens["--component-newsletter-illustration-bg"] = scaleVar(
      effectiveRoles.surface,
      3
    );
    tokens["--component-newsletter-button-bg"] = scaleVar(
      effectiveRoles.surface,
      4
    );
    tokens["--component-newsletter-button-text"] = scaleVar(
      effectiveRoles.primary,
      11
    );

    return tokens;
  }

  function deriveRuntimeTokens(input) {
    var all = derivePaletteTokens(input);
    return {
      "--surface-ink-strong": all["--surface-ink-strong"],
      "--text-tag": all["--text-tag"],
      "--text-muted": all["--text-muted"],
      "--action": all["--action"],
      "--on-action": all["--on-action"],
      "--component-toc-active-indicator":
        all["--component-toc-active-indicator"],
      "--component-section-headline-bg": all["--component-section-headline-bg"],
      "--component-nav-cta-bg": all["--component-nav-cta-bg"],
      "--component-nav-cta-text": all["--component-nav-cta-text"],
      "--component-form-placeholder": all["--component-form-placeholder"],
    };
  }

  function deriveImageTokens(input) {
    var roles = (input && input.roles) || {};
    var policies = (input && input.policies) || {};
    var mode = (input && input.mode) || "light";
    var treatment = policies.image_treatment || "none";
    var surfaceFamily = roles.surface || "gray";
    var isDark = mode === "dark";

    if (treatment === "pantone-blend") {
      return {
        "--image-grayscale": "100%",
        "--image-blend-mode": "screen",
        "--image-background":
          "var(--" + surfaceFamily + "-" + (isDark ? "7" : "12") + ")",
      };
    }

    return {
      "--image-grayscale": "0%",
      "--image-blend-mode": "normal",
      "--image-background": "transparent",
    };
  }

  function derivePreview(input) {
    var roles = (input && input.roles) || {};
    var policies = (input && input.policies) || {};
    var toneMode = policies.tone_mode || "mono";
    var derived = derivePaletteTokens(input || {});
    var primary =
      derived["--primary-strong"] || derived["--primary"] || "var(--gray-11)";
    var surface = derived["--bg-page"] || "var(--gray-2)";
    var secondary =
      derived["--secondary-strong"] || derived["--secondary"] || primary;

    return {
      primary: primary,
      surface: surface,
      secondary: secondary,
      toneMode: toneMode,
      seg1: "1",
      seg2: "1",
      seg3: toneMode === "duo" ? "1" : "0",
      // Keep raw source roles/policies for potential debugging/inspection.
      roles: roles,
      policies: policies,
    };
  }

  window.ThemeDerive = {
    derivePaletteTokens: derivePaletteTokens,
    deriveRuntimeTokens: deriveRuntimeTokens,
    deriveImageTokens: deriveImageTokens,
    derivePreview: derivePreview,
  };
})();
