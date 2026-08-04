---
author: "Torbjörn Hedberg"
date: 2026-07-15
linktitle: "Statistik för annonsörer"
title: "Prospekt eller lead? Att göra annonsörernas siffror begripliga"
subtitle: "Produktledning & UX"
slug: arbeten
weight: 2
tags: ["Digitala Produkter"]
clients: []
employers: []
description: "En annonsör betalar för kontakt. Men gränssnittet gjorde det svårt att se vad man faktiskt fick. Ett pågående initiativ för att skilja prospekt från leads och göra statistiken begriplig."
header_image:
featured: true
draft: true
hidden: false
role: "Product Owner & designer"
details:
  year: 2026
  platform: "Webb · annonsörsgränssnitt"
  scope: "Produktstrategi, IA, UX, leverans"
  status: "Pågående (fas 1)"
client_label: "Typ"
client:
  name: "Lokalguiden"
  url: "https://www.lokalguiden.se/"
  about: "Marknadsplats som kopplar samman företag med lokala aktörer."
---

<!--
  UTKAST — sanera och fyll innan publicering:
  • Byt hidden/draft till false när den är klar.
  • Lägg in before/after-bilder av leads-vyn (det är dem caset står och faller med).
  • Fyll [SIFFRA]/[KPI] med riktiga tal när fas 1 följts upp — annars stryk raden hellre än att lämna vagt.
  • Dubbelkolla att inget internt (interna ID:n, kolumnnamn, fas 2-detaljer) är kvar.
-->

### Översikt

En annonsör hos Lokalguiden betalar i grunden för en sak: kontakt. Någon hör av sig, besöker annonsen, blir en möjlig affär. Men i annonsörsgränssnittet var det förvånansvärt svårt att se vad man faktiskt fick — och när själva värdet är svårt att se, sjunker det upplevda värdet av hela tjänsten.

Det här är fas 1 av ett pågående initiativ som jag äger som produktägare. Kärnan är inte ny funktionalitet, utan **begriplighet**: att skilja prospekt från leads, samla aktiviteten på ett ställe, och göra det tydligt vad siffrorna faktiskt betyder.

<!-- ![Before/after: den samlade leads-vyn.](filnamn.webp "Kort bildtext.") -->

### Problemet

Förvirringen uppstod på flera ställen samtidigt:

- **Prospekt och leads blandades** i samma vy, trots att de är olika saker.
- **Intresseanmälningar och kontaktförfrågningar** låg i två separata tabeller — samma sorts händelse, uppdelad utan tydlig anledning.
- **Statistiken räknade alla, leads-listan bara inloggade.** Två siffror som mätte olika saker utan att förklara varför de skiljde sig åt.
- **Mailen till annonsören** täckte bara en del av aktiviteten — besök på annonsen syntes inte alls.

Var för sig små saker. Tillsammans en produkt som fick annonsören att tvivla på sina egna siffror.

### Vad som stod på spel

Det här var lätt att avfärda som "en UI-putsning". Men leaden *är* värdeutbytet i affären. Om annonsören inte förstår sin trafik och sina kontakter blir det svårare att motivera vad man betalar för — och det landar till slut i förnyelse och churn, inte i en detaljvy.

> KPI:er sätts vid refinement. Uppföljning: [SIFFRA — t.ex. andel annonsörer som öppnar leads-vyn, eller minskad andel supportärenden om "varför skiljer siffrorna sig"].

Att skriva ut det här — att en klarhetsfråga är en affärsfråga — var en del av jobbet: att få organisationen att prioritera något som inte ser ut som en "feature".

### Så jag ramade in det

Fyra beslut, alla i grunden informationsarkitektur:

1. **Skilj prospekt från lead.** Två olika saker ska se olika ut och bo på olika ställen.
2. **En gemensam leads-tabell.** Slå ihop det som var uppdelat utan skäl, med kontakttyp som en kolumn i stället för som två tabeller.
3. **Gör "alla vs spårbar" tydligt.** Statistik = totaler (alla besökare). Leads = individer vi kan följa (inloggade). Skillnaden förklaras där den uppstår, inte i en hjälptext långt bort.
4. **Lyft annonsbesök till en synlig metric.** Besök på annonsen är aktivitet annonsören bryr sig om — det ska synas i vyn och i mailen, inte gömmas.

Det här är designarbetet i caset: inte att rita fler skärmar, utan att göra en rörig modell begriplig.

### Beslut & avvägningar

Det största produktbeslutet var att **fasa**. Den enkla vägen hade varit att lova allt på en gång; i stället drog jag en tydlig linje:

- **Fas 1 (det här):** separera prospekt/leads, gemensam tabell, förklarande text, besök som metric, utbyggda notifieringar.
- **Fas 2 (separat):** tyngre saker — mer spårning, utökad statistik på annonsnivå, översyn av de återkommande mailen.

Det höll fas 1 leverabar och lät den svåra researchen (hur aktivitet från inloggade kan samlas in på ett rimligt sätt) drivas som ett eget spår utan att blockera resten. Arbetet delades i tre parallella epics och krävde samordning mellan data/utveckling och annons/sälj — de senare för att förstå vad annonsören faktiskt undrar över.

### Var det står nu

Fas 1 är under leverans. Uppföljningen — vad som byggdes, vilka val som stod sig, och vad som medvetet sköts till fas 2 — fylls i när den är ute.

<!-- Uppföljning: [vad blev byggt] · [vad mätte vi] · [vad gick till fas 2] -->

### Vad det visar

Caset är litet med flit. Det visar inte en dramatisk omdesign, utan hur jag jobbar i skarven mellan design och produkt: att se en klarhetsfråga som en affärsfråga, rama in ett rörigt problem som informationsarkitektur, och fasa det till något ett team faktiskt kan leverera. Att bestämma vad som ska byggas — och i vilken ordning — är också design, bara tidigare i kedjan.
