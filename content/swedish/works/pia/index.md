---
author: "Torbjörn Hedberg"
date: 2026-07-15
linktitle: PIA
title: "PIA — en liten dator i webbläsaren"
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
live_url: "https://pia.tor2dbear.com"
live_label: "Öppna PIA"
role: "Idé, design och utveckling (solo)"
details:
  year: 2026
  platform: "Webb · installerbar PWA"
  stack: "TypeScript · Vite · Vitest · Supabase · Cloudflare Pages"
  scope: "Idé, design, arkitektur & utveckling"
---

![Det första PIA gör är att presentera sig vid prompten.](01-hero-session.png "Det första PIA gör är att presentera sig vid prompten.")

### Översikt

PIA är en fungerande liten dator som lever i en webbläsarflik. Man loggar in på en prompt, rör sig genom ett filsystem, redigerar filer och kör kommandon med pipes (`sort fruit.txt | uniq`). Ingen backend för att komma igång: gäster kör lokalt, inloggade synkar till molnet. Namnet är en blinkning till Apples _Lisa_ — PIA står för _Personal Integrated Applications_.

Jag ville se hur långt "en dator i en flik" går om man vägrar att fuska — inte en leksaks-terminal, utan något som beter sig som ett riktigt skal: samma namn, flaggor och flöden som Unix, som råkar köra i webbläsaren och funkar med tummen på en telefon.

Det gör att två världar krockar. Terminalen är tangentbord, text och 1970-talskonvention; webben är touch, delningslänkar, e-postinlogg och hemskärms-appar. **Hela projektet är en enda regel — _terminal-idiom först_ — tryckt hela vägen in i arkitekturen.** Det är det tydligaste argument jag kan ge för hur jag bygger produkter: välj en princip och låt strukturen, inte viljestyrkan, hålla ihop det hela när det växer.

![PIA från början till slut: identitet, ett riktigt filsystem, nano-editorn, riktig Python via `brew install`, och ett par paket — en enda sammanhängande session.](02-tour.mp4 "PIA i drift: identitet, filsystem, nano-editorn, Python och paket — en enda sammanhängande session.")

_En loopande, självspelande rundtur — det inbyggda `demo`-kommandot spelar upp en scriptad session (deterministisk, identisk varje tagning — inte en skärminspelning)._

### Designprincipen: terminal-idiom först

Varje kommando följer Unix-konvention — **namn, flaggor och beteende.** Det riktiga namnet (`nano`, `useradd`, `grep -n`) vinner över en vänlig webb-uppfinning (`edit`, `register`, en GUI-genväg); vänliga namn överlever bara som _alias_. Kan man ett kommando kan man gissa nästa: editorn är `nano` (`^O` sparar, `^X` avslutar), prompten är `user@pia:~$`, inställningar bor i en `.pia/`-dotfil.

![Ett brett kommandoregister som följer Unix-konvention — riktiga namn och flaggor, vänliga alias sekundära.](06-command-register.png "Ett brett kommandoregister som följer Unix-konvention — riktiga namn och flaggor, vänliga alias sekundära.")

Det svåra är vad man gör när det inte finns någon terminal-motsvarighet. E-post och bekräftelsemejl är ren webb; `share` som returnerar en URL har ingen skal-motsvarighet; touch-knappar likaså. I stället för att klä upp dem till något de inte är är regeln rak:

> Flagga avvikelsen och gör den till ett medvetet, dokumenterat beslut — inte en glidning.

### Arkitektur som designbeslut

**Den mest designade delen syns inte på skärmen: adaptrarna är sömmen.** Terminalen rör aldrig lagring eller inloggning direkt — bara gränssnitten `StorageAdapter` / `AuthAdapter` / `ShareStore`, nådda genom ett litet `CommandContext` (skriv ut, filsystem, auth, stdin …), aldrig via DOM:en.

**Så en stor ändring blir ett byte, inte en omskrivning.** Gäster kör lokala adaptrar; inloggade kör moln-adaptrar (Supabase) bakom samma gränssnitt. Fullskärmsappar — editorn, spelen — tar över via samma mekanism, så nya verktyg kostar nästan ingenting. Struktur är det som gör att produkten kan växa utan att förfalla.

![Adaptersömmen — terminalen ser bara gränssnitt; gäst kör lokalt, inloggad kör moln (Supabase), bakom samma kontrakt.](09-architecture.svg "Adaptersömmen — terminalen ser bara gränssnitt; gäst kör lokalt, inloggad kör moln (Supabase), bakom samma kontrakt.")

### Utvalda designbeslut

**Teman är fem tokens, inte ett omskal.** Fyra CRT-paletter (grön fosfor, bärnsten, is, mono) sätter var och en bara fem färg-tokens; resten följer med. I klippet nedan färgar `theme amber` och `theme ice` om hela skärmen på en gång — inget stylas om per tema, tokens kaskaderar bara. Typsnittet är självhostat JetBrains Mono, delat med den här portfolion.

![En terminalsession — pipes, sedan färgar theme amber och theme ice om allt från fem färg-tokens.](10-terminal-tour.mp4 "En terminalsession — pipes, sedan färgar tema-byten om allt från fem tokens.")

_En loopande återgivning av den sparade `tour`-sessionen — äkta kommandon och utdata, animerat (inte en skärminspelning)._

**Editorn är `nano` på riktigt.** Fullskärmsappar ärver temat gratis och håller idiomet: `^O` sparar, `^X` avslutar, rad och kolumn i statusraden.

![Editorn är `nano` på riktigt: `^O` sparar, `^X` avslutar, rad/kolumn i statusraden.](04-editor-nano.png "Editorn är nano på riktigt: ^O sparar, ^X avslutar, rad/kolumn i statusraden.")

![Fullskärmsappar är "bara ännu en skärm-app" — spel ärver temat gratis.](05-game-2048.png "Fullskärmsappar är bara ännu en skärm-app — spel ärver temat gratis.")

**Touch-baren är kontext-medveten — en webb-avvikelse, medvetet gjord.** Med ett fysiskt tangentbord är den gömd; Tab, pilar och pipe finns redan där. På touch dyker den upp i kluster — _komplettering · navigering · skiljetecken · kontroll_ — och kontroll-gruppen är en enda `ctrl`-knapp som fäller ut hela readline-uppsättningen (`^A ^E ^U ^K ^W …`), så baren förblir ren när den växer.

![Samma dator i tummen — till vänster touch-baren, till höger ctrl-knappen utfälld till hela readline-uppsättningen. Baren dyker bara upp på pekskärm.](07-mobile-mockup.png "Samma dator i tummen — till vänster touch-baren, till höger ctrl-knappen utfälld till hela readline-uppsättningen. Baren dyker bara upp på pekskärm.")

**Samma app, olika hem.** På iOS-hemskärmen finns ingen webbläsar-chrome, så `display-mode: standalone` och riktig hantering av "safe area" lägger allt kant-i-kant — medan webbläsarläget lämnas orört. Push är på riktigt också: `remind` och samarbets-notiser når telefonen via Web Push med fliken stängd.

### Kvalitet: testet som läses som en rundtur

**Hela produkten verifieras via en enda skriptad session** i den riktiga terminalen, sparad som en utskrift ("the tour"). Lägg till en funktion, lägg till rader, granska diffen mot den sparade kopian — den diffen _är_ testet. Klockan är fryst och flyktig utdata maskeras, så det enda som ändras är verkligt beteende.

```diff
 guest@pia:~$ at now+5m echo remember
 scheduled for Sat Jul 18 12:05 UTC 2026
   echo remember
+guest@pia:~$ remind now+1h standup
+remind: reminders need a cloud account — run `login`
```

_Ett äkta utdrag ur touren: att lägga till `remind` la till de två gröna raderna, och den ärliga gäst-avböjningen är beteendet som testas. Den granskade diffen är verifieringen._

Utöver det: typkontroll, enhetstester och kontroller i en riktig webbläsare för det testerna inte kan se (färger, WASM, PWA). Allt landar via gren → PR → CI → merge, med en förhandsvisnings-URL per ändring.

### Vad det bevisar

**En kompromisslös princip, buren in i arkitekturen, gjorde produkten hel och billig att bygga vidare på.** Adaptersömmen gjorde den största ändringen — gäst till moln — till ett byte, och gjorde varje nytt spel eller verktyg nästan gratis. Den skriptade touren gör varje dokumenterat beteende till ett test, så konsekvens upprätthålls vid varje merge i stället för att hoppas på.

**Kostnaden är verklig:** idiom-först beskattar de webb-inhemska delarna — varje avvikelse (`share`, uppladdning, touch-baren, push) måste argumenteras och skrivas ner. Just den disciplinen är vad som ger PIA sin åsikt; den gör också allt som inte passar metaforen långsammare att lägga till.

I dag är den en deployad, installerbar PWA — kommandoregister, editor, delade checklistor i realtid, ett paketsystem med spel och verktyg, Python, teman, push. **Bästa sättet att bedöma den är att trycka på några tangenter själv.**
