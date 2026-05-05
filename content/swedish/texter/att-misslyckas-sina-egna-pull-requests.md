+++
title = "Att misslyckas sina egna pull requests"
date = "2026-05-04"
author = "Torbjörn Hedberg"
draft = false
hidden = false
description = "Om att köra en kvalitetsgrind på en personlig portfolio — vad som blockerar en merge, vad som inte gör det, och varför alls bry sig"
tags = ["ci", "kvalitet", "portfolio"]
topics = []
slug = "texter"
translationKey = "failing-your-own-pull-requests"
+++

Det finns ett steg i CI-pipelinen för den här portfolion som kontrollerar om sidan är tillräckligt snabb, tillräckligt tillgänglig och tillräckligt välstrukturerad för att få mergas. Om den inte är det misslyckas pull requesten.

Det här är en personlig webbplats. Det finns inget team. Ingen granskar koden. Den enda som blockeras av en misslyckad kvalitetsgrind är jag själv.

Det tog ett tag att bestämma om det gav någon mening.

## Vad systemet faktiskt kontrollerar

Varje pull request kör Lighthouse och axe-core mot en lokal bygge av sidan. Lighthouse mäter prestanda, tillgänglighet, bästa praxis och SEO — poängsatt 0 till 100 per kategori. axe-core söker igenom sidan efter tillgänglighetsproblem och klassificerar dem efter allvarlighetsgrad: kritisk, allvarlig, måttlig, mindre.

Resultaten sammanställs i en rapport som postas som en kommentar på pull requesten. Det mesta som hamnar i den rapporten blockerar ingenting — det är bara synligt, liggande i en backlog. Men vissa saker blockerar faktiskt. PR:n mergas inte förrän de är åtgärdade.

Gränsen mellan "blockera" och "bara rapportera" var den intressanta designfrågan.

## Vad som faktiskt blockerar en merge

Tre kategorier av saker misslyckas grinden:

**Tillgänglighetsbrister med kritisk eller allvarlig påverkan.** Inte måttliga. Inte mindre. Tröskeln är kalibrerad mot saker som faktiskt gör innehåll oanvändbart — saknade etiketter, trasig tangentbordsnavigering, bilder utan alt-text i meningsfulla sammanhang. Måttliga brister visas i rapporten under en "åtgärda snart"-etikett. Mindre hamnar i backloggen. Ingen av dem stoppar en merge.

Resonemanget är enkelt nog: allvarliga tillgänglighetsproblem är inte poleringsdetaljer. De är fel. En sida som är visuellt klar men trasig för en skärmläsaranvändare är inte faktiskt klar.

**Valfri Lighthouse-kategori under sitt golv.** Prestanda måste hålla sig över 65. Tillgänglighet, bästa praxis och SEO måste var och en hålla sig över 90. Det är olika trösklar av en anledning — prestanda är flyktigt och svårare att hålla högt, så golvet är satt lägre. De andra tre kategorierna är lättare att upprätthålla när de väl är stabila, så ribban är högre.

**Prestandaregression på mer än 5 poäng från baslinjen.** Den här är mer subtil, och unik för prestanda. Resonemanget är att prestanda försämras tyst och stegvis — lägg till ett lite tyngre typsnitt, glöm att lazy-loada en bild, dra in ett lite större beroende, och poängen kryper nedåt utan att någon märker det. Regressionströskeln fångar den driften innan den förvärras.

Tillgänglighet, bästa praxis och SEO har inte samma problem. När de väl är stabila tenderar de att förbli stabila om inte något aktivt går fel — och "något som aktivt går fel" är precis vad det absoluta golvet fångar.

## När verktygen själva misslyckas

Det finns ett fjärde block: om Lighthouse eller axe misslyckas med att producera resultat överhuvudtaget, blockeras pull requesten.

Det här handlar mer om filosofi än mätning. Systemet tolkar inte saknade data som "ingenting fel" — det tolkar det som "vi vet inte, anta det värsta." En ostabil CI-körning som inte producerar någon output behandlas likadant som en körning som hittade kritiska fel. Mergen kräver en lyckad omsörjning.

Det här är mer konservativt än vad som behövs för en personlig sida. I praktiken innebär ett tyst verktygsfel förmodligen ett tillfälligt CI-fel, inte ett verkligt problem. Men alternativet — att tillåta tyst misslyckade kontroller att passera — skapar ett gap där grinden existerar men inte faktiskt upprätthåller något. Det konservativa tillvägagångssättet är enklare och mer ärligt om vad grinden är till för.

## Vad rapporten gör med allt annat

Rapporten som visas på varje PR är medvetet generös. Bortom blockers lyfter den fram de bästa Lighthouse-möjligheterna per rutt — saker som att servera bilder i moderna format, minska JavaScript-exekveringstid, förbättra cache-headers. Den listar också axe-moderata och -mindre brister. Ingenting av det blockerar. Allt är synligt.

Idén är att en kvalitetsgrind inte behöver välja mellan "blockera det" och "ignorera det." Det finns ett tredje alternativ: lyft fram det, låt det samlas i en synlig backlog, och hantera det när det spelar roll. Blockers är det som spelar roll nu. Backloggen är det som spelar roll så småningom.

## Varför upprätthålla det alls

En personlig portfolio behöver ingen kvalitetsgrind i någon funktionell mening. Att pusha direkt till produktion fungerar bra. Sidan laddas. Ingen får sparken.

Grinden finns av en annan anledning: en portfolio är ett argument om hur man arbetar, och det är ett svagt argument om sidan själv inte återspeglar det. Att köra Lighthouse och axe-core på varje pull request och publicera resultaten i en PR-kommentar är ett beslut som sitter i koden, inte i prosan. Det är synligt för vem som helst som tittar på repositoryt. Det håller eller så gör det inte det.

Det finns också en mer praktisk anledning. Utan en kvalitetsgrind är "jag fixar tillgänglighetsproblemen senare" en mening som sägs och sedan glöms bort. Blockern gör "senare" till ett specifikt tillfälle snarare än en avsikt.

Om det är värt installationstiden är en rimlig fråga. Det är det förmodligen inte, rent effektivitetsmässigt. Men effektivitet är egentligen inte vad portfolion mäter.
