# Migrationsplan: Från Utility Classes till Semantic Type System

Status: draft
Skapad: 2026-01-20
Språk: Svenska (dokumentet är på svenska för bättre kommunikation med teamet)

## Sammanfattning

Migrera från utility-heavy HTML till en komponentbaserad approach med semantiska type-klasser. Målet är att minska antalet CSS-klasser i HTML med ~50-70% samtidigt som vi behåller flexibilitet för layout och spacing.

## Mål

- **Minska HTML-bloat**: Från 5-7 klasser per element till 2-3 klasser
- **Förbättra läsbarhet**: HTML ska beskriva struktur, inte styling
- **Förenkla underhåll**: Ändringar görs i CSS-filer istället för 20+ HTML-filer
- **Behåll flexibilitet**: Spacing och layout kan fortfarande variera per kontext
- **Bevara design system**: Semantiska type-klasser är grunden (redan klara!)

## Nulägesanalys

### Statistik från kodbasen (2026-01-20)

- **477 utility class-användningar** i 44 HTML-filer
- **233× margin-bottom** (`mb-*`) i 38 filer
- **100× margin-top** (`mt-*`) i 26 filer
- **96× text sizes** (`text-*`) i 17 filer
- **928 rader utility CSS** fördelat på 6 filer

### Vanligaste problemmönster

#### Mönster 1: Typography overload (förekommer 15+ gånger)
```html
class="text-sm font-serif line-height-normal font-normal"
```
**Bör vara:** `class="type-body-sm"`

#### Mönster 2: Meta text repetition (förekommer 10+ gånger)
```html
class="text-xs line-height-normal font-normal text-color-lighter tracking-wide"
```
**Bör vara:** `class="type-information text-color-lighter"`

#### Mönster 3: Heading utilities (förekommer 20+ gånger)
```html
class="text-2xl line-height-normal text-color-default tracking-normal"
```
**Bör vara:** `class="type-headline-3"`

### Vad som är BRA och ska behållas

✅ **Semantiska type-klasser** (assets/css/utilities/typography.css)
- `.type-display-1`, `.type-display-2`
- `.type-headline-1` → `.type-headline-5`
- `.type-headline-small`
- `.type-preamble`, `.type-lead`
- `.type-body`, `.type-body-sm`
- `.type-information`

✅ **Grid/Layout utilities**
- `.col-span-*`, `.col-start-*`
- `.use-subgrid`
- `.page-grid`

✅ **Display utilities**
- `.hide-on-client`, `.show-on-employer`
- `.reveal`, `.reveal--delay`

✅ **Spacing utilities** (används för variation)
- `.mt-*`, `.mb-*`
- `.gap-xs`

### Vad som ska MIGRERAS

❌ **Typography utilities** (ersätts av type-klasser)
- `.text-xs`, `.text-sm`, `.text-base`, `.text-lg`, `.text-xl`, `.text-2xl`, etc.
- `.font-sans`, `.font-serif`, `.font-mono`
- `.font-normal`, `.font-medium`, `.font-bold`
- `.line-height-normal`, `.line-height-tight`, `.line-height-tighter`
- `.tracking-normal`, `.tracking-wide`, `.tracking-tight`
- `.text-uppercase`, `.text-capitalize`

❌ **Default colors** (flyttas till komponent-CSS)
- `.text-color-default` (bör vara default i komponenter)

⚠️ **Color overrides** (behålls där variationer behövs)
- `.text-color-lighter` (behålls för meta-text)
- `.text-color-accent` (behålls för länkar)
- `.text-color-neg` (behålls för negativ space)

## Migrationsprocess

### Fas 0: Förberedelser

#### 0.1 Skapa mapping-dokument
Skapa en mappningstabell mellan utility combinations och semantic classes:

| Nuvarande utilities | Ersätts av | Noteringar |
|-------------------|-----------|-----------|
| `text-xs line-height-normal font-normal tracking-wide` | `type-information` | Standard meta-text |
| `text-sm font-serif line-height-normal` | `type-body-sm` | Liten brödtext |
| `text-base font-serif line-height-normal` | `type-body` | Huvudtext |
| `text-lg font-serif line-height-normal` | `type-body` eller `type-lead` | Beroende på kontext |
| `text-2xl line-height-normal tracking-normal` | `type-headline-3` | Vanlig rubrik |
| `text-3xl → text-5xl clamp()` | `type-headline-3` | Responsive |
| `text-6xl → text-8xl clamp()` | `type-headline-2` | Stor rubrik |
| `text-uppercase tracking-wider text-xs` | `type-headline-small` | Small caps |

#### 0.2 Identifiera prioriterade komponenter
Lista komponenter som har flest repetitioner:

**Högprioriterade (många filer, stor påverkan):**
1. `summary-card` (förekommer i list-vyer, startsida) - 15+ filer
2. `project-info` (works/single.html) - 8 filer
3. `about-cv` (about_cv.html) - 5 filer
4. `contact-form` (contact_form.html) - 3 filer
5. `breadcrumb` (application-breadcrumb) - 10+ filer

**Mediumprioriterade:**
6. `article-card` - 5 filer
7. `download-card` - 3 filer
8. `toc` (table of contents) - 4 filer

**Lågprioriterade (få användningar):**
9. `newsletter` - 2 filer
10. `tags` - 6 filer

#### 0.3 Backup och rollback-strategi
```bash
# Skapa feature branch för migrationen
git checkout -b feature/utility-cleanup-migration

# Commit efter varje fas för enkel rollback
git commit -m "chore: migration phase X completed"
```

### Fas 1: Summary Card (Pilot-implementation)

**Varför börja här?**
- Förekommer i 15+ filer
- Har tydliga repetitionsmönster
- Representativ för andra komponenter
- Mindre risk (endast list-vyer påverkas)

#### 1.1 Identifiera alla summary card-användningar
Filer som ska uppdateras:
- `layouts/_default/summary.html` (huvudmall)
- `layouts/_default/list.html`
- `layouts/works/list.html`
- `layouts/writing/list.html`
- `layouts/post/list.html`
- `layouts/texter/list.html`
- `layouts/index.html` (startpage featured works)

#### 1.2 Uppdatera summary-card CSS

**Fil:** `assets/css/components/summary-card.css`

**FÖRE (nuvarande tillstånd):**
```css
.summary-card {
  /* Endast grundläggande struktur */
}

.summary-card__title {
  /* Minimal styling, förlitar sig på utilities */
}

.summary-card__meta {
  /* Minimal styling */
}

.summary-card__excerpt {
  /* Minimal styling */
}
```

**EFTER (lägg till defaults):**
```css
.summary-card {
  /* Behåll befintlig struktur */
}

.summary-card__title {
  /* Typography nu definierad här istället för HTML */
  font-size: var(--text-2xl);
  line-height: var(--line-height-normal);
  color: var(--text-default);
  letter-spacing: var(--tracking-normal);
  margin-top: var(--spacing-12);
  margin-bottom: var(--spacing-12);
}

.summary-card__meta {
  font-size: var(--text-xs);
  line-height: var(--line-height-normal);
  font-weight: var(--sans-weight-regular);
  color: var(--text-lighter);
  letter-spacing: var(--tracking-wide);
  margin-bottom: var(--spacing-12);
  font-family: var(--font-sans);
}

.summary-card__excerpt {
  font-size: var(--text-base);
  line-height: var(--line-height-normal);
  color: var(--text-default);
  font-family: var(--font-serif);
}

/* Variant: Wide summary card (för featured works) */
.summary-card--wide .summary-card__title {
  font-size: clamp(var(--text-3xl), calc(1.375rem + 0.625vw), var(--text-5xl));
}

/* VIKTIGT: Responsive styling */
@media (max-width: 63.9375em) {
  .summary-card__title {
    font-size: var(--text-xl); /* Minska på tablet/mobil */
  }
}
```

**VARNING - Responsive utilities:** Glöm inte att kolla efter dolda media queries i `typography.css` som påverkar utilities! Exempel:
```css
/* typography.css hade denna regel för .text-2xl: */
@media (max-width: 63.9375em) {
  .content:is(.startpage, .list) article h2.text-2xl {
    font-size: var(--text-xl);
  }
}
```
Denna responsiva styling måste flyttas till komponent-CSS annars blir text för stor på mobil.

#### 1.3 Uppdatera HTML-mallar

**Fil:** `layouts/_default/summary.html`

**FÖRE:**
```html
<article class="summary-card reveal">
  <h2 class="summary-card__title text-2xl line-height-normal text-color-default tracking-normal mt-12 mb-12">
    <a href="{{ .RelPermalink }}">{{ .Title }}</a>
  </h2>
  <div class="summary-card__meta text-xs line-height-normal font-normal text-color-lighter tracking-wide mb-12">
    {{ .Date.Format "2006-01-02" }}
  </div>
  <p class="summary-card__excerpt text-base line-height-normal font-serif text-color-default">
    {{ .Summary }}
  </p>
</article>
```

**EFTER:**
```html
<article class="summary-card reveal">
  <h2 class="summary-card__title">
    <a href="{{ .RelPermalink }}">{{ .Title }}</a>
  </h2>
  <div class="summary-card__meta">
    {{ .Date.Format "2006-01-02" }}
  </div>
  <p class="summary-card__excerpt">
    {{ .Summary }}
  </p>
</article>
```

**Resultat:** Från 21 klasser → 4 klasser (81% minskning!)

#### 1.4 Testa summary card-ändringar

```bash
# Starta Hugo dev server
hugo server

# Verifiera dessa sidor:
# - / (startsida - featured works)
# - /works/ (lista)
# - /writing/ (lista)
# - /texter/ (svenska listan)
```

**Checklista:**
- [ ] Summary cards ser identiska ut som innan
- [ ] Typography är korrekt (storlek, färg, spacing)
- [ ] Spacing mellan element är oförändrat
- [ ] Hover-states fungerar
- [ ] Mobil-vy fungerar korrekt
- [ ] Wide variant på startsida fungerar

### Fas 2: Project Info (Works-sidan)

**Fil:** `layouts/works/single.html`

#### 2.1 Identifiera projekt-info-komponenten

**FÖRE:**
```html
<div class="project-info mb-48">
  <h3 class="project-info__label text-xs font-sans font-normal text-color-lighter tracking-wider text-uppercase mb-8">
    Client
  </h3>
  <p class="project-info__value text-sm font-serif line-height-normal font-normal text-color-default mt-0 mb-12">
    {{ .Params.client }}
  </p>
</div>
```

#### 2.2 Uppdatera CSS

**Fil:** Skapa `assets/css/components/project-info.css` (om den inte finns)

```css
.project-info {
  margin-bottom: var(--spacing-48);
}

.project-info__label {
  /* Samma som type-headline-small, men komponenten äger sin styling */
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--sans-weight-regular);
  text-transform: uppercase;
  color: var(--text-lighter);
  letter-spacing: var(--tracking-wider);
  margin-bottom: var(--spacing-8);
}

.project-info__value {
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  line-height: var(--line-height-normal);
  font-weight: var(--serif-weight-regular);
  color: var(--text-default);
  margin-top: 0;
  margin-bottom: var(--spacing-12);
}

/* Last child: remove bottom margin */
.project-info:last-of-type .project-info__value {
  margin-bottom: 0;
}
```

#### 2.3 Uppdatera HTML

**EFTER:**
```html
<div class="project-info">
  <h3 class="project-info__label">
    Client
  </h3>
  <p class="project-info__value">
    {{ .Params.client }}
  </p>
</div>
```

**Resultat:** Från 14 klasser → 2 klasser (86% minskning!)

### Fas 3: Breadcrumb Navigation

**Filer:**
- `layouts/partials/application-breadcrumb.html`
- `assets/css/components/breadcrumb.css`

#### 3.1 Nuvarande tillstånd

**FÖRE (HTML):**
```html
<nav class="application-breadcrumb flex text-sm mb-24 show-on-client">
  <li class="application-breadcrumb__item text-capitalize">
    <a class="application-breadcrumb__link" href="/">Home</a>
  </li>
  <li class="application-breadcrumb__item text-color-lighter">Current</li>
</nav>
```

#### 3.2 CSS-uppdatering

**Fil:** `assets/css/components/breadcrumb.css`

**LÄGG TILL:**
```css
.application-breadcrumb {
  display: flex;
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-24);
}

.application-breadcrumb__item {
  text-transform: capitalize;
  color: var(--text-default);
}

.application-breadcrumb__item:not(:last-child)::after {
  /* Separator styling om det finns */
}

/* Last item (current page) */
.application-breadcrumb__item:last-child {
  color: var(--text-lighter);
}

.application-breadcrumb__link {
  /* Link styling */
  color: inherit;
}
```

#### 3.3 HTML-uppdatering

**EFTER:**
```html
<nav class="application-breadcrumb show-on-client">
  <li class="application-breadcrumb__item">
    <a class="application-breadcrumb__link" href="/">Home</a>
  </li>
  <li class="application-breadcrumb__item">Current</li>
</nav>
```

### Fas 4: Contact Form

**Fil:** `layouts/partials/contact_form.html`

#### 4.1 Nuvarande tillstånd

**FÖRE:**
```html
<div class="contact-form mt-80 mb-64 col-start-1 col-span-6">
  <h2 class="contact-form__title type-headline-3 mb-16">
    {{ i18n "contactFormTitle" }}
  </h2>
  <input class="contact-form__input form-input mb-8" />
  <p class="contact-form__note type-information mb-16 text-color-lighter">
    This site is protected by reCAPTCHA...
  </p>
  <button class="button--icon text-lg font-sans font-medium">
    {{ i18n "contactFormSubmit" }}
  </button>
</div>
```

#### 4.2 CSS-uppdatering

**Fil:** `assets/css/components/form.css`

**LÄGG TILL:**
```css
.contact-form {
  margin-top: var(--spacing-80);
  margin-bottom: var(--spacing-64);
}

.contact-form__title {
  margin-bottom: var(--spacing-16);
}

.contact-form__input {
  margin-bottom: var(--spacing-8);
}

.contact-form__note {
  margin-bottom: var(--spacing-16);
  color: var(--text-lighter);
}

/* Button text inom contact-form */
.contact-form .button--icon {
  font-size: var(--text-lg);
  font-family: var(--font-sans);
  font-weight: var(--sans-weight-medium);
}
```

#### 4.3 HTML-uppdatering

**EFTER:**
```html
<div class="contact-form col-start-1 col-span-6">
  <h2 class="contact-form__title type-headline-3">
    {{ i18n "contactFormTitle" }}
  </h2>
  <input class="contact-form__input form-input" />
  <p class="contact-form__note type-information">
    This site is protected by reCAPTCHA...
  </p>
  <button class="button--icon">
    {{ i18n "contactFormSubmit" }}
  </button>
</div>
```

**OBS:** `col-start-1 col-span-6` behålls eftersom grid-placering varierar per layout.

### Fas 5: About CV Section

**Fil:** `layouts/partials/about_cv.html`

#### 5.1 Nuvarande tillstånd

**FÖRE:**
```html
<div class="about-cv mt-64 reveal">
  <div class="about-cv__icon curl-icon mb-8"></div>
  <h3 class="about-cv__title mb-32 type-headline-3">What I've been up to</h3>
  <div class="about-cv__section reveal">
    <h4 class="about-cv__heading type-headline-small mb-16">Work</h4>
    <p class="about-cv__text type-body-sm mb-32">Content...</p>
  </div>
</div>
```

#### 5.2 CSS-uppdatering

**Fil:** `assets/css/components/about-cv.css` (eller lägg till i befintlig about.css)

```css
.about-cv {
  margin-top: var(--spacing-64);
}

.about-cv__icon {
  margin-bottom: var(--spacing-8);
}

.about-cv__title {
  margin-bottom: var(--spacing-32);
}

.about-cv__heading {
  margin-bottom: var(--spacing-16);
}

.about-cv__text {
  margin-bottom: var(--spacing-32);
}

/* Last text: no bottom margin */
.about-cv__section:last-of-type .about-cv__text:last-child {
  margin-bottom: 0;
}
```

#### 5.3 HTML-uppdatering

**EFTER:**
```html
<div class="about-cv reveal">
  <div class="about-cv__icon curl-icon"></div>
  <h3 class="about-cv__title type-headline-3">What I've been up to</h3>
  <div class="about-cv__section reveal">
    <h4 class="about-cv__heading type-headline-small">Work</h4>
    <p class="about-cv__text type-body-sm">Content...</p>
  </div>
</div>
```

### Fas 6: Table of Contents (TOC)

**Fil:** Olika page templates (works/single.html, writing/single.html)

#### 6.1 Nuvarande tillstånd

**FÖRE:**
```html
<ul class="toc mt-64 mb-64 col-span-12 show-on-client reveal">
  <li class="toc__item font-sans text-base text-color-lighter">
    <a href="#section">Link</a>
  </li>
</ul>
```

#### 6.2 CSS-uppdatering

**Fil:** `assets/css/components/table-of-contents.css`

```css
.toc {
  margin-top: var(--spacing-64);
  margin-bottom: var(--spacing-64);
}

.toc__item {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--text-lighter);
}

.toc__item a {
  color: inherit;
  /* Hover states, etc. */
}
```

#### 6.3 HTML-uppdatering

**EFTER:**
```html
<ul class="toc col-span-12 show-on-client reveal">
  <li class="toc__item">
    <a href="#section">Link</a>
  </li>
</ul>
```

### Fas 7: Återstående komponenter

Efter pilot-implementationerna (Fas 1-6), applicera samma mönster på:

#### Prioritetslista:
1. **Article card** - Liknande summary-card
2. **Download card** - Typography + spacing
3. **Tags** - Small typography
4. **Newsletter** - Form styling
5. **Pagination** - Navigation styling
6. **Gallery** - Minimal text, mest layout
7. **Tooltip** - Minimal utilities

#### Process per komponent:
1. Identifiera alla användningar (grep/search)
2. Uppdatera komponent-CSS med defaults
3. Förenkla HTML
4. Testa visuellt
5. Commit

### Fas 8: Global Cleanup

#### 8.1 Identifiera återstående utility-användningar

```bash
# Sök efter vanliga typography utilities i HTML
grep -r "text-xs\|text-sm\|text-base\|text-lg\|text-xl\|text-2xl" layouts/ | wc -l
grep -r "font-sans\|font-serif\|font-mono" layouts/ | wc -l
grep -r "font-normal\|font-medium\|font-bold" layouts/ | wc -l
grep -r "line-height-" layouts/ | wc -l
grep -r "tracking-" layouts/ | wc -l
```

#### 8.2 Edge cases och one-offs

För element som förekommer 1-2 gånger:
- **Låt bli att skapa nya komponenter**
- **Använd type-klasser + inline overrides där nödvändigt**

**Exempel (OK att behålla utilities):**
```html
<!-- Unik text på startsida - OK med utilities -->
<p class="hero-tagline type-lead text-color-accent">
  Unique text
</p>
```

#### 8.3 Utvärdera utilities för borttagning

**BEHÅLL DESSA (används aktivt):**
- `mt-*`, `mb-*` - Spacing varierar per kontext
- `col-span-*`, `col-start-*` - Grid layout
- `reveal`, `reveal--delay` - Animations
- `hide-on-*`, `show-on-*` - Conditional display
- `text-color-lighter`, `text-color-accent` - Color overrides

**UTVÄRDERA FÖR BORTTAGNING:**
Efter migrationen, kolla användningen:

```bash
# Räkna användningar
grep -r "\.text-xs\|\.text-sm\|\.text-base" layouts/ | wc -l

# Om < 5 användningar kvar, överväg att ta bort utility:n
```

**Kriterium för borttagning:**
- Om utility används < 5 gånger EFTER migrationen
- Och användningarna kan lösas med type-klasser eller komponent-CSS
- Då kan utility:n tas bort från `assets/css/utilities/typography.css`

**OBS:** Ta INTE bort utilities omedelbart. Vänta 2-4 veckor efter migrationen.

## Riktlinjer för framtida utveckling

### När ska jag använda utilities?

✅ **Använd utilities för:**
1. **Spacing som varierar** - `mt-24` på vissa ställen, `mt-64` på andra
2. **Grid/layout positioning** - `col-span-8` vs `col-span-6`
3. **Conditional display** - `show-on-client`, `hide-on-employer`
4. **Animations** - `reveal`, `reveal--delay`
5. **Color overrides** - `text-color-lighter` när komponenten normalt har `text-default`

❌ **Använd INTE utilities för:**
1. **Typography som är konsistent** - samma font-size/weight/line-height varje gång
2. **Default colors** - `text-color-default` är default, behövs inte
3. **Component-specific styling** - bör vara i komponent-CSS

### När ska jag skapa en ny semantic class?

Skapa en ny `.type-*` klass om:
1. Kombinationen används 3+ gånger
2. Den representerar en semantisk texttyp (rubrik, caption, meta, etc.)
3. Den behöver vara responsive (clamp)

**Exempel:**
```css
/* BRA: Semantic + återanvändbar */
.type-quote {
  font-family: var(--font-serif);
  font-size: clamp(var(--text-xl), calc(1.167rem + 0.417vw), var(--text-3xl));
  font-style: italic;
  color: var(--text-lighter);
  line-height: var(--line-height-normal);
}
```

### När ska jag lägga styling i komponent-CSS?

Lägg styling i komponent-CSS om:
1. Stylingen är specifik för komponenten (t.ex. `.summary-card__title`)
2. Den är konsistent inom komponenten (alltid samma)
3. Den inte är en override/variation

**Exempel:**
```css
/* BRA: Komponent äger sin styling */
.download-card__filename {
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  color: var(--text-default);
  /* Alltid samma inom download-card */
}
```

## Verifieringschecklista

### Pre-migration
- [ ] Backup av master branch skapad
- [ ] Feature branch skapad: `feature/utility-cleanup-migration`
- [ ] Hugo dev server fungerar
- [ ] All nuvarande styling dokumenterad (screenshots)

### Per fas (repetera för varje komponent)
- [ ] Komponent-CSS uppdaterad med defaults
- [ ] HTML-mallar förenklade
- [ ] Visuell testning (desktop + mobil)
- [ ] Inga regressioner identifierade
- [ ] Git commit skapad

### Post-migration (alla faser klara)
- [ ] Utility-användning reducerad med >50%
- [ ] Alla sidor testade på 3 breakpoints
- [ ] Inga visuella regressioner
- [ ] TypeScript/Linting errors åtgärdade (om relevanta)
- [ ] Performance check (Lighthouse score oförändrad)
- [ ] Accessibility check (ingen försämring)

### Cleanup (2-4 veckor efter deploy)
- [ ] Räkna återstående utility-användningar
- [ ] Identifiera oanvända utilities (< 5 användningar)
- [ ] Överväg borttagning av oanvända utilities
- [ ] Dokumentera beslut

## Rollback-strategi

### Under migration (per fas)

Om problem upptäcks i en fas:

```bash
# 1. Återställ senaste commit
git reset --hard HEAD~1

# 2. Eller återställ specifik fil
git checkout HEAD -- layouts/partials/component.html

# 3. Testa igen
hugo server
```

### Efter deploy (produktion)

Om problem upptäcks i produktion:

```bash
# 1. Identifiera problematisk commit
git log --oneline

# 2. Revert specifik commit
git revert <commit-hash>

# 3. Eller återgå till före migrationen
git revert <first-migration-commit>..<last-migration-commit>

# 4. Deploy hotfix
git push origin master
```

### Emergency rollback

```bash
# Fullständig rollback till före migrationen
git checkout <commit-before-migration>
git checkout -b emergency-rollback
git push origin emergency-rollback --force

# Deploy emergency branch
```

### Partial rollback (endast vissa komponenter)

Om endast en komponent är problematisk:

```bash
# Återställ endast den komponentens filer
git checkout <commit-before-migration> -- layouts/partials/problematic-component.html
git checkout <commit-before-migration> -- assets/css/components/problematic-component.css

# Commit och push fix
git commit -m "fix: rollback problematic-component to previous state"
git push
```

## Förväntade resultat

### Kvantitativa förbättringar

| Metric | Före | Efter | Förbättring |
|--------|------|-------|-------------|
| Klasser per element (snitt) | 5-7 | 2-3 | -57% till -71% |
| Total utility-användningar | 477 | ~150 | -69% |
| Typography utilities i HTML | 96 | ~10 | -90% |
| HTML storlek (compressed) | Baseline | -10-15% | Mindre payload |
| CSS storlek | Baseline | +5-10% | Mer komponent-CSS |
| **Total payload** | Baseline | **-5-10%** | **Netto minskning** |

### Kvalitativa förbättringar

✅ **Bättre läsbarhet**
- HTML beskriver struktur, inte utseende
- Enklare att förstå komponenthierarki
- Mindre "noise" i markup

✅ **Enklare underhåll**
- Ändra styling på ett ställe (CSS) istället för 20 HTML-filer
- Mindre risk för inkonsistens
- Tydligare separation of concerns

✅ **Snabbare utveckling**
- Mindre att skriva i HTML
- Autocomplete fungerar bättre (färre klasser)
- Nya komponenter följer etablerade mönster

✅ **Bättre design system**
- Semantiska type-klasser är självdokumenterande
- Konsistens framtvingas av CSS-defaults
- Variationer är explicit (color overrides)

### Potentiella risker och mitigations

| Risk | Sannolikhet | Impact | Mitigation |
|------|-------------|--------|------------|
| Visuella regressioner | Medel | Hög | Noggrann testning per fas |
| Breaking changes i produktion | Låg | Hög | Feature branch + staging deploy |
| Performance-försämring | Mycket låg | Medel | Lighthouse check före/efter |
| Accessibility-regression | Låg | Hög | A11y audit efter migration |
| Komponent-CSS blir för specifik | Medel | Låg | Följ riktlinjer för när utilities ska användas |

## Tidsestimering

**Viktigt:** Detta är INTE deadlines, endast uppskattningar för planering.

| Fas | Uppskattad insats | Beroenden |
|-----|------------------|-----------|
| Fas 0: Förberedelser | 1-2 timmar | Ingen |
| Fas 1: Summary Card | 2-3 timmar | Fas 0 |
| Fas 2: Project Info | 1 timme | Fas 1 |
| Fas 3: Breadcrumb | 1 timme | Fas 1 |
| Fas 4: Contact Form | 1 timme | Fas 1 |
| Fas 5: About CV | 1 timme | Fas 1 |
| Fas 6: TOC | 1 timme | Fas 1 |
| Fas 7: Återstående komponenter | 4-6 timmar | Fas 1-6 |
| Fas 8: Global Cleanup | 2-3 timmar | Fas 7 |
| **Total** | **14-20 timmar** | - |

**Rekommendation:** Gör 1-2 faser per dag under 2 veckor. Låt inte migrationen blockera annat arbete.

## Exempel: Före & Efter (Fullständig sida)

### Works Detail Page - Före migration

```html
<div class="content post use-subgrid">
  <nav class="application-breadcrumb flex text-sm mb-24 show-on-client">
    <li class="application-breadcrumb__item text-capitalize">
      <a class="application-breadcrumb__link" href="/works/">Works</a>
    </li>
    <li class="application-breadcrumb__item text-color-lighter">Project Title</li>
  </nav>

  <h1 class="type-headline-1 mt-0 mb-0 reveal">Project Title</h1>
  <h2 class="type-caption mb-16 mt-16 reveal">Project tagline here</h2>

  <div class="project-info mb-48 col-start-1 col-span-4">
    <h3 class="project-info__label text-xs font-sans font-normal text-color-lighter tracking-wider text-uppercase mb-8">
      Client
    </h3>
    <p class="project-info__value text-sm font-serif line-height-normal font-normal text-color-default mt-0 mb-12">
      Acme Corp
    </p>
  </div>

  <ul class="toc mt-64 mb-64 col-span-12 show-on-client reveal">
    <li class="toc__item font-sans text-base text-color-lighter">
      <a href="#overview">Overview</a>
    </li>
  </ul>
</div>
```

**Total: 35 CSS-klasser**

### Works Detail Page - Efter migration

```html
<div class="content post use-subgrid">
  <nav class="application-breadcrumb show-on-client">
    <li class="application-breadcrumb__item">
      <a class="application-breadcrumb__link" href="/works/">Works</a>
    </li>
    <li class="application-breadcrumb__item">Project Title</li>
  </nav>

  <h1 class="type-headline-1 reveal">Project Title</h1>
  <h2 class="type-caption reveal">Project tagline here</h2>

  <div class="project-info col-start-1 col-span-4">
    <h3 class="project-info__label">Client</h3>
    <p class="project-info__value">Acme Corp</p>
  </div>

  <ul class="toc col-span-12 show-on-client reveal">
    <li class="toc__item">
      <a href="#overview">Overview</a>
    </li>
  </ul>
</div>
```

**Total: 14 CSS-klasser (60% minskning!)**

### Vad försvann?

❌ **Typography utilities** (flyttade till CSS):
- `text-xs`, `text-sm`, `text-base`
- `font-sans`, `font-serif`
- `font-normal`
- `line-height-normal`
- `tracking-wider`, `tracking-normal`
- `text-uppercase`, `text-capitalize`

❌ **Default spacing** (flyttade till CSS):
- `mt-0`, `mt-16`
- `mb-0`, `mb-8`, `mb-12`, `mb-16`, `mb-24`, `mb-48`, `mb-64`

❌ **Default colors** (flyttade till CSS):
- `text-color-default` (är default)
- `text-color-lighter` (nu i `.application-breadcrumb__item:last-child`)

✅ **Vad behölls?**
- `use-subgrid`, `col-span-*` - Grid layout (varierar)
- `show-on-client`, `reveal` - Conditional/animations
- `type-headline-1`, `type-caption` - Semantic types

## Nästa steg

Efter godkännande av denna plan:

1. **Skapa feature branch**
   ```bash
   git checkout -b feature/utility-cleanup-migration
   ```

2. **Börja med Fas 0** (förberedelser)
   - Skapa backup
   - Dokumentera nuläge (screenshots)

3. **Implementera Fas 1** (pilot med summary-card)
   - Uppdatera CSS
   - Uppdatera HTML
   - Testa noggrant

4. **Utvärdera efter Fas 1**
   - Om framgångsrik → fortsätt med Fas 2-8
   - Om problem → justera approach

5. **Deploy till staging**
   - Fullständig testning
   - Performance check
   - Accessibility audit

6. **Merge till master**
   - Endast efter godkänd staging-testning

## Frågor och svar

### Q: Vad händer med befintliga type-klasser som type-headline-1?
**A:** De behålls 100%! De är grunden i det nya systemet.

### Q: Kan jag fortfarande använda utilities för spacing?
**A:** Ja! `mt-*` och `mb-*` är perfekt när spacing varierar. Endast när spacing ALLTID är samma flyttas det till CSS.

### Q: Vad händer om jag behöver en one-off style?
**A:** Använd en utility eller lägg till en modifier-klass. Skapa inte en ny komponent för enstaka användningar.

### Q: Kommer CSS-filen att bli mycket större?
**A:** +5-10% större CSS, men -10-15% mindre HTML. Totalt blir payload mindre pga HTML komprimerar sämre än CSS.

### Q: Hur vet jag om jag ska använda en utility eller komponent-CSS?
**A:** Se "Riktlinjer för framtida utveckling" ovan. Tumregel: Varierar det? → Utility. Alltid samma? → CSS.

### Q: Kan jag göra migrationen gradvis över flera månader?
**A:** Ja! Gamla och nya mönster kan samexistera. Start med Fas 1, vänta, fortsätt när du vill.

---

**Dokumentversion:** 1.0
**Senast uppdaterad:** 2026-01-20
**Författare:** Claude (AI-assistent)
**Status:** Redo för review
