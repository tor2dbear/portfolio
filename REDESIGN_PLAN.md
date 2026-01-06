# Redesign Plan - tor-bjorn.com

## Översikt
Större redesign som flyttar navigeringen från sidomeny till header och footer, förbättrar användarupplevelsen på mindre skärmar, och konsoliderar innehåll på startsidan.

## Designprinciper
- Ingen hamburgemeny - allt ska få plats även på mindre skärmar
- Max-width för innehåll för bättre läsbarhet
- Konsoliderad navigation i header och footer
- Startsida som huvudsaklig innehållspunkt

---

## 1. HEADER NAVIGATION - STÖRRE OMBYGGNAD

### 1.1 Ta bort sidomeny
**Filer att modifiera:**
- [layouts/partials/header.html](layouts/partials/header.html)
- [layouts/partials/sidemenu.html](layouts/partials/sidemenu.html) - DEPRECATE/ARCHIVE

**Åtgärder:**
- Ta bort `{{ partial "sidemenu.html" . }}` från header.html
- Flytta sidemenu.html till arkiv-mapp eller markera som deprecated
- Uppdatera CSS för att ta bort sidebar-layout (main container behöver ej längre offset)

**CSS-filer att uppdatera:**
- [assets/css/style.css](assets/css/style.css) - Ta bort `.sidemenu` och relaterade grid-definitioner
- Justera `.main` och `.layout` för full-width layout

### 1.2 Utökad top menu struktur
**Fil:** [layouts/partials/topmenu.html](layouts/partials/topmenu.html)

**Ny struktur (vänster till höger):**
```
[Logo] [Nav Links: Home | About | Contact Button] [Theme Dropdown | Language Dropdown]
```

**Komponenter att lägga till/modifiera:**

#### A. Navigation Links
- Home (ny länk till `/`)
- About (flyttad från menu.top, vanlig länk)
- Contact (flyttad från menu.top, **styled som button**)

#### B. Contact Button Styling
**Ny CSS-klass:** `.contact-button`
- Primary färg från semantic tokens
- Padding och border-radius
- Hover/focus states
- Responsiv sizing

#### C. Kombinerad Theme Dropdown
**Nuvarande implementation:** Lines 17-258 i topmenu.html

**Ny struktur:**
```html
<div class="theme-dropdown">
  <button class="theme-toggle" aria-label="Theme settings">
    <!-- SVG icon som uppdateras baserat på vald mode -->
  </button>

  <div class="theme-panel">
    <!-- Sektion 1: Mode -->
    <div class="theme-section">
      <span class="theme-section-label">{{ i18n "mode" }}</span>
      <button data-mode="light">
        <svg>...</svg> Light
      </button>
      <button data-mode="dark">
        <svg>...</svg> Dark
      </button>
      <button data-mode="system">
        <svg>...</svg> System
      </button>
    </div>

    <!-- Divider -->
    <hr class="theme-divider">

    <!-- Sektion 2: Palette -->
    <div class="theme-section">
      <span class="theme-section-label">{{ i18n "palette" }}</span>
      <div class="palette-options">
        <button data-palette="standard" class="palette-circle">
          <!-- Färgcirkel med primary + background för standard -->
          <span class="palette-preview" style="--primary: var(--color-primary-standard); --bg: var(--color-bg-standard)"></span>
          <span class="palette-label">Standard</span>
        </button>
        <button data-palette="pantone" class="palette-circle">
          <!-- Färgcirkel med primary + background för pantone -->
          <span class="palette-preview" style="--primary: var(--color-primary-pantone); --bg: var(--color-bg-pantone)"></span>
          <span class="palette-label">Pantone</span>
        </button>
      </div>
    </div>
  </div>
</div>
```

**CSS-filer att skapa/uppdatera:**
- Ny fil: [assets/css/components/theme-dropdown.css](assets/css/components/theme-dropdown.css)
- Palette circle styles med gradient eller split design
- `.palette-preview` - visuell representation av färgkombinationen
- Responsiv layout för dropdown

**JavaScript-ändringar - KONSOLIDERA I EN FIL:**
- [assets/js/darkmode.js](assets/js/darkmode.js) - **DEFINITIV ÄGARE** för all theme/palette logic
- **TA BORT/ARKIVERA:** [assets/js/theme.js](assets/js/theme.js) - logiken flyttas helt till darkmode.js
- Undvik dubbla event listeners genom att ha en enda källa

**Persistensstrategi (KRITISKT):**
```javascript
// Spara i localStorage
localStorage.setItem('theme-mode', mode); // 'light', 'dark', 'system'
localStorage.setItem('theme-palette', palette); // 'standard', 'pantone'

// Applicera på <html> via data-attributes
document.documentElement.setAttribute('data-mode', mode);
document.documentElement.setAttribute('data-palette', palette);

// CSS läser dessa:
// html[data-mode="dark"][data-palette="pantone"] { ... }
```

**Nya selectors i darkmode.js:**
- Mode buttons: `button[data-mode]`
- Palette buttons: `button[data-palette]`
- Theme panel: `.theme-panel`
- Toggle button: `.theme-toggle`

**Uppdaterad darkmode.js struktur:**
1. Load saved preferences från localStorage
2. Apply både mode + palette till `data-mode` och `data-palette`
3. Update SVG icon baserat på mode
4. Event listeners för mode buttons
5. Event listeners för palette buttons
6. Panel toggle logic (öppna/stänga)
7. System preference listener (för mode=system)

#### D. Language Dropdown (NY KOMPONENT)
**Ny fil:** [layouts/partials/language-dropdown.html](layouts/partials/language-dropdown.html)

**VIKTIGT:** Endast visa om flera språk finns: `{{ if gt (len .Site.Languages) 1 }}`

**Struktur (använd <a> istället för <button> för bättre semantik och fallback):**
```html
{{ if gt (len .Site.Languages) 1 }}
<div class="language-dropdown">
  <button class="language-toggle" aria-label="Change language" aria-expanded="false">
    <svg class="language-icon"><!-- Globe/language icon --></svg>
    <span class="current-language">{{ .Language.Lang | upper }}</span>
  </button>

  <div class="language-panel" hidden>
    <!-- Nuvarande språk -->
    <a href="{{ .Permalink }}"
       class="language-option"
       data-lang="{{ .Language.Lang }}"
       aria-current="page">
      <svg class="flag-{{ .Language.Lang }}"><!-- Flag icon --></svg>
      {{ .Language.LanguageName }}
    </a>

    <!-- Översättningar -->
    {{ range .Translations }}
      <a href="{{ .Permalink }}"
         class="language-option"
         data-lang="{{ .Language.Lang }}"
         hreflang="{{ .Language.Lang }}">
        <svg class="flag-{{ .Language.Lang }}"><!-- Flag icon --></svg>
        {{ .Language.LanguageName }}
      </a>
    {{ end }}

    <!-- Fallback om ingen översättning finns för aktuell sida -->
    {{ if eq (len .Translations) 0 }}
      {{ range .Site.Languages }}
        {{ if ne . $.Language }}
          <a href="{{ "/" | relLangURL }}"
             class="language-option language-option--fallback"
             data-lang="{{ .Lang }}"
             hreflang="{{ .Lang }}">
            <svg class="flag-{{ .Lang }}"><!-- Flag icon --></svg>
            {{ .LanguageName }}
            <span class="language-note">({{ i18n "to_homepage" }})</span>
          </a>
        {{ end }}
      {{ end }}
    {{ end }}
  </div>
</div>
{{ end }}
```

**Navigationsstrategi:**
1. Om översättning finns (.Translations): Länka direkt till översatt sida
2. Om ingen översättning: Länka till startsida i valt språk med note "(to homepage)"
3. Använd `<a>` med `href` - ingen JS-navigering behövs (progressiv enhancement)

**CSS:**
- Samma dropdown-stil som theme switcher för konsistens
- [assets/css/components/language-dropdown.css](assets/css/components/language-dropdown.css)
- `.language-option--fallback` - visuell indikator för fallback länkar

**JavaScript:**
- Ny fil: [assets/js/language-dropdown.js](assets/js/language-dropdown.js)
- ENDAST dropdown toggle logic (öppna/stänga panel)
- Ingen navigation logic - använd native <a> href
- Pattern från darkmode.js för toggle behavior
- ARIA attribute updates (aria-expanded)

#### E. Responsiv strategi (INGEN HAMBURGARE)
**Breakpoints att testa:**
- Desktop (>1024px): Full layout
- Tablet (768-1024px): Mindre padding, kompaktare dropdowns
- Mobile (320-768px): Stacked/wrapped navigation, ikoner utan text

**Tekniker:**
- Flexbox wrap för navigation items
- Prioriterad layout: Logo först, viktiga länkar, sedan dropdowns
- Icon-only mode för små skärmar (med aria-labels)
- Använd `.text-truncate` för långa labels

**KONKRET 320px Layout-strategi:**
```
Row 1: [Logo (flex-grow)] [Theme Icon] [Language Icon]
Row 2: [Home Icon] [About Icon] [Contact Button (full-width eller wrappat)]
```

**Flexbox order för prioritering:**
- Logo: order: 1
- Theme dropdown: order: 5
- Language dropdown: order: 6
- Home: order: 2
- About: order: 3
- Contact: order: 4

**CSS Media Queries:**
```css
/* Tablet */
@media (max-width: 1024px) {
  .topmenu__nav {
    gap: var(--space-sm);
  }

  .nav-link {
    font-size: var(--font-size-sm);
  }
}

/* Mobile - wrapping layout */
@media (max-width: 768px) {
  .topmenu__nav {
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .nav-link-text {
    display: none; /* Visa bara ikoner */
  }

  .contact-button {
    padding: 0.5rem 0.75rem; /* Mindre button */
    font-size: var(--font-size-sm);
  }

  /* Dropdowns: icon-only */
  .theme-toggle .current-language,
  .language-toggle .current-language {
    display: none;
  }
}

/* Very small mobile */
@media (max-width: 480px) {
  .topmenu__container {
    padding: var(--space-xs);
  }

  /* Contact button kan få egen rad */
  .contact-button {
    flex: 1 1 100%;
    order: 10;
  }
}

/* Critical: 320px specific */
@media (max-width: 360px) {
  .brand {
    font-size: var(--font-size-sm);
  }

  .topmenu__nav {
    justify-content: space-between;
    width: 100%;
  }
}
```

**UX-beslut för startsidan:**
- "Home" länken: Dölj med CSS när `body.home` class finns
- Detta sparar plats på den sida där den är minst användbar

**Filer att uppdatera:**
- [assets/css/components/topmenu.css](assets/css/components/topmenu.css) (eller inkluderat i style.css)
- Ta bort all hamburger-meny logik från [assets/js/ui.js](assets/js/ui.js)

---

## 2. FOOTER - NY MULTI-KOLUMN LAYOUT

### 2.1 Ny footer struktur
**Fil:** [layouts/partials/footer.html](layouts/partials/footer.html)

**Nuvarande:** Enkel wrapper och copyright
**Ny struktur:** 4 kolumner (5 på desktop om utrymme finns)

**Layout:**
```html
<footer class="footer">
  <div class="footer-container">
    <div class="footer-grid">

      <!-- Kolumn 1: Navigation -->
      <div class="footer-column">
        <h3 class="footer-heading">{{ i18n "navigation" }}</h3>
        <ul class="footer-menu">
          <li><a href="/">{{ i18n "home" }}</a></li>
          <li><a href="/#about">{{ i18n "about" }}</a></li>
          <li><a href="/#contact">{{ i18n "contact" }}</a></li>
        </ul>
      </div>

      <!-- Kolumn 2: Kategorier/Tags -->
      <div class="footer-column">
        <h3 class="footer-heading">{{ i18n "categories" }}</h3>
        <ul class="footer-menu">
          <li><a href="/tags/">{{ i18n "all_works" }}</a></li>
          {{/* Begränsa till 8 tags, sorterade alfabetiskt */}}
          {{ $tags := slice }}
          {{ range $name, $taxonomy := .Site.Taxonomies.tags }}
            {{ $tags = $tags | append (dict "name" $name "count" (len $taxonomy)) }}
          {{ end }}
          {{ range first 8 (sort $tags "name" "asc") }}
            {{ with $.Site.GetPage (printf "/tags/%s" .name) }}
              <li><a href="{{ .Permalink }}">{{ lower .Title }}</a></li>
            {{ end }}
          {{ end }}
        </ul>
      </div>

      <!-- Kolumn 3: Social & Newsletter -->
      <div class="footer-column">
        <h3 class="footer-heading">{{ i18n "connect" }}</h3>
        <ul class="footer-menu">
          {{ range .Site.Menus.social }}
            <li>
              <a href="{{ .URL }}"
                 {{ if strings.HasPrefix .URL "http" }}target="_blank" rel="noopener noreferrer"{{ end }}
                 aria-label="{{ .Name }}{{- if strings.HasPrefix .URL "http" }} (opens in new window){{ end -}}">
                {{ .Name }}
              </a>
            </li>
          {{ end }}
        </ul>
      </div>

      <!-- Kolumn 4: Info -->
      <div class="footer-column">
        <h3 class="footer-heading">{{ i18n "info" }}</h3>
        <ul class="footer-menu">
          <li><a href="/newsletter/">Newsletter</a></li>
          <li><a href="/rss.xml">RSS</a></li>
        </ul>
        {{ partial "copyright.html" . }}
      </div>

    </div>
  </div>
</footer>
```

### 2.2 Footer CSS
**Ny fil:** [assets/css/components/footer.css](assets/css/components/footer.css)

**Nyckelelement:**
```css
.footer {
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  padding: var(--space-xl) 0;
  margin-top: var(--space-2xl);
}

.footer-container {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0 var(--space-md);
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-xl);
}

@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: repeat(2, 1fr); /* 2 kolumner på mobil */
    gap: var(--space-lg);
  }
}

@media (max-width: 480px) {
  .footer-grid {
    grid-template-columns: 1fr; /* 1 kolumn på mycket små skärmar */
  }
}
```

### 2.3 Migrera innehåll från sidomeny
**Källfil:** [layouts/partials/sidemenu.html](layouts/partials/sidemenu.html)

**Att flytta till footer:**
- Tags menu (lines från tags_menu.html) → Kategorier kolumn
- Social links (från social.html partial) → Social kolumn
- "All works" länk → Kategorier kolumn

**Att flytta till header:**
- Theme settings (language + palette) → Har redan flyttats

**Att arkivera/ta bort:**
- Start menu (redundant med header nav)
- Top menu duplicate (fanns för mobil)

---

## 3. STARTSIDA - UTÖKAD MED "OM MIG" OCH "KONTAKT"

### 3.1 Ny startsida layout
**Fil:** [layouts/index.html](layouts/index.html)

**Nuvarande struktur:**
1. Header
2. Startpage partial (heading + CTA)
3. Featured works (6 st)
4. Subscribe section
5. Footer

**Ny struktur:**
```html
{{ define "main" }}
<div class="home-page">

  <!-- Hero/Intro -->
  <section id="hero" class="home-section hero-section">
    {{ partial "startpage.html" . }}
  </section>

  <!-- Featured Works -->
  <section id="works" class="home-section works-section">
    <h2 class="section-heading">{{ i18n "featured_works" }}</h2>
    <div class="works-grid">
      {{ range first 6 (where (where (where .Site.RegularPages "Type" "works") ".Params.featured" "=" true) ".Params.hidden" "!=" true) }}
        {{ .Render "summary" }}
      {{ end }}
    </div>
  </section>

  <!-- OM MIG - NY SEKTION -->
  <section id="about" class="home-section about-section">
    <h2 class="section-heading">{{ i18n "about_me" }}</h2>
    <div class="about-content">
      {{ with .Site.GetPage "/about" }}
        <!-- Importera innehåll från about-sidan -->
        {{ .Content }}
        <!-- ELLER använd shortcodes direkt: -->
        {{ partial "shortcodes/about_main" (dict "lang" $.Language.Lang) }}
      {{ end }}
    </div>
  </section>

  <!-- KONTAKT - NY SEKTION -->
  <section id="contact" class="home-section contact-section">
    <h2 class="section-heading">{{ i18n "contact_me" }}</h2>
    <div class="contact-content">
      {{ with .Site.GetPage "/contact" }}
        {{ .Content }}
        <!-- ELLER använd shortcodes: -->
        {{ partial "shortcodes/contact_info.html" $ }}
        {{ partial "shortcodes/contact_form.html" $ }}
      {{ end }}
    </div>
  </section>

  <!-- Subscribe/Newsletter -->
  <section id="subscribe" class="home-section subscribe-section">
    {{ partial "subscribe.html" . }}
  </section>

</div>
{{ end }}
```

### 3.2 Innehåll från about/contact sidor

**VIKTIGT - Multilingual GetPage:**
Hugo's `.Site.GetPage` är språkmedveten när content ligger i `content/english/` och `content/swedish/`.
GetPage returnerar automatiskt rätt språkversion baserat på aktuell sidkontext.

**Alternativ A - Importera från befintliga sidor (RISK för dubbel wrapper):**
```go
{{ with .Site.GetPage "/about" }}
  {{ .Content }}  {{/* Kan innehålla extra <div> wrappers */}}
{{ end }}
```

**Alternativ B - Återanvänd shortcodes (REKOMMENDERAT):**
```go
<!-- Om mig sektion -->
{{ $aboutShortcode := printf "about_main_%s.html" .Language.Lang }}
{{ partial (printf "shortcodes/%s" $aboutShortcode) . }}

<!-- Kontakt sektion -->
{{ partial "shortcodes/contact_info.html" . }}
{{ partial "shortcodes/contact_form.html" . }}
```

**Filer som används:**
- [layouts/shortcodes/about_main_en.html](layouts/shortcodes/about_main_en.html)
- [layouts/shortcodes/about_main_sv.html](layouts/shortcodes/about_main_sv.html)
- [layouts/shortcodes/contact_form.html](layouts/shortcodes/contact_form.html)
- [layouts/shortcodes/contact_info.html](layouts/shortcodes/contact_info.html)

**Rekommendation:** Alternativ B för:
- Bättre kontroll över HTML-struktur
- Undvika dubbla wrappers
- Enklare CSS-targeting
- Mindre risk för layout-problem

### 3.3 CSS för nya sektioner
**Fil:** [assets/css/pages/home.css](assets/css/pages/home.css) (NY)

**Nyckelelement:**
```css
.home-page {
  max-width: var(--content-max-width); /* NY MAX-WIDTH */
  margin: 0 auto;
  padding: 0 var(--space-md);
}

.home-section {
  padding: var(--space-2xl) 0;
  scroll-margin-top: var(--header-height); /* För ankarlänkar */
}

.section-heading {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-xl);
  text-align: center;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-lg);
}

.about-content,
.contact-content {
  max-width: 800px; /* Smalare för läsbarhet */
  margin: 0 auto;
}

/* Alternerande bakgrundsfärg för sektioner */
.home-section:nth-child(even) {
  background: var(--color-bg-secondary);
  margin: 0 calc(-1 * var(--space-md));
  padding-left: var(--space-md);
  padding-right: var(--space-md);
}
```

### 3.4 Uppdatera navigation länkar
**Filer att uppdatera:**
- [config.toml](config.toml) - Uppdatera menu items:
  ```toml
  [[languages.en.menu.top]]
    name = "about"
    url = "/#about"  # Ändra från /about/

  [[languages.en.menu.top]]
    name = "contact"
    url = "/#contact"  # Ändra från /contact/
  ```

- Header navigation: Använd anchors för smooth scroll
- Footer navigation: Samma anchor länkar

### 3.5 Smooth scroll JavaScript
**Fil:** [assets/js/smooth-scroll.js](assets/js/smooth-scroll.js) (NY)

**VIKTIGT - Laddning:**
- Lägg till i [layouts/partials/head.html](layouts/partials/head.html)
- Position: I slutet av script-listan (efter UI-scripts)
- Load mode: Defer (vänta på DOM)

**Hantera både samma-sida och cross-page anchor länkar:**
```javascript
(function() {
  'use strict';

  // Smooth scroll för anchor länkar
  document.addEventListener('DOMContentLoaded', function() {
    // Endast för länkar som börjar med # ELLER är samma sida + anchor
    const anchorLinks = document.querySelectorAll('a[href*="#"]');

    anchorLinks.forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');

        // Skippa om det är en cross-page länk (innehåller både path och #)
        // men inte är till samma sida
        const url = new URL(href, window.location.href);
        const isSamePage = url.pathname === window.location.pathname ||
                           href.startsWith('#');

        if (!isSamePage) {
          // Låt browsern hantera cross-page navigation
          return;
        }

        // Extrahera anchor från href
        const hash = href.includes('#') ? href.split('#')[1] : null;
        if (!hash) return;

        const target = document.getElementById(hash);
        if (target) {
          e.preventDefault();

          // Smooth scroll
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Uppdatera URL hash utan att trigga scroll
          if (history.pushState) {
            history.pushState(null, null, '#' + hash);
          }
        }
      });
    });

    // Hantera direct hash navigation (ex: besök direkt till site.com/#about)
    if (window.location.hash) {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target) {
        // Small delay för att låta sidan ladda
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      }
    }
  });
})();
```

**Lägg till i head.html efter andra scripts:**
```html
{{ if hugo.IsProduction }}
  {{ $smoothScroll := resources.Get "js/smooth-scroll.js" | minify | fingerprint }}
  <script src="{{ $smoothScroll.RelPermalink }}" defer></script>
{{ else }}
  <script src="{{ "js/smooth-scroll.js" | relURL }}" defer></script>
{{ end }}
```

### 3.6 Behåll separata about/contact sidor
**Ingen ändring i:**
- [content/english/about/index.md](content/english/about/index.md)
- [content/english/contact/index.md](content/english/contact/index.md)

**Men:** Lägg till notice högst upp på dessa sidor:
```html
<div class="page-notice">
  <p>{{ i18n "also_on_homepage" }} <a href="/">{{ i18n "go_to_homepage" }}</a></p>
</div>
```

---

## 4. MAX-WIDTH FÖR INNEHÅLL

### 4.1 CSS Token för max-width
**Fil:** [assets/css/tokens/components.css](assets/css/tokens/components.css)

**Lägg till:**
```css
:root {
  --content-max-width: 1280px; /* Huvudinnehåll */
  --content-max-width-narrow: 800px; /* Text-tunga sidor */
  --content-max-width-wide: 1600px; /* Gallerier/portfolios */
}
```

### 4.2 Applicera på containers
**Filer att uppdatera:**

**Main layout:** [assets/css/style.css](assets/css/style.css)
```css
.main {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0 var(--space-md);
}
```

**Header:** [layouts/partials/topmenu.html](layouts/partials/topmenu.html) eller CSS
```css
.topmenu__container {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0 var(--space-md);
}
```

**Footer:** [assets/css/components/footer.css](assets/css/components/footer.css)
```css
.footer-container {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0 var(--space-md);
}
```

### 4.3 Responsiva justeringar
```css
@media (max-width: 1400px) {
  :root {
    --content-max-width: 1200px;
  }
}

@media (max-width: 1200px) {
  :root {
    --content-max-width: 100%;
  }
}
```

---

## 5. CLIENTS/EMPLOYERS SIDOR

### 5.1 Nuvarande status
**Filer:**
- [layouts/works/single.html](layouts/works/single.html)
- Conditional logic: `.hide-on-client` klass
- Breadcrumb och ToC visas endast på client pages

**Påverkan av ändringar:**
- Sidomeny finns redan INTE på dessa sidor (conditional i header.html)
- Footer kommer att läggas till automatiskt
- Header navigation kommer att vara konsistent

### 5.2 Justeringar behövs
**Fil:** [layouts/partials/header.html](layouts/partials/header.html)

**Nuvarande logik:**
```go
{{ if not (in .RelPermalink "main") }}
  {{ partial "sidemenu.html" . }}
{{ end }}
```

**Ta bort denna conditional** eftersom sidomeny inte finns längre.

**Fil:** [layouts/works/single.html](layouts/works/single.html)

**Granska och uppdatera:**
- Ta bort `.hide-on-client` klasser (inte längre relevanta)
- Säkerställ att breadcrumb och ToC fortfarande fungerar
- Testa layout utan sidebar offset

---

## 6. ARKIVERA OCH RENSA

### 6.1 Filer att arkivera/deprecate
**Skapa arkiv-mapp:** `layouts/partials/_deprecated/`

**Flytta:**
- [layouts/partials/sidemenu.html](layouts/partials/sidemenu.html)
- [layouts/partials/tags_menu.html](layouts/partials/tags_menu.html)
- [layouts/partials/theme.html](layouts/partials/theme.html) (language/palette switcher - ersatt av nya komponenter)

### 6.2 JavaScript att rensa/uppdatera
**Fil:** [assets/js/ui.js](assets/js/ui.js)
- Ta bort hamburger menu toggle logic (lines som hanterar `.menu-toggle`)

**Fil:** [assets/js/theme.js](assets/js/theme.js)
- Integrera i [assets/js/darkmode.js](assets/js/darkmode.js)
- Eller behåll om den används separat

### 6.3 CSS att rensa
**Fil:** [assets/css/style.css](assets/css/style.css)

**Ta bort:**
- `.sidemenu` och alla relaterade styles
- `.tags-menu` styles (om inte återanvänds i footer)
- Grid layout för sidebar + main
- Hamburger menu styles

**Uppdatera:**
- `.layout` - Ändra från sidebar grid till enkel container
- `.main` - Ta bort offset för sidebar
- Responsiva breakpoints som hanterade sidebar toggle

---

## 7. I18N OCH ÖVERSÄTTNINGAR

### 7.1 Nya översättningsnycklar
**Filer:** [i18n/en.toml](i18n/en.toml), [i18n/sv.toml](i18n/sv.toml)

**Lägg till:**
```toml
[mode]
other = "Mode"

[palette]
other = "Palette"

[navigation]
other = "Navigation"

[categories]
other = "Categories"

[connect]
other = "Connect"

[info]
other = "Info"

[featured_works]
other = "Featured Works"

[about_me]
other = "About Me"

[contact_me]
other = "Get in Touch"

[all_works]
other = "All Works"

[also_on_homepage]
other = "This content is also available on the homepage."

[go_to_homepage]
other = "Go to homepage"

[home]
other = "Home"

[to_homepage]
other = "to homepage"
```

**Svenska motsvarigheter:**
```toml
[mode]
other = "Läge"

[palette]
other = "Palett"

[navigation]
other = "Navigering"

[categories]
other = "Kategorier"

[connect]
other = "Kontakt"

[info]
other = "Info"

[featured_works]
other = "Utvalda projekt"

[about_me]
other = "Om mig"

[contact_me]
other = "Kontakta mig"

[all_works]
other = "Alla projekt"

[also_on_homepage]
other = "Detta innehåll finns även på startsidan."

[go_to_homepage]
other = "Gå till startsidan"

[home]
other = "Hem"

[to_homepage]
other = "till startsidan"
```

---

## 8. TESTPLAN

### 8.1 Visuell/funktionell testning

**Desktop (>1024px):**
- [ ] Header layout: Logo, nav links, contact button, theme dropdown, language dropdown
- [ ] All navigation fungerar
- [ ] Theme dropdown: mode + palette sektioner
- [ ] Language dropdown: switch mellan EN/SV
- [ ] Footer: 4 kolumner, alla länkar fungerar
- [ ] Startsida: Hero, Works, About, Contact, Subscribe sektioner
- [ ] Max-width appliceras korrekt
- [ ] Smooth scroll till ankare

**Tablet (768-1024px):**
- [ ] Header: Kompaktare layout, allt synligt
- [ ] Footer: Grid anpassar sig
- [ ] Startsida sektioner: Läsbar layout

**Mobile (320-768px):**
- [ ] Header: INGEN hamburgare, allt får plats (ev. wrapped/stacked)
- [ ] Dropdowns: Touch-friendly, stängs korrekt
- [ ] Footer: 2 kolumner eller 1 kolumn på minsta skärmar
- [ ] Startsida: Sections staplas korrekt
- [ ] Contact button: Klickbar och synlig

### 8.2 Cross-browser testning
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (desktop + iOS)
- [ ] Mobile browsers

### 8.3 Funktionell testning
- [ ] Theme switching: Alla mode + palette kombinationer
- [ ] Theme persistence: localStorage sparar och återställer korrekt
- [ ] Language switching: Översättningar fungerar
- [ ] Language fallback: Länkar till startsida när översättning saknas
- [ ] Contact form: Submit fungerar (reCAPTCHA)
- [ ] Links: Alla interna/externa länkar
- [ ] Anchor navigation: Smooth scroll till sektioner (samma sida)
- [ ] Cross-page anchors: Navigering till /#about från andra sidor
- [ ] Direct hash URL: Besök direkt till site.com/#contact fungerar
- [ ] RSS/Newsletter: Subscribe fungerar

### 8.3.1 Focus Mode testning (Client/Employer sidor)
**KRITISKT - Testa efter sidomeny borttagning:**
- [ ] Client pages: Layout fungerar utan sidebar offset
- [ ] Employer pages: Layout fungerar utan sidebar offset
- [ ] Breadcrumb: Visas korrekt på client/employer pages
- [ ] ToC (Table of Contents): Visas korrekt på client/employer pages
- [ ] Focus mode toggle: Fungerar fortfarande (om feature behålls)
- [ ] Query params: Propageras korrekt när navigation ändras till anchors
- [ ] `.hide-on-client` klasser: Tas bort eller fungerar korrekt
- [ ] Max-width: Appliceras konsistent på alla sidtyper

### 8.4 Accessibility testning
- [ ] Keyboard navigation: Tab genom alla interaktiva element
- [ ] ARIA labels: Korrekt på buttons/dropdowns
- [ ] Screen reader: Meningsfull struktur
- [ ] Color contrast: WCAG AA standard
- [ ] Focus indicators: Synliga

### 8.5 Performance testning
- [ ] Lighthouse score (Performance, Accessibility, Best Practices, SEO)
- [ ] CSS bundle size (efter borttagning av sidebar styles)
- [ ] JS execution: Inga console errors
- [ ] Image loading: Lazy loading fungerar

---

## 9. IMPLEMENTATIONSORDNING

### Fas 1: Förberedelser och struktur
1. **Skapa nya CSS/JS filer:**
   - `assets/css/components/footer.css`
   - `assets/css/components/theme-dropdown.css`
   - `assets/css/components/language-dropdown.css`
   - `assets/css/pages/home.css`
   - `assets/js/language-dropdown.js`
   - `assets/js/smooth-scroll.js`

2. **Lägg till i18n nycklar:**
   - Uppdatera `i18n/en.toml` och `i18n/sv.toml`

3. **Lägg till CSS tokens:**
   - Max-width variabler i `assets/css/tokens/components.css`

4. **KRITISKT - Uppdatera CSS/JS load order i head.html:**

   **CSS Load Order (viktig ordning):**
   ```
   1. tokens/primitives.css
   2. tokens/semantic.css
   3. tokens/components.css ← NYA max-width tokens här
   4. dimensions/mode/*.css
   5. dimensions/palette/*.css
   6. utilities/*.css
   7. components/footer.css ← NY
   8. components/theme-dropdown.css ← NY
   9. components/language-dropdown.css ← NY
   10. pages/home.css ← NY
   11. style.css (main component styles)
   ```

   **JS Load Order:**
   ```
   1. darkmode-initial.js (blocking, före content)
   --- defer scripts ---
   2. ui.js
   3. header-line.js
   4. header-hide.js
   5. darkmode.js ← UPPDATERAD (mode + palette)
   6. language-dropdown.js ← NY
   7. focus-mode.js
   8. progressbar.js
   9. smooth-scroll.js ← NY (SIST för att köra efter DOM ready)
   ```

### Fas 2: Header navigation (KRITISK)
5. **Uppdatera topmenu.html:**
   - Lägg till Home link
   - Modifiera About/Contact länkar
   - Skapa Contact button styling
   - Bygg kombinerad theme dropdown (mode + palette)
   - Implementera responsiv layout (no hamburger)

6. **Skapa language dropdown:**
   - Ny partial: `layouts/partials/language-dropdown.html`
   - Inkludera i topmenu.html

7. **Uppdatera JavaScript:**
   - Modifiera `assets/js/darkmode.js` för kombinerad dropdown
   - **ARKIVERA** `assets/js/theme.js` - flytta logik till darkmode.js
   - Skapa `assets/js/language-dropdown.js`

### Fas 3: Ta bort sidomeny
8. **Modifiera header.html:**
   - Ta bort `{{ partial "sidemenu.html" . }}`
   - Ta bort conditional logic för client pages

9. **Uppdatera CSS:**
   - Ta bort sidebar grid layout
   - Ändra `.main` till full-width med max-width
   - Ta bort hamburger styles

10. **Arkivera gamla filer:**
    - Flytta sidemenu.html, tags_menu.html, theme.html till `_deprecated/`
    - Flytta theme.js till `_deprecated/` (logik nu i darkmode.js)

### Fas 4: Footer
11. **Bygga ny footer.html:**
    - 4-kolumns layout
    - Migrera innehåll från sidomeny (tags max 8, sorterade alfabetiskt, social med aria-labels)
    - Inkludera copyright

12. **Styling:**
    - Implementera `assets/css/components/footer.css`
    - Responsiv grid (4 → 2 → 1 kolumner)

### Fas 5: Startsida
13. **Uppdatera navigation länkar FÖRST:**
    - Ändra config.toml: `/about/` → `/#about`, `/contact/` → `/#contact`
    - Detta måste göras INNAN smooth scroll implementeras

14. **Uppdatera layouts/index.html:**
    - Lägg till About sektion (använd shortcodes med språkswitch)
    - Lägg till Contact sektion (använd shortcodes)
    - Strukturera med section IDs för anchors (#about, #contact)

15. **Styling:**
    - Implementera `assets/css/pages/home.css`
    - Max-width för sektioner
    - Alternerande bakgrunder
    - scroll-margin-top för anchor offset

16. **Smooth scroll (SIST I FAS 5):**
    - Implementera `assets/js/smooth-scroll.js` med cross-page handling
    - Lägg till i `layouts/partials/head.html` EFTER andra UI-scripts
    - Position i bundle: efter ui.js, header.js, darkmode.js (se fas 1 step 4)
    - Testa: samma-sida, cross-page, direct hash URL

### Fas 6: Max-width
17. **Applicera på alla containers:**
    - Main content (.main)
    - Header (.topmenu__container)
    - Footer (.footer-container)
    - Individual pages (works, about, contact)
    - Responsiva justeringar för breakpoints

### Fas 7: Clients/employers anpassning
18. **Uppdatera works/single.html:**
    - Ta bort `.hide-on-client` references
    - Säkerställ breadcrumb och ToC fungerar
    - Testa layout utan sidebar offset
    - Verifiera focus-mode (om feature behålls)

### Fas 8: Rensning och optimering
19. **JavaScript cleanup:**
    - Ta bort hamburger logic från `assets/js/ui.js`
    - Verifiera att theme.js är arkiverad (redan gjort i fas 3)
    - Ta bort oanvända event listeners

20. **CSS cleanup:**
    - Granska och ta bort oanvänd sidebar CSS
    - Ta bort hamburger menu styles
    - Optimera bundles (minify, fingerprint)
    - Verifiera load order i head.html

### Fas 9: Testning
21. **Genomför testplan (avsnitt 8):**
    - Visuell/funktionell testning alla breakpoints
    - Focus mode testning (8.3.1)
    - Cross-browser testning
    - Accessibility testning
    - Performance testning

22. **Bugfixar och justeringar baserat på testresultat**

23. **Performance optimering:**
    - Lighthouse audit
    - Bundle size analys
    - Image optimization

### Fas 10: Deploy
24. **Pre-deploy checklist:**
    - [ ] All CSS/JS laddas i rätt ordning
    - [ ] Alla arkiverade filer flyttade till _deprecated/
    - [ ] i18n nycklar kompletta för båda språken
    - [ ] Testplan genomförd och godkänd
    - [ ] Backup av nuvarande produktion

25. **Build och deploy till produktion:**
    - Hugo build (production mode)
    - Deploy
    - Post-deploy verifiering

---

## 10. RISKER OCH MITIGERING

### Risk 1: Header blir för packad på mobil
**Mitigering:**
- Testa tidigt på små skärmar (320px)
- Använd icon-only mode för dropdowns
- Överväg vertikal stacking av vissa element

### Risk 2: Footer blir för lång på mobil
**Mitigering:**
- Collapsible kolumner med accordion (optional)
- Prioritera viktigast innehåll först
- Använd 1-kolumn layout under 480px

### Risk 3: Smooth scroll konflikter med andra scripts
**Mitigering:**
- Isolera smooth scroll logic
- Testa med alla befintliga JS-filer laddade
- Event listener priorities

### Risk 4: Palette previews ser inte bra ut
**Mitigering:**
- Prototypa olika designs: split circle, gradient, swatch
- Använd CSS custom properties för dynamiska färger
- Fallback till labels om visualisering misslyckas

### Risk 5: Language dropdown breaking på sidor utan översättning
**Mitigering:**
- Conditional rendering: `{{ if gt (len .Site.Languages) 1 }}`
- Fallback till aktuellt språk om inga translations

---

## 11. FRAMTIDA FÖRBÄTTRINGAR (POST-LAUNCH)

### Möjliga tillägg:
- **Sticky header** på scroll
- **Search functionality** i header
- **Dark pattern variations** för palette (fler färgscheman)
- **Keyboard shortcuts** för navigation (Vim-mode inspiration?)
- **Skip to content** link för accessibility
- **Breadcrumbs** på alla sidor (inte bara clients)

---

## 12. FILER SOM PÅVERKAS - SAMMANFATTNING

### Nya filer att skapa:
- `layouts/partials/language-dropdown.html`
- `layouts/partials/_deprecated/` (mapp för arkivering)
- `assets/css/components/footer.css`
- `assets/css/components/theme-dropdown.css`
- `assets/css/components/language-dropdown.css`
- `assets/css/pages/home.css`
- `assets/js/language-dropdown.js`
- `assets/js/smooth-scroll.js`

### Filer att modifiera:
- `layouts/partials/header.html`
- `layouts/partials/topmenu.html`
- `layouts/partials/footer.html`
- `layouts/index.html`
- `layouts/works/single.html`
- `assets/css/style.css`
- `assets/css/tokens/components.css`
- `assets/js/darkmode.js`
- `assets/js/ui.js`
- `config.toml`
- `i18n/en.toml`
- `i18n/sv.toml`

### Filer att arkivera:
- `layouts/partials/sidemenu.html` → `_deprecated/`
- `layouts/partials/tags_menu.html` → `_deprecated/`
- `layouts/partials/theme.html` → `_deprecated/`

### Filer att potentiellt ta bort/konsolidera:
- `assets/js/theme.js` (logik flyttas till darkmode.js)

---

## 13. ESTIMAT OCH KOMPLEXITET

### Högkomplex (kräver noggrann design + testning):
- Header navigation ombyggnad (theme + language dropdowns)
- Responsiv layout utan hamburgare
- Palette preview visualisering

### Medelkomplex:
- Footer multi-kolumn layout
- Startsida om mig/kontakt sektioner
- Max-width implementation

### Lågkomplex:
- Ta bort sidomeny
- Arkivera gamla filer
- CSS cleanup
- i18n nycklar

---

## 14. SÄKERSTÄLL INNAN START

- [ ] Backup av nuvarande site (git commit/branch)
- [ ] Lokal utvecklingsmiljö fungerar (`hugo server`)
- [ ] Alla CSS/JS bundles kompilerar korrekt
- [ ] Design-mockups i Figma klara (särskilt header på mobil)

---

## SLUTKOMMENTAR

Detta är en omfattande redesign som påverkar nästan alla aspekter av sidens navigation och layout. Nyckeln till framgång är:

1. **Inkrementell implementation** - Följ faserna i ordning
2. **Kontinuerlig testning** - Testa efter varje större ändring
3. **Responsiv-först approach** - Designa för minsta skärmen först
4. **Bevara funktionalitet** - Allt som fanns i sidomenyn ska fortfarande vara tillgängligt

Planen är designad för att minimera breaking changes och säkerställa att sidan förblir funktionell genom hela implementationen.
