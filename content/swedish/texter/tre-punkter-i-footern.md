+++
title = "Tre punkter i footern"
date = "2026-05-03"
author = "Torbjörn Hedberg"
draft = false
hidden = true
description = "Varför den här portfolion har en Pantone Color of the Year-spelare, och vad det krävde att bygga den ordentligt"
tags = ["design", "färg", "portfolio"]
topics = []
slug = "texter"
translationKey = "three-dots-in-the-footer"
+++

Temapanelen på den här sidan har ett Pantone-alternativ. De flesta besökare hittar det förmodligen inte — inte för att det är dolt, utan för att det inte annonserar sig självt. Du öppnar panelen, ser det, aktiverar det eller inte.

Gör du det dyker en liten spelare upp i footern. Tre punkter, ihopfälld. Håll muspekaren över dem så expanderar den: play, pause, föregående, nästa, blanda. Tryck play och hela sidan byter långsamt färg — den arbetar sig igenom Pantones Color of the Year-arkiv, alla tjugosju år, från Cerulean Blue år 2000 till Cloud Dancer 2026.

Det är byggt så här med avsikt. Funktionen påtvingar sig ingen. Den väntar på de som letar.

## En färg om året

Pantone har utsett en Color of the Year sedan 2000. På ytan är det en marknadsföringsövning — ett färgföretag som påminner dig om att färg är viktigt, med en årlig pressrelease på köpet. Men följer man valen över tid framträder en annan bild.

Mimosa 2009 — ett varmt, optimistiskt gult — anlände i januari, dagarna efter att finanskrisen hade slagit ut förtroendet för i princip allting. Pantone beskrev det som att framkalla "solens värme och näring." Classic Blue 2020: en färg vald månader innan pandemin, marknadsförd som något som "ingjuter lugn, trygghet och samhörighet" — som om någon tyst hade anat att det var precis det folk snart skulle behöva. 2016 namngav de två färger för första gången: Rose Quartz och Serenity, ett par som närmade sig frågor om kön och identitet som de flesta institutionella färgval noga undviker. Och 2022 uppfann de helt enkelt en ny färg — Very Peri, ett blåviolett med röda undertoner som inte tidigare existerade i Pantone-systemet — för att, uppenbarligen, året krävde något nytt.

Man kan argumentera för om de läser kulturen eller bara är bra på att låta som det. Hur som helst är tjugosju år av val ett intressant arkiv.

## Man kan inte bara säga att man bryr sig om färg

Jag är en designer. Jag bryr mig om färg. Det säger alla designers. Det finns på varje portfolio, i varje intro, inbäddat i varje case study. Det betyder ingenting längre.

I ett skede tröttnade jag på att försöka skriva mig till trovärdighet och bestämde mig för att bygga mig dit istället. Den här funktionen finns inte här för att den är användbar. Ingen anlitar en designer för att deras portfolio bläddrar igenom Pantone-historiken. Den finns här för att det är en specifik, lite udda grej som bara någon som faktiskt tycker om färghistoria för dess egen skull skulle lägga ner den här mycket tid på.

## Hur det hamnade här

Det började inte som en COTY-funktion. Sidan hade en uppsättning paletter — några olika färgalternativ en besökare kunde växla mellan — och Pantones aktuella år var ett av dem. Det är en rimlig sak att bygga. Flera paletter, COTY som ett trevligt tillskott.

Vid ett tillfälle tog jag bort allt utom COTY. Det kändes mer ärligt. En uppsättning generiska paletter säger "här är några alternativ." Tjugosju år av ett specifikt färgarkiv säger något annat. Det är ett åtagande till en idé snarare än en flexibilitetssäkring.

## Vad det faktiskt innebär att välja ett år

Att välja ett år byter inte bara ut en enskild färg — det räknar om hela systemet. Varje yta, textfärg, ram och bild på sidan härleds från det årets källfärg. Systemet avgör om färgen ska fungera som den primära handlingsfärgen eller som en ytonalitet, baserat på dess kontrast mot vitt. Sedan bygger det en tolvstegsscala från den och applicerar alltihop på sidan. Övergången tar ungefär fyra sekunder.

Att få bilderna rätt tog längre tid än resten sammantaget.

Den första versionen använde ett monotont blend — bilder tonades mot COTY-färgen. Det var tekniskt enkelt och såg platt ut direkt. Monoton kollapsar all tonalinformation i en bild till en dimension; man förlorar känslan av att ljus träffar något. Duotone var bättre — att mappa skuggor till en färg och högdagrar till en annan gav tillbaka viss dimensionalitet. Men med COTY-färger behöver källfärgen ofta leva någonstans mellan extremerna, inte bara i skuggan eller högdagersänden. Det var det som drev fram tritone: tre mappade punkter — mörkt, källfärg, ljust — med källfärgen förankrad i mellantoner. Bilderna såg äntligen ut att tillhöra paletten snarare än att bara vara färgade av den.

## Den del som visade sig vara svår

Skalorna. Planen var att algoritmiskt generera en bra tolvstegsskala från varje års hex-värde — skriv matematiken en gång, applicera på alla tjugosju år.

Matematiken lever i OKLch, ett färgrymdsformat byggt kring perceptuell jämnhet, där ett steg i valfri riktning ska kännas lika stort visuellt oavsett nyans. Varma och kalla färger behöver fortfarande olika chromakurvor — rödtoner desatureras mot mörkare steg annars ser de gyttjiga ut, blå kan bära mer saturation i mellantoner. Det finns nyansjusteringar, ankarpunktslogik som låser källfärgen till ett specifikt steg i skalan, gamutmappning för att hålla värden inom sRGB.

Det räckte ändå inte.

Inte nära-men-acceptabelt. Bara inte tillräckligt bra. En genererad skala för Marsala (2015) eller Sand Dollar (2006) skulle producera resultat som såg tekniskt korrekta ut — nådde rätt ljushetsvärden, höll sig inom gamut — och kändes fel på sätt som var svåra att artikulera men uppenbara när man tittade på dem ett tag. Färg är delvis ett perceptuellt problem och delvis ett estetiskt, och algoritmen kunde bara lösa den första halvan.

Så skalorna är manuella. Tjugosju år, var och en med en ljuslägesskala och en mörklägesskala, de flesta byggda eller kraftigt omarbetade för hand, steg för steg. Det tog lång tid, och det är den del av projektet som är svårast att visa för någon — det finns ingen smart kod att peka på, bara massor av värden i en TOML-fil som nåddes genom att titta noga.

## Om det var värt det

Beror på vad "värt det" betyder.

Om frågan är om det tjänar sin plats i en portfolio funktionellt, förmodligen inte. Om frågan är om det säger något som inte hade kunnat sägas genom att skriva "jag har ett intresse för färgsystem" — det tror jag att det gör.

Det finns en version av portfoliobyggande där man beskriver sig korrekt och hoppas att någon tror det. Det finns en annan version där man bygger det som bara skulle existera om beskrivningen vore sann. Jag föredrar den andra versionen, även när det är en musikspelare för färger.
