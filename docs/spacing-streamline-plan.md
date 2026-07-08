# Spacing-streamline — inventering & plan

> Status: **genomförd (A+B+C)** på gren `claude/layout-spacing-tokens-eccmno`
> (PR #223). Beslut: fluid `clamp()` för section/hero-rytm; blockrytm skalad av
> `--layout-prose-rhythm`. Kontraktet dokumenteras i `layout-dimension-plan.md`.
> Uppföljning på `layout-dimension-plan.md`. Mål: all komposition-/sidspacing går
> genom ett lager som kan knytas till `data-layout`, med **en sanningskälla per
> rytm** och responsiv variation i _tokenen_ — inte i egenskapen.
>
> **Utfall:** de gamla `.home-section`/`.hero-section` padding-överskrivningarna
> och `head.html`-dubbletten är borta; index/terminal fick faktiska buggfixar på
> sm/xs (de bumpades tidigare _större_ än layouten avsåg). Kolumn är oförändrad.

---

## 1. Princip

> **All komposition-/sidspacing läser en `--layout-*`-token. Responsiv variation
> bor i tokenen (media-query eller `clamp()` sätter variabeln), aldrig som en
> egenskaps-override. Block-/prosarytm skalas mot layout via
> `--layout-prose-rhythm`. Komponent-interna spacings står utanför och rörs inte.**

Idag lever **två parallella mönster** sida vid sida, och det är blandningen som
skaver:

- **Mönster A (bra, redan i bruk):** `calc(var(--spacing-X) * var(--layout-prose-rhythm))`
  — skalar mot layout. Finns i `footer.css`, `gallery.css`, `utilities/typography.css`
  (prosa), `style.css` (`--post-media-gap`) och `home.css` (`.about-content`).
- **Mönster B (skaver):** rå `var(--spacing-X)` direkt på egenskapen, ofta i en
  media-query som skriver över det layouten redan bestämt.

---

## 2. Inventering

### 2.1 Kontraktet idag (`--layout-*`)

Definierat i `tokens/semantic.css` (defaults) och per `:root[data-layout="…"]`
i `dimensions/layout/{column,editorial,index,terminal}.css`:

`--layout-section-rhythm`, `--layout-hero-rhythm`, `--layout-heading-gap`,
`--layout-col-gap`, `--layout-row-gap`, `--layout-content-top`,
`--layout-hero-heading-top`, `--layout-about-cv-gap`, `--layout-contact-info-gap`,
`--layout-measure`, `--layout-scale-ratio`, `--layout-prose-rhythm`.

**Lucka:** `--layout-block-gap` står dokumenterad i `layout-dimension-plan.md`
men är **aldrig definierad**.

### 2.2 Problemen (mönster B + läckor)

| #   | Var                               | Vad                                                                    | Problem                                                                                                                                                                         |
| --- | --------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | `home.css:435–448`                | `.home-section` (sm 48 / xs 32) + `.hero-section` (sm 64)              | Skriver över **egenskapen** i media-query → `--layout-section-rhythm` / `--layout-hero-rhythm` ignoreras på små skärmar för _alla_ layouter. Detta är buggen som rapporterades. |
| P2  | `head.html:325,378` (kritisk CSS) | `.hero-section` padding hårdkodad (96 bas / 64 sm)                     | **Tredje sanningskällan** för hero-rytmen, fryst — respekterar inte tokenen. Måste hållas i synk manuellt idag.                                                                 |
| P3  | `style.css:800,808,915,927`       | `.project-info` `padding: 2rem`, `grid-column-gap: 3/2/1.5rem`         | **Råa literaler** utanför spacing-skalan.                                                                                                                                       |
| P4  | `tokens/semantic.css`             | `--layout-block-gap`                                                   | Dokumenterad men odefinierad — kontraktslucka.                                                                                                                                  |
| P5  | `style.css` (~25 st) + `home.css` | rubrik/titel/kort/kontakt-marginaler `margin-bottom: spacing-16/24/32` | Rå `--spacing`, **utan** prose-rhythm → skalar inte med layout fast grannar (prosa, media) gör det. Inkonsekvent block-rytm.                                                    |

Exempel på P5-kandidater: `.startpage-heading h1`, `.about-cv__title`,
`.about-main__headline`, `.about-cv__heading/__text/__section`, `.works-section
.section-heading`, `.project-info` inre marginaler, `.content.newsletter h3`.

### 2.3 Lämnas ifred (komponent-internt)

`theme-dropdown.css` (72), `ui-library.css` (69), `language-dropdown.css`,
`settings-dropdown.css`, `form.css`, `toast.css`, `accordion.css`,
`button.css`, m.fl. — widget-interna spacings. Ska **inte** knytas till layout;
använder redan `--spacing-*`-skalan konsekvent.

---

## 3. Responsiv-strategi (designval — behöver ditt beslut)

P1/P2 kräver att rytmen varierar med skärmbredd _via tokenen_. Två vägar:

- **(a) Fluid — `clamp()` i tokenen.** T.ex.
  `--layout-section-rhythm: clamp(var(--spacing-32), 4vw, var(--spacing-64));`
  per layout. Inga diskreta sm/xs-steg, ingen media-query, en rad per layout.
  Mest strömlinjeformat; ger mjuk skalning i stället för hopp.
- **(b) Diskret — token-override i media-query.** Behåll sm/xs-brytpunkter men
  flytta dem från egenskapen till variabeln, per layout (som `editorial.css`
  redan gör för `--layout-hero-rhythm`). Mer förutsägbart, mer upprepning.

**Rekommendation:** (a) för `section-rhythm` + `hero-rhythm` (kontinuerlig rytm
mår bra av att vara fluid), (b) vid behov för enstaka undantag. Oavsett väg
försvinner egenskaps-överskrivningarna och den kritiska CSS-dubbletten.

---

## 4. Prioriterad plan (faser)

### Fas A — sektion/hero-rytmen genom tokens _(litet, säkert; löser buggen)_

1. Gör `--layout-section-rhythm` och `--layout-hero-rhythm` responsiva i
   tokenen (väg 3a eller 3b), i `semantic.css` (default) + varje layout-fil.
2. Ta bort `.home-section` / `.hero-section` padding-override i `home.css:435–448`.
3. Kritisk CSS i `head.html`: låt `.hero-section` läsa `var(--layout-hero-rhythm)`
   och ta bort den hårdkodade sm-överskrivningen (en sanningskälla).
4. Verifiera alla 4 layouter × xs/sm/md/lg med screenshots.

### Fas B — knyt block-rytmen till layout _(mellan)_

1. Definiera `--layout-block-gap` (default `var(--spacing-32)`) och ev.
   `--layout-title-gap` (default `var(--spacing-16)`) i `semantic.css`; skala dem
   per layout eller härled ur `--layout-prose-rhythm`.
2. Route:a P5-marginalerna (rubriker/titlar/kort/kontakt) till dessa tokens i
   stället för rå `--spacing`, så de skalar konsekvent med layouten.
3. Verifiera att index (tätt) / editorial (luftigt) / terminal (kompakt) ger
   sammanhängande block-rytm.

### Fas C — literal-läckor + kontrakt _(städning)_

1. `.project-info` `padding: 2rem` → spacing-skala; `grid-column-gap: 3/2/1.5rem`
   → `--layout-col-gap`-familjen (respektera befintlig sm-nedtrappning).
2. Uppdatera `layout-dimension-plan.md`: markera `--layout-block-gap` som
   definierad, lägg till block/title-tokens och sektion/hero-fluid-noten.

---

## 5. Verifiering (per fas)

- `npx jest` (inkl. `token-validation.test.js`), `eslint`, `prettier`.
- Hugo-bygge grönt.
- Chrome-screenshots: alla 4 layouter vid xs (≤360), sm (≤480/768), md, lg —
  hero-topp, sektionsavstånd, block-rytm i about/works/contact.
- Diff-koll: Fas A/C ska vara visuellt no-op _förutom_ på xs/sm där buggen fixas.

---

## 6. Öppna frågor till dig

1. **Responsiv väg:** fluid `clamp()` (3a) eller diskreta token-steg (3b)?
2. **Omfattning nu:** kör vi A, A+B eller A+B+C? (Kan tas som separata PR:er.)
3. **Separat PR eller på nuvarande gren?** Denna plan ligger nu på
   `claude/layout-spacing-tokens-eccmno` (PR #223) — säg till om du hellre vill ha
   streamline-arbetet i en egen PR ovanpå master.
