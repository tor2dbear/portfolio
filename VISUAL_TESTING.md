# Visuella Tester med Playwright

Detta projekt använder Playwright för visuella regressionstester. Testerna tar skärmdumpar av sidor och komponenter och jämför dem med baslinjer för att upptäcka oavsiktliga visuella förändringar.

## Vad är visuella tester?

Medan enhetstester (Jest) kontrollerar att funktioner gör rätt saker (t.ex. "läggs klassen 'active' till?"), testar visuella tester att saker *ser rätt ut* (t.ex. "är knappen fortfarande blå och har rätt storlek?").

Visuella tester fångar:
- CSS-förändringar som påverkar layout
- Typsnitt och färgändringar
- Responsiva design-problem
- Dark mode-styling
- Layout shifts vid olika skärmstorlekar
- Överflödande innehåll

## Installation

Playwright är redan installerat som en dev-dependency. För att köra testerna behöver du Hugo installerat lokalt:

```bash
# macOS
brew install hugo

# Windows (Chocolatey)
choco install hugo

# Linux (Snap)
snap install hugo
```

## Köra testerna

### Första gången - Generera baslinjer

När du kör testerna första gången genereras baslinje-screenshots som framtida körningar jämförs mot:

```bash
npm run test:visual:update
```

Detta skapar en `e2e` mapp med undermappar för screenshots.

### Köra tester normalt

```bash
npm run test:visual
```

Playwright kommer att:
1. Starta Hugo dev-servern automatiskt på port 1313
2. Köra alla visuella tester
3. Jämföra nya screenshots med baslinjer
4. Rapportera eventuella skillnader

### Interaktiv UI-mode

För bästa utvecklarupplevelse, använd UI-mode:

```bash
npm run test:visual:ui
```

Detta öppnar ett grafiskt gränssnitt där du kan:
- Se tester köras i realtid
- Inspektera screenshots
- Debugga misslyckade tester
- Jämföra diff:ar visuellt

### Visa testrapport

Efter testkörning, visa HTML-rapporten:

```bash
npm run test:visual:report
```

### Uppdatera baslinjer

När du medvetet ändrat design och vill uppdatera baslinjerna:

```bash
npm run test:visual:update
```

**OBS:** Granska alltid visuella ändringar noggrant innan du uppdaterar baslinjer!

## Teststruktur

Testerna är organiserade i tre huvudkategorier:

### 1. Homepage Tests (`e2e/homepage.visual.spec.js`)
- Grundläggande layout i ljust läge
- Header, menu och footer-komponenter
- Viewport resize-hantering

### 2. Dark Mode Tests (`e2e/darkmode.visual.spec.js`)
- Dark mode styling på alla sidor
- Dark mode toggle-funktionalitet
- Dark mode persistens vid navigation
- Dark mode på mobila enheter

### 3. Responsive Tests (`e2e/responsive.visual.spec.js`)
- Flera viewport-storlekar:
  - Mobile (375x667)
  - Mobile Landscape (667x375)
  - Tablet (768x1024)
  - Tablet Landscape (1024x768)
  - Desktop (1280x720)
  - Desktop Large (1920x1080)
- Mobil menu-beteende
- Content reflow
- Bild-skalning

## Testade sidor

Testerna täcker följande sidor:
- Homepage (`/`)
- About (`/about/`)
- Contact (`/contact/`)
- Works (`/works/`)

## CI/CD Integration

Testerna kan integreras i din CI/CD pipeline. I GitHub Actions:

```yaml
- name: Install Playwright
  run: npm ci && npx playwright install --with-deps

- name: Run visual tests
  run: npm run test:visual
```

På CI kommer testerna att:
- Alltid köras seriellt (ej parallellt)
- Försöka igen 2 gånger vid misslyckanden
- Spara screenshots och rapporter som artefakter

## Bästa praxis

### När ska baslinjer uppdateras?

✅ Uppdatera baslinjer när:
- Du medvetet ändrat design/styling
- Du lagt till nya features som påverkar utseendet
- Du fixat en visuell bug

❌ Uppdatera INTE baslinjer när:
- Tester misslyckas oväntat
- Du inte är säker på vad som ändrats
- CI/CD pipelinen fallerar

### Granska alltid diff:ar

Innan du uppdaterar baslinjer:
1. Kör `npm run test:visual:report`
2. Granska alla diff:ar visuellt
3. Verifiera att ändringar är avsiktliga
4. Först då: `npm run test:visual:update`

### Håll screenshots små

Testerna är konfigurerade att:
- Inaktivera animationer (snabbare + mer konsistenta)
- Vänta på att sidor laddats klart
- Ta full-page screenshots där det är relevant
- Ta komponent-screenshots för specifika delar

## Felsökning

### Hugo-servern startar inte

Om `hugo server` inte startar automatiskt:
```bash
# Starta Hugo manuellt i en separat terminal
hugo server --disableFastRender --port 1313

# Kör tester i en annan terminal
npm run test:visual
```

### Screenshots skiljer sig på olika maskiner

Det är normalt att screenshots kan variera mellan:
- Olika operativsystem (macOS vs Linux vs Windows)
- Olika font-rendering
- Olika skärmupplösningar

Lösning: Generera baslinjer på samma miljö som CI/CD använder, eller använd Playwright's Docker-image.

### Tester är långsamma

- Kör specifika tester: `npx playwright test homepage.visual.spec.js`
- Använd färre browsers: Kommentera ut projekt i `playwright.config.js`
- Kör parallellt (lokalt): Ta bort `workers: 1` från config

## Filstruktur

```
portfolio/
├── e2e/                              # Visuella tester
│   ├── homepage.visual.spec.js       # Homepage-tester
│   ├── darkmode.visual.spec.js       # Dark mode-tester
│   ├── responsive.visual.spec.js     # Responsiva tester
│   └── *.spec.js-snapshots/          # Baslinje-screenshots (autogenererad)
├── playwright.config.js              # Playwright-konfiguration
├── playwright-report/                # HTML-rapporter (autogenererad)
└── test-results/                     # Test-artefakter (autogenererad)
```

## Nästa steg

1. **Lägg till fler sidor**: Utöka `pages`-arrayen i `responsive.visual.spec.js`
2. **Testa specifika komponenter**: Lägg till tester för nya UI-komponenter
3. **Testa interaktioner**: Lägg till tester för hover-states, form-inputs, etc.
4. **Cross-browser testing**: Verifiera att alla browser-projekt i config fungerar
5. **Performance**: Lägg till Lighthouse-tester för performance-metrics

## Resurser

- [Playwright Dokumentation](https://playwright.dev)
- [Visual Comparisons Guide](https://playwright.dev/docs/test-snapshots)
- [Best Practices](https://playwright.dev/docs/best-practices)
