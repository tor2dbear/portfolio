# Palette Override Audit (2026-02-12)

Scope:
- `data/themes/forest.toml`
- `data/themes/mesa.toml`
- `data/themes/pantone.toml`
- Baseline: `data/theme-baseline.toml` (canonical `standard`)

Goal:
- Classify each override as:
  - `necessary` (required to match current visual output)
  - `policy-candidate` (should become a reusable rule, not per-token override)
  - `legacy` (likely no longer needed)

## Forest

`necessary` for parity with `assets/css/dimensions/palette/forest.css`:
- `text_muted = green-10`
- `text_link_hover = green-11`
- `bg_page = green-2`
- `bg_surface = green-4`
- `bg_tag = green-4`
- `bg_tag_hover = green-5`
- `bg_nav = green-5`
- `border_subtle = green-5`
- `component_form_bg = green-3`
- `component_form_placeholder = green-4`

`policy-candidate`:
- `text_link = iris-11`
Reason:
- Same pattern appears in multiple themes and represents a design policy ("neutral links") rather than a one-off exception.

`legacy`:
- None identified.

## Mesa

`necessary` for parity with `assets/css/dimensions/palette/mesa.css`:
- `text_link_hover = teal-11`
- `bg_page = amber-2`
- `bg_surface = amber-4`
- `bg_tag = amber-4`
- `bg_tag_hover = amber-5`
- `bg_nav = amber-5`
- `border_subtle = amber-5`
- `component_form_bg = amber-3`
- `component_form_placeholder = amber-4`
- `component_newsletter_illustration_bg = amber-4`

`policy-candidate`:
- `text_link = iris-11`
- `component_overrides.nav_cta_bg_source = primary.base`
- `component_overrides.nav_cta_text_source = primary.on`
Reason:
- These encode reusable behavioral choices ("neutral links", "accent CTA for dual-accent themes").

`legacy`:
- None identified. Newsletter illustration token is still used by `assets/css/components/newsletter.css`.

## Pantone

`necessary` for parity with `assets/css/dimensions/palette/pantone.css`:
- `text_muted = cloud-10`
- `text_link_hover = cloud-11`
- `bg_page = cloud-2`
- `bg_surface = cloud-4`
- `bg_tag = cloud-4`
- `bg_tag_hover = cloud-5`
- `bg_nav = cloud-5`
- `border_subtle = cloud-5`
- `component_form_bg = cloud-3`
- `component_form_placeholder = cloud-4`

`policy-candidate`:
- `text_link = iris-11`
Reason:
- Same reusable pattern as forest/mesa.

`legacy`:
- None identified.

## Cross-theme Findings

High-frequency override patterns:
- Link baseline policy:
  - `text_link = iris-11` appears in `forest`, `mesa`, `pantone`.
- Surface depth policy:
  - `bg_page=*-2`, `bg_surface=*-4`, `bg_tag=*-4`, `bg_tag_hover=*-5`, `bg_nav=*-5` appears in all non-standard themes.
- Border/form policy:
  - `border_subtle=*-5`, `component_form_bg=*-3`, `component_form_placeholder=*-4` appears in all non-standard themes.

Interpretation:
- Most overrides are not random exceptions.
- They are consistent, repeated rules that should be promoted to policy-level knobs.

## Simplification Proposal (Low-risk)

1. Add a theme-level policy block in baseline/generator (not token-by-token):
- `link_policy = neutral | role`
- `surface_depth_policy = standard | deep`
- `form_policy = neutral | surface-derived`

2. Map current themes:
- `standard`: `link_policy=role`, `surface_depth_policy=standard`, `form_policy=neutral`
- `forest`: `link_policy=neutral`, `surface_depth_policy=deep`, `form_policy=surface-derived`
- `mesa`: `link_policy=neutral`, `surface_depth_policy=deep`, `form_policy=surface-derived`
- `pantone`: `link_policy=neutral`, `surface_depth_policy=deep`, `form_policy=surface-derived`

3. Keep only true exceptions as overrides:
- Mesa nav CTA behavior.

Expected outcome:
- Significant reduction in per-token overrides while preserving current visuals.
