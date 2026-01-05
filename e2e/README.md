# E2E Visual Tests

Detta är visuella regressionstester för portfolio-siten. Se [VISUAL_TESTING.md](../VISUAL_TESTING.md) för fullständig dokumentation.

## Snabbstart

```bash
# Första gången - skapa baslinjer
npm run test:visual:update

# Kör tester
npm run test:visual

# Interaktivt UI-läge
npm run test:visual:ui

# Visa rapport
npm run test:visual:report
```

## Testfiler

- `homepage.visual.spec.js` - Homepage layout och komponenter
- `darkmode.visual.spec.js` - Dark mode styling och toggle
- `responsive.visual.spec.js` - Responsiv design på olika viewports

## Screenshots

Baslinje-screenshots sparas i `*.spec.js-snapshots/` mappar bredvid testfilerna. Dessa bör committas till git så att alla utvecklare arbetar mot samma baslinjer.
