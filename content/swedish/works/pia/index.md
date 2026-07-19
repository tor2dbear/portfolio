---
author: "Torbjörn Hedberg"
date: 2026-07-15
linktitle: PIA
title: "PIA — en liten dator i webbläsaren"
subtitle: Egen produkt · Teknisk designstudie
slug: works
weight: 16
tags: ["Digitala Produkter"]
clients: []
employers: []
description: En webbterminal byggd från grunden — filsystem, skal, texteditor och små appar, allt i en flik och installerbar som app på hemskärmen.
header_image: 01-hero-session
featured: true
draft: false
hidden: false
role: "Idé, design och utveckling (solo)"
details:
  year: 2026
  platform: "Webb · installerbar PWA"
  stack: "TypeScript · Vite · Vitest · Cloudflare Pages"
  scope: "Idé, design, arkitektur & utveckling"
client:
  name: "Egen produkt"
  url: "https://pia.tor2dbear.com"
  about: "Självinitierad designstudie — en webbterminal byggd från grunden."
---

![En session från start: identitet, filsystem och pipes — samma kommandon och flaggor som ett riktigt skal.](01-hero-session.png "En session från start: identitet, filsystem och pipes — samma kommandon och flaggor som ett riktigt skal.")

### Översikt

PIA är en fungerande liten dator som lever helt i webbläsaren. Man loggar in på en prompt, navigerar ett filsystem, skriver i en editor, kör kommandon med pipes (`sort fruit.txt | uniq`), installerar små paket med `brew`, spelar spel och kör till och med Python — utan att lämna fliken. Ingen backend krävs för att komma igång; loggar man in synkar allt till molnet, annars kör allt lokalt.

Namnet är en blinkning till Apples *Lisa* — PIA står för *Personal Integrated Applications*.

Projektet är lika mycket en **designstudie i konsekvens** som en produkt: en enda, tydlig regel — *terminal-idiom först* — som får styra varenda beslut, ända in i arkitekturen.

### Idén

Jag ville se hur långt man kan ta metaforen "en dator i en flik" om man vägrar att fuska. Inte en leksaks-terminal med ett par påhittade kommandon, utan något som faktiskt beter sig som ett skal: samma namn, samma flaggor, samma flöden som en riktig Unix-miljö — men som råkar bo i webbläsaren och funkar lika bra med tummen på en telefon.

Utmaningen är att två världar krockar. Terminalen är tangentbord, text och konventioner från 1970-talet. Webben är touch, delningslänkar, e-postinlogg och hemskärms-appar. Hela designarbetet handlar om att låta det ena styra utan att förråda det andra.

### Designprincipen: terminal-idiom först

Varje kommando och flöde ska följa Unix-konvention — **namn**, **flaggor** och **beteende**. Hellre det riktiga terminalnamnet (`nano`, `useradd`, `grep -n`) än en vänlig webb-uppfinning (`edit`, `register`, GUI-genvägar). Vänliga namn får finnas kvar som **alias**, aldrig som det primära.

Det låter strikt, och det är själva poängen. Konsekvens är en designfunktion: kan man en sak kan man gissa nästa. Editorn är `nano`, sparar med `^O`, avslutar med `^X`. Kontoskapande är `useradd` (alias `register`). Prompten är `user@pia:~$`. Inställningar bor i en `.pia/`-dotfil. Ingenting av det här är slumpmässigt — det är samma muskelminne som ett riktigt skal.

![Ett brett kommandoregister som följer Unix-konvention — riktiga namn och flaggor, vänliga alias sekundära.](06-command-register.png "Ett brett kommandoregister som följer Unix-konvention — riktiga namn och flaggor, vänliga alias sekundära.")

**Det viktigaste beslutet var vad man gör när det *inte* finns någon terminal-motsvarighet.** E-post + lösenord + bekräftelsemejl är ren webb. `share`/`publish` som returnerar en URL har ingen skal-motsvarighet. Touch-knappar på mobilen likaså. I stället för att låtsas att de är något de inte är, är regeln: **flagga avvikelsen och gör den till ett medvetet beslut, inte en glidning.** Varje sådan webb-avvikelse är dokumenterad och motiverad. Det är skillnaden mellan en produkt med en åsikt och en med en hög funktioner.

### Arkitektur som designbeslut

Den mest designade delen av PIA syns inte på skärmen: **adaptrarna är sömmen.** Terminalen rör aldrig lagring eller inloggning direkt — bara gränssnitten `StorageAdapter` / `AuthAdapter` / `ShareStore`. Varje kommando når världen genom ett litet, definierat `CommandContext` (skriv ut, filsystem, auth, stdin …), aldrig via DOM eller lagring.

Det gör att en stor produktförändring blir ett **byte, inte en omskrivning**: gäster kör lokala adaptrar, inloggade användare kör moln-adaptrar (Supabase) — bakom exakt samma gränssnitt. Fullskärmsappar (editorn, spelen) är "bara ännu en skärm-app" som tar över via samma mekanism. Nya spel och verktyg kostar nästan ingenting att lägga till.

För en designer är det här kärnan: **struktur är det som gör att produkten kan växa utan att förfalla.** Sömmen är osynlig, men den är anledningen till att allt annat känns lätt.

### Utvalda designbeslut

**Teman och typografi.** Fyra CRT-inspirerade paletter (grön fosfor, bärnsten, is, gråskala) som bara sätter fem färg-tokens — resten av gränssnittet följer med automatiskt. Typsnittet är JetBrains Mono, självhostat så det renderar för alla inom en strikt säkerhetspolicy (CSP), och samma typsnitt som min portfolio för en sammanhållen känsla.

![Fyra CRT-paletter; ett tema sätter fem färg-tokens och resten följer med — här bärnsten.](02-theme-amber.png "Fyra CRT-paletter; ett tema sätter fem färg-tokens och resten följer med — här bärnsten.")

![Samma session i is-temat — bytet är ett kommando, theme ice.](03-theme-ice.png "Samma session i is-temat — bytet är ett kommando: theme ice.")

**Editorn är `nano` på riktigt.** Fullskärmsappar tar över via samma mekanism som allt annat, ärver temat gratis och håller samma idiom: `^O` sparar, `^X` avslutar, rad och kolumn i statusraden.

![Editorn är `nano` på riktigt: `^O` sparar, `^X` avslutar, rad/kolumn i statusraden.](04-editor-nano.png "Editorn är nano på riktigt: ^O sparar, ^X avslutar, rad/kolumn i statusraden.")

![Fullskärmsappar är "bara ännu en skärm-app" — spel ärver temat gratis.](05-game-2048.png "Fullskärmsappar är bara ännu en skärm-app — spel ärver temat gratis.")

**Kommandoraden (touch-baren) är kontext-medveten.** På en enhet med fysiskt tangentbord göms den helt — Tab, pilar och pipe finns redan på tangenterna. På touch dyker den upp och grupperas i logiska kluster med hårfina avdelare: *komplettering · navigering · skiljetecken · kontroll*. Färgerna följer temat. Kontroll-gruppen är en enda `ctrl`-knapp som fäller ut hela readline-uppsättningen (`^A ^E ^U ^K ^W …`) — så baren förblir ren fast funktionaliteten växer.

![Samma dator i tummen. Touch-baren dyker bara upp på pekskärm.](07-mobile-keybar.png "Samma dator i tummen. Touch-baren dyker bara upp på pekskärm.")

![Kontroll-gruppen är en `ctrl`-knapp som fäller ut hela readline-uppsättningen — ren bar, växande funktion.](08-mobile-ctrl-tray.png "Kontroll-gruppen är en ctrl-knapp som fäller ut hela readline-uppsättningen — ren bar, växande funktion.")

**PWA vs webbläsare — samma app, olika hem.** Installerad på iOS-hemskärmen finns ingen webbläsar-chrome att luta sig mot. Genom `display-mode: standalone` och riktig hantering av "safe area" (kamerahål, home-indicator) sitter allt kant-i-kant utan fula glapp — men webbläsarläget lämnas orört. Detaljer som att ta bort en tom marginal under knappraden när tangentbordet fälls upp är osynliga tills de fattas.

**Push-notiser på riktigt.** Påminnelser (`remind`) och samarbets-notiser når telefonen via Web Push även när fliken är stängd — samma terminala kommando, en molnfunktion under huven.

### Utmaningar och avvägningar

**När idiomet inte räcker.** Att bjuda in någon till en delad checklista (`todo share <namn> <e-post>`) har ingen ren Unix-motsvarighet — närmaste släkting är `chmod`/`chown`. Det blev en medveten, dokumenterad webb-avvikelse snarare än en tvingad metafor. Samma sak med filuppladdning som når OS:ets filväljare: namngiven rakt på, inte förklädd till `scp`.

**QR-koden som inte gick att skanna.** Min första handkodade QR-generator producerade koder som såg rätt ut men inte lät sig läsas. I stället för att jaga buggen i det oändliga bytte jag till ett beprövat bibliotek och verifierade med en skanner i test — rätt beslut framför prestige.

**Python i webbläsaren.** Python körs via Pyodide (WASM) i en isolerad, självhostad sandlåda — ingen extern CDN, allt inom samma säkerhetspolicy som resten.

### Kvalitet: en session som dokumentation

Den kanske mest ovanliga delen: **hela produkten testas via en enda skriptad session** genom den riktiga terminalen, sparad som en läsbar utskrift ("the tour"). När jag lägger till en funktion lägger jag till rader i den sessionen och granskar diffen mot den sparade utskriften — den diffen *är* verifieringen. Klockan är fryst och flyktig utdata maskeras, så det enda som ändras är verkligt beteende. Resultatet är ett test som också läses som en guidad rundtur av vad PIA gör.

Ovanpå det: typkontroll, enhetstester och verifiering i en riktig webbläsare för det som testerna inte kan se (färger, WASM, PWA-beteende). Allt landar via gren → PR → CI → merge, med automatiska förhandsvisnings-URL:er per ändring.

### Var vi står

PIA är en fungerande, deployad produkt med ett brett kommandoregister, en texteditor, delbara checklistor med realtidssamarbete, ett paketsystem med spel och verktyg, Python-stöd, teman, och installerbar PWA med push-notiser. Den kör lika bra på desktop som med tummen på en telefon.

Framför allt är den ett bevis på en tes: att en **enda, kompromisslös designprincip** — konsekvent hela vägen ner i arkitekturen — ger en produkt som känns hel, är lätt att bygga vidare på, och har en tydlig personlighet.

### Nästa steg

- Guidad `demo` som visar upp höjdpunkterna för en förstagångsbesökare.
- Fler readline-genvägar (t.ex. `^R` bakåtsök) — nu triviala tack vare Ctrl-brickan.
- Tillgänglighet/Lighthouse-pass och tema-upptäckbarhet.
- Bryta ut kärnmotorn till ett fristående npm-paket.

### Roll

Idé, design, arkitektur och utveckling — solo. En egen produkt och teknisk designstudie, från första prompten till deployad PWA.
