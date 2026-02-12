(function () {
  'use strict';

  function tokenVar(token) {
    return 'var(--' + token + ')';
  }

  function scaleVar(family, step) {
    return tokenVar(family + '-' + step);
  }

  function resolveSource(source, ctx) {
    if (!source) return '';
    if (source.indexOf('.') > -1) {
      var parts = source.split('.');
      var role = parts[0];
      var key = parts[1];
      if (ctx[role] && ctx[role][key]) return ctx[role][key];
    }
    return tokenVar(source);
  }

  function derivePaletteTokens(input) {
    var roles = (input && input.roles) || {};
    var policies = (input && input.policies) || {};
    var componentOverrides = (input && input.component_overrides) || {};

    var toneMode = policies.tone_mode || 'mono';
    var surfaceProfile = policies.surface_profile || 'standard';
    var formPolicy = policies.form_policy || 'neutral';

    var effectiveRoles = {
      text: roles.text || 'gray',
      surface: roles.surface || 'gray',
      primary: roles.primary || 'gray',
      secondary: toneMode === 'duo' ? (roles.secondary || roles.primary || 'gray') : (roles.primary || 'gray')
    };

    var ctx = {
      text: {
        default: scaleVar(effectiveRoles.text, 12),
        inverse: tokenVar('white'),
        link: '',
        link_hover: '',
        accent: ''
      },
      surface: {
        page: scaleVar(effectiveRoles.surface, 1),
        surface: scaleVar(effectiveRoles.surface, 2),
        tag: scaleVar(effectiveRoles.surface, 3),
        tag_hover: scaleVar(effectiveRoles.surface, 4),
        nav: '',
        border_subtle: '',
        ink_strong: scaleVar(effectiveRoles.surface, 11)
      },
      primary: {
        base: scaleVar(effectiveRoles.primary, 9),
        strong: scaleVar(effectiveRoles.primary, 11),
        hover: scaleVar(effectiveRoles.primary, 12),
        on: tokenVar('white')
      },
      secondary: {
        base: scaleVar(effectiveRoles.secondary, 4),
        strong: scaleVar(effectiveRoles.secondary, 8)
      }
    };

    ctx.text.link = ctx.primary.strong;
    ctx.text.link_hover = ctx.primary.hover;
    ctx.text.accent = ctx.primary.strong;
    ctx.surface.nav = ctx.primary.base;
    ctx.surface.border_subtle = tokenVar('gray-4');

    if (surfaceProfile === 'deep') {
      ctx.surface.page = scaleVar(effectiveRoles.surface, 2);
      ctx.surface.surface = scaleVar(effectiveRoles.surface, 4);
      ctx.surface.tag = scaleVar(effectiveRoles.surface, 4);
      ctx.surface.tag_hover = scaleVar(effectiveRoles.surface, 5);
      ctx.surface.nav = scaleVar(effectiveRoles.surface, 5);
      ctx.surface.border_subtle = scaleVar(effectiveRoles.surface, 5);
    }

    var tokens = {};

    tokens['--accent-primary'] = ctx.primary.base;
    tokens['--accent-primary-strong'] = ctx.primary.strong;
    tokens['--accent-secondary'] = ctx.secondary.base;
    tokens['--accent-secondary-strong'] = ctx.secondary.strong;

    tokens['--brand-primary'] = ctx.primary.base;
    tokens['--text-accent'] = ctx.text.accent;

    tokens['--text-default'] = ctx.text.default;
    tokens['--text-tag'] = ctx.surface.ink_strong;
    tokens['--surface-ink-strong'] = ctx.surface.ink_strong;
    tokens['--text-muted'] = 'color-mix(in oklch, var(--gray-11) 60%, var(--surface-ink-strong))';
    tokens['--text-link'] = ctx.text.link;
    tokens['--text-link-hover'] = ctx.text.link_hover;
    tokens['--text-inverse'] = ctx.text.inverse;
    tokens['--text-nav'] = ctx.text.default;

    tokens['--bg-page'] = ctx.surface.page;
    tokens['--bg-surface'] = ctx.surface.surface;
    tokens['--bg-tag'] = ctx.surface.tag;
    tokens['--bg-tag-hover'] = ctx.surface.tag_hover;
    tokens['--bg-nav'] = ctx.surface.nav;
    tokens['--border-subtle'] = ctx.surface.border_subtle;

    tokens['--state-focus'] = ctx.primary.base;
    tokens['--state-selected'] = ctx.text.accent;

    tokens['--component-toc-active-indicator'] = toneMode === 'duo' ? ctx.secondary.strong : ctx.primary.base;
    tokens['--component-section-headline-bg'] = toneMode === 'duo' ? ctx.secondary.strong : ctx.primary.base;

    var navCtaBgSource = componentOverrides.nav_cta_bg_source || 'text.default';
    var navCtaTextSource = componentOverrides.nav_cta_text_source || 'surface.page';
    if (toneMode === 'duo') {
      navCtaBgSource = 'primary.base';
      navCtaTextSource = 'primary.on';
    }
    tokens['--component-nav-cta-bg'] = resolveSource(navCtaBgSource, ctx);
    tokens['--component-nav-cta-text'] = resolveSource(navCtaTextSource, ctx);

    tokens['--component-form-bg'] =
      formPolicy === 'surface-derived' ? scaleVar(effectiveRoles.surface, 3) : tokenVar('gray-2');
    tokens['--component-form-placeholder'] =
      formPolicy === 'surface-derived' ? tokens['--text-muted'] : tokenVar('gray-10');

    tokens['--component-newsletter-bg'] = scaleVar(effectiveRoles.surface, 12);
    tokens['--component-newsletter-text'] = scaleVar(effectiveRoles.surface, 2);
    tokens['--component-newsletter-illustration-bg'] = scaleVar(effectiveRoles.surface, 3);
    tokens['--component-newsletter-button-bg'] = scaleVar(effectiveRoles.surface, 4);
    tokens['--component-newsletter-button-text'] = scaleVar(effectiveRoles.primary, 11);

    return tokens;
  }

  function deriveRuntimeTokens(input) {
    var all = derivePaletteTokens(input);
    return {
      '--surface-ink-strong': all['--surface-ink-strong'],
      '--text-tag': all['--text-tag'],
      '--text-muted': all['--text-muted'],
      '--component-toc-active-indicator': all['--component-toc-active-indicator'],
      '--component-section-headline-bg': all['--component-section-headline-bg'],
      '--component-nav-cta-bg': all['--component-nav-cta-bg'],
      '--component-nav-cta-text': all['--component-nav-cta-text'],
      '--component-form-placeholder': all['--component-form-placeholder']
    };
  }

  function deriveImageTokens(input) {
    var roles = (input && input.roles) || {};
    var policies = (input && input.policies) || {};
    var mode = (input && input.mode) || 'light';
    var treatment = policies.image_treatment || 'none';
    var surfaceFamily = roles.surface || 'gray';
    var isDark = mode === 'dark';

    if (treatment === 'pantone-blend') {
      return {
        '--image-grayscale': '100%',
        '--image-blend-mode': 'screen',
        '--image-background': 'var(--' + surfaceFamily + '-' + (isDark ? '7' : '12') + ')'
      };
    }

    return {
      '--image-grayscale': '0%',
      '--image-blend-mode': 'normal',
      '--image-background': 'transparent'
    };
  }

  function derivePreview(input) {
    var roles = (input && input.roles) || {};
    var policies = (input && input.policies) || {};
    var toneMode = policies.tone_mode || 'mono';
    var derived = derivePaletteTokens(input || {});
    var primary = derived['--accent-primary-strong'] || derived['--accent-primary'] || 'var(--gray-11)';
    var surface = derived['--bg-page'] || 'var(--gray-2)';
    var secondary = derived['--accent-secondary-strong'] || derived['--accent-secondary'] || primary;

    return {
      primary: primary,
      surface: surface,
      secondary: secondary,
      toneMode: toneMode,
      seg1: '1',
      seg2: '1',
      seg3: toneMode === 'duo' ? '1' : '0',
      // Keep raw source roles/policies for potential debugging/inspection.
      roles: roles,
      policies: policies
    };
  }

  window.ThemeDerive = {
    derivePaletteTokens: derivePaletteTokens,
    deriveRuntimeTokens: deriveRuntimeTokens,
    deriveImageTokens: deriveImageTokens,
    derivePreview: derivePreview
  };
})();
