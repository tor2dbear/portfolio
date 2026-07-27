---
author: "Torbjörn Hedberg"
date: 2026-07-26
linktitle: Cadence
title: Cadence
subtitle: Verktyg för rörelsesystem
slug: works
weight: 1
tags: ["Digitala Produkter", "Experimentellt"]
clients: []
description: Det sista osystematiserade hörnet av ett designsystem är rörelse. Cadence tokeniserar den – och ger den en åsikt.
header_image: cadence-poster.jpg
hero_embed: /cadence-hero.html
featured: true
draft: true
role: "Koncept, design & utveckling"
details:
  year: 2026
  platform: "Webbapp"
  scope: "Designsystem, UI, frontend-utveckling"
client:
  name: "Eget initiativ"
  url: "https://cadence.tor2dbear.com"
  about: "Ett designverktyg för rörelsesystem som utforskar rörelse som lager av design-tokens – primitiver och semantiska intents – med ett åsiktslager som kritiserar hela systemet."
---

{{< hero-embed src="/cadence-hero.html#label" ratio="16 / 10" title="Cadence – ett rörelsesystem, utan ord: fyra semantiska intents som en solfjäder av easing-kurvor, var och en märkt med sina intent-, kompositions- och varaktighetstokens" >}}

Rörelse är det sista osystematiserade hörnet av ett designsystem. Färg har tokens; typografi har en skala. Rörelse är fortfarande magiska siffror – en `cubic-bezier` intrimmad på känsla, inklistrad ur minnet, aldrig nedskriven. **Cadence** behandlar den som resten av systemet, och ger den en åsikt.

![Cadence-editorn – en levande instrumentpanel.](cadence-editor.jpg "Instrumentet – varaktigheter och easings till vänster, semantiska intents i mitten, en live-förhandsvisning till höger.")

Två lager, lånade från hur vi redan hanterar färg. *Primitiver* är den råa vokabulären: en varaktighetsstege och en uppsättning easings du ritar för hand. *Intents* är meningen – `enter`, `exit`, `move` – komponerade från primitiverna by reference. Du namnger vad rörelse är *till för*, inte vad den *är*; ändra en primitiv och hela systemet tajmar om.

![Tvålagersmodellen – primitiver komponerade till intents by reference.](cadence-two-layer-model.svg "Primitiver → intents, by reference. Art direction bor i namngivningen, inte siffrorna.")

Beslutet jag är mest nöjd med var att sluta designa kring komponenter. En tidig version låste fyra roller till fyra demokomponenter och föll ihop i samma stund jag föreställde mig en femte. Så komponenter blev en bänk av instrument – var och en en lins på en enda egenskap hos en token, aldrig en skärm att återuppföra. Organisera ett system kring sina egna tokens, så kan inget hamna utanför.

![Åsiktslagret som läser ett helt system.](cadence-system-read.jpg "Åsiktslagret – det läser hela systemet och säger vad det skulle ändra.")

De flesta verktyg genererar; de dömer inte. Den del jag är stoltast över är den med en synvinkel: den läser hela uppsättningen och säger var det skaver – en easing som i hemlighet är två, ett exit som är långsammare än sitt entré, en stege som haltar – och *vad den skulle ändra*, inte bara vad som är fel. Att koda in det omdömet – en art directors öga som en handfull checkar – är hela idén.

Inget av det stannar i verktyget. Cadence exporterar den CSS du skulle ha skrivit för hand, och driver en riktig produktyta så att du kan känna systemet snarare än bara läsa det.

![Systemet som driver riktiga komponenter, tajmar om live.](cadence-demo.mp4)

Det verkliga testet var att vända det mot mig själv.

![Cadence som läser den här sajtens egna rörelse-tokens.](cadence-portfolio-read.jpg "Vänt mot sig självt – läser den här portföljens egna rörelse-tokens.")

Jag klistrade in den här sajtens egna rörelse-tokens. Den gillade rytmen – och ertappade mig med att vara lat: två av mina easings är, i tysthet, samma kurva. Ett verktyg värt att lansera ska kunna genera sin skapare. Det här gjorde det.

**Live:** [cadence.tor2dbear.com](https://cadence.tor2dbear.com) · **Källkod:** [github.com/tor2dbear/cadence](https://github.com/tor2dbear/cadence)
