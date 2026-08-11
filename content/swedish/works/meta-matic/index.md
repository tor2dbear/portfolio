---
author: "Torbjörn Hedberg"
date: 2026-08-11
linktitle: Méta-Matic ∞
title: "Méta-Matic ∞"
slug: arbeten
weight: 1
tags: ["Digitala Produkter", "Experimentellt"]
clients: []
description: En digital ritmaskin efter Tinguely — ett löpande band genom ett latent rum som ritar oändligt många verk och aldrig något nytt.
worktheme:
  color: metamatic
  tags: filled
header_image: meta-matic-poster.jpg
hero_embed: /meta-matic-hero.html#label
featured: true
draft: true
role: "Koncept, design & utveckling (solo)"
details:
  year: 2026
  platform: "Webb · statisk sida på Cloudflare"
  stack: "Canvas · vanilla JS · Cloudflare Worker + KV"
  scope: "Idé, konceptuell inramning, design & frontend"
client_label: "Typ"
client:
  name: "Eget initiativ"
  url: "https://meta-matic.tor2dbear.com"
  about: "En digital ritmaskin efter Jean Tinguely, omtänkt för AI-eran: ett löpande band genom ett latent rum där varje möjlig teckning redan är en punkt."
---

{{< hero-embed src="/meta-matic-hero.html#label" ratio="16 / 10" title="Méta-Matic ∞ — bandet rullar och glider fram i realtid; varje ruta är en punkt i ett latent rum." >}}

1959 byggde **Jean Tinguely** maskiner som ritade abstrakt konst på löpande band — _Méta-Matics_, ett skämt om det spontana geniet. Méta-Matic ∞ är samma skämt, fast flyttat till AI-eran. Maskinen ritar också. Men den _slumpar_ inte fram sina verk; den _hämtar_ dem ur ett kontinuerligt rum där varje möjlig teckning redan är en punkt. Att gå framåt är att interpolera. Frågan är inte längre Tinguelys "vad är konst när en maskin kan göra det?" utan: **oändligt många, aldrig något nytt — var finns originalet?**

![Nio verk ur maskinen, var och en med sin koordinat.](meta-matic-grid.jpg "Nio verk ur maskinen, var och en med sin koordinat. Olika på ytan — öppna slingor, täta nystan — och ändå bara punkter i samma rum. Ingen av dem är ny.")

Varje verk ritas med staplade epicykler vars parametrar hämtas ur ett kontinuerligt brusfält — grannkoordinater ger nästan identiska teckningar, så bandet glider snarare än hoppar. Och det drivs av väggklockan, inte av besökaren: serienumret är en funktion av tiden, alltså samma verk för alla just nu, helt utan server. Du kan titta bort, men inte stoppa maskinen — räknaren tickar vidare, och när du tittar tillbaka har den ritat utan dig. "Verk producerade" stiger. **Originalen förblir noll.**

Det enda du kan göra är att _plocka_ ett verk: förstora det, granska det, signera det, spara det. Signaturen gör det till ditt — ingenting gör det till ett original. Grannpunkten går inte att skilja från din, och en minikarta visar hur din väg genom rummet ständigt korsar sig själv: inga kanter, allt återkommer.

Där sitter åsiktslagret, och det är hela poängen. Du kan **signera med plånbok** — ett gratis intyg, utan blockkedja, om att just du signerade verket. Det pekar mot sin egen logiska ände: att prägla verket som NFT och betala riktiga pengar för att tillverka ägande och konstlad knapphet åt något som aldrig var nytt. Signaturen räcker för att säga det. En räknare visar hur många som signerat totalt; och när du ska signera ett verk säger maskinen hur många gånger _just det_ redan har signerats — ditt unika plock var ofta redan andras.

En ärlig fotnot, för den hör till verket: det "latenta rummet" är matematiskt simulerat, inte en riktig modell. Det spelar ingen roll för poängen — och att säga det högt är en del av den.

**Live:** [meta-matic.tor2dbear.com](https://meta-matic.tor2dbear.com) · **Källkod:** [github.com/tor2dbear/meta-matic](https://github.com/tor2dbear/meta-matic)
