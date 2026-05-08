+++
title = "Att designa i det inneboende materialet"
date = "2026-05-08"
author = "Torbjörn Hedberg"
draft = false
hidden = false
description = "Skissa för att förstå, koda för att veta"
tags = ["design", "verktyg", "process"]
topics = []
slug = "texter"
translationKey = "designing-in-the-native-material"
+++

*Arbetsutkast — maj 2026*

Jag skriver det här mitt inne i något jag ännu inte vet hur jag ska avsluta.

Under större delen av mitt yrkesliv har jag hellre designat direkt i det material som produkten faktiskt är gjord av. På sent nittiotal innebar det att justera CSS i en webbläsare, dra i fönsterstorlekar, ändra värden i realtid. Redan då kändes det självklart för mig att webben i sig var en designmiljö. Webbläsaren var inte en förhandsvisning av arbetet. Den var arbetet.

Den känslan har aldrig lämnat mig, men i två decennier har jag arbetat runt den. Branschen byggde en enorm infrastruktur kring glappet mellan design och kod. En del av den är översättning — handoff, specifikationer, prototypers trovärdighet — och en del, som designsystem och tokenarkitekturer, är något mer beständigt: ett sätt att fatta beslut som överlever vilken enskild representation som helst. Det är översättningslagret som håller på att kollapsa nu. Beslutslagret gör det inte. Tvärtom blir det allt viktigare — och det är en del av varför jag har hamnat där jag är.

Det här är ingen text om huruvida den infrastrukturen var fel. Annat jag har skrivit har försökt göra det argumentet mer noggrant. Det här är en text om hur det känns att vara personen mitt i förflyttningen.

 

Det är det här jag märker.

När jag öppnar Figma nuförtiden är det sällan för att definiera en produkt. Det är för att tänka. Det jag vill, mer än något annat, är att se ett flöde som en enda form — från ingång till utgång, inte skärm för skärm. Jag vill kunna lägga alternativ bredvid varandra. Jag vill kunna lämna en halvfärdig idé synlig medan ett beslut sätter sig, så att nästa tanke kan landa någonstans där den syns.

Canvasen är, för mig, inte i första hand en representation av mjukvara. Den är en kognitiv miljö. Det är platsen där jag kan rymma mer än vad jag rymmer i huvudet.

Det är den här delen som överraskar mig. Jag förväntade mig att canvasen skulle kännas allt mindre nödvändig i takt med att mer av mitt arbete flyttade in i kod. Det motsatta har hänt. Ju mer jag arbetar i produktionskodbasen, desto mer förlitar jag mig på canvasen för en annan sorts tänkande — det spatiala, jämförande, perifera. Kod är utmärkt för nästan allt, utom att se flera saker samtidigt.

 

Det har tagit mig en stund att hitta rätt ord för vad canvasen faktiskt är.

Den är inte en representation. Den är en skiss. Och en skiss är inte samma sorts objekt som en mockup.

En skiss är ett sätt att ställa en fråga i låg upplösning. Den kan ske på en servett, på en whiteboard, på en Figma-canvas, i en marginal. Mediet spelar knappt någon roll. Det som spelar roll är att skissen låter mig hålla en idé tillräckligt löst för att kunna pröva den mot en annan idé, jämföra två möjliga former för samma problem, se om något är värt att gå vidare med innan jag lägger energi på att bygga det.

En mockup är något annat. En mockup försöker se ut som svaret. Den klär en obekräftad idé i kläderna från en avgjord. Det är det som gör högupplösta mockups obekväma för mig nu — inte att de representerar, utan att de överrepresenterar. De ser avgjorda ut när ingenting har avgjorts.

Så uppdelningen jag litar på är inte mellan canvas och kod. Den är mellan att skissa och att verifiera. Canvasen är där jag skissar. Koden är där jag får veta om skissen stämde.

Det är mediet som blir ärligt med sig självt. En skiss i vilket medium som helst kan vara en fråga. Bara det körande systemet kan vara ett svar.

 

På jobbet håller jag på att flytta produktionskodbasen mot att bli den enda källan till sanning för vår design. Komponentbiblioteket jag har underhållit parallellt, med egen Storybook och designstudio, håller på att flyttas — från något som speglar produktionen till en plats där jag kan skissa snabbt och billigt mot riktiga komponenter. Det migreras in i produktionsrepot. Det finns en Storybook-inventering att göra innan jag ens kan börja ta itu med token-driften mellan vad designen avser och vad utvecklarna har byggt.

Inget av det här är glamoröst. Det är till stor del organisatoriskt och infrastrukturellt. Men på daglig basis är det vad abstraktionerna i mina andra texter faktiskt ser ut som. Översättningslagrets kollaps är ingen plötslig händelse. Det är en lång sekvens av små, oromantiska beslut om var sanningen i en design nu bor, och var frågorna om den fortfarande kan ställas.

Jag märker att min roll förändras inne i det här arbetet. Jag lägger mindre tid på att producera skärmar och mer tid på att se till att produktionskodbasen är ett bra designmedium — för mig själv, för utvecklarna jag arbetar med, och numera också för AI-agenter som i ökande grad deltar i att skriva koden. Den sista delen är ny, och jag har ingen färdig hållning till den ännu.

 

Det finns en version av den här berättelsen där egentligen ingenting har förändrats.

Arkitekter har alltid rört sig från skiss till modell till ritning till byggnad. Varje mogen designdisciplin har en lågupplöst form för att tänka och en högupplöst form för att fatta beslut. Skissens medium varierar — kol, frigolit, CAD — men gesten är densamma. Ställ frågan löst. Besvara den exakt.

Det som är annorlunda för mjukvaran är inte gesten. Det är avståndet. Under det mesta av designens historia höll kedjan från skiss till artefakt eftersom artefakten inte enkelt kunde göras ogjord. En byggnad kan inte ombyggas. En tryckt bok kan inte sättas om efter upplagan. Representationen fanns i mellanrummet eftersom produktionen var dyr och enkelriktad.

Mjukvarans kedja är kortare nu, eftersom artefakten och prototypen alltmer delar material. Jag kan ställa en fråga på en servett och verifiera svaret i kod samma eftermiddag. De mellanliggande representationerna — den högupplösta mockupen, klickprototypen, specifikationen — byggdes för en längre resa än den vi fortfarande är på.

Formen på designarbetet i den här kortare kedjan är vad jag försöker lära mig.

 

Det jag har börjat lita på, åtminstone tills vidare, är mindre och mer praktiskt än jag väntade mig. Skissa för att förstå. Koda för att veta. Skissens medium spelar mindre roll än jag en gång trodde; verifieringens sanningshalt spelar större.

 

Och nästan i samma andetag, nästa fråga.

Jag har börjat undra om koden kan bli skissen också. Och, bortom det — om den skulle kunna bli canvasen. Om mediet i sig har blivit tillräckligt snabbt, tillräckligt formbart, tillräckligt spatialt, för att jag skulle kunna hålla en idé löst i det, se flera samtidigt, ta reda på om jag har rätt — allt på samma plats.

Jag vet inte ännu. Uppdelningen jag just har ägnat den här texten åt att beskriva — skissa på ett ställe, verifiera på ett annat — kan visa sig vara den rätta nu och den fel om fem år. Jag är misstänksam mot mina egna slutsatser i proportion till hur rent de anlände.

Det jag vet är att det här är det mest intressanta som ligger framför mig just nu. Jag har canvasen öppen. Jag har kodbasen öppen. Och jag är uppmärksam på vad som händer i kanten mellan dem.
