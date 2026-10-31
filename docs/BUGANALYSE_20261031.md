# BugBaas: wijzigingen en buganalyse, 31 oktober 2026

Onderzocht: `main`, commit `be1907100407edcc355a5a3e3aab09d0301ca01a`, versie **0.1.24 / Android build 25**. Vergelijkingspunt: onze eerder gecontroleerde 0.1.12 (`360c754`); sindsdien 61 commits. De Git-geschiedenis en het werkregister zijn samen bekeken; auteurschap van losse regels is niet afgeleid uit chatnamen.

Dit rapport bewaart de oorspronkelijke diagnose van 0.1.24. **De herstelstatus voor 0.1.25 staat in sectie 6.** De onderstaande analyse is geen verklaring dat de hele game foutvrij is.

## 1. Wat er sinds 0.1.12 bijgekomen is

| Onderdeel | Nieuwe of gewijzigde werking |
|---|---|
| Zwermraids | Gezamenlijke lobby, gedeelde schade, uitnodigingen, tickets, deelname op afstand, eigen vangbeloning; later raidrooster en verder zichtbare raidgyms. |
| Plaagbende | Overgenomen posten, ballon, aanbevolen team, tegenstander afgestemd op eigen CP, geredde bug en beloning. |
| Routes | Kaartlijnen, bonusbugs onderweg, kisten/badges en zelf een route opnemen, bewaren en verwijderen. |
| PvP | Seizoensrangen, beloningspad, weekbeker, Nederlandse namen, typeadvies en mini-games bij opgeladen aanvallen. |
| Vangen | Bewegende bugs, ontwijken, wind, worpreeks; rijkere belichting/onthulling en zeldzaamheidsweergave. |
| Wandelen/autovangst | Afstandstegoed, beperkte vangpogingen uit Adventure Sync-afstand, terugkomstmelding en weekdoelen 5/25/50 km. |
| Buddy/cadeaus | Buddy aaien/voeren/harten/levels; cadeaus met verrassingen en voordeel per vriendschapsniveau. |
| Collectie/balans | Herverdeelde types, familienectar/iconen, opruimhulp, beoordelingen en duidelijkere zeldzaamheid. |
| Begin van het spel | Personage in drie stappen, outfitkleuren, eerste maatje en beginnerspad. |
| Kaart/UI/assets | Meer spawns/posten/gyms, horizonpinnen, groter zoombereik, gym op afstand, kaartuitleg, logo/splash en aangepaste evolutiemodellen/portretten. |

Belangrijke verbinding: Android gebruikt de ingebouwde app voor een deel van de schermen, maar toont de kaart en de daarin geopende vensters in een webframe. Een werkende serverfunctie of webknop bewijst daardoor niet dat dezelfde actie door de APK wordt doorgelaten.

## 2. Bevindingen op prioriteit

P1 = blokkeert een normale spelactie. P2 = verkeerde werking, misleidende terugkoppeling of moeilijk herstel.

| ID | Prioriteit | Bevinding | Bewijsstatus |
|---|---|---|---|
| B01 | P1 | Plaagbende, raidacties en eigen routeacties vanuit de kaart worden door de Android-koppeling geweigerd. | Werkelijke parser aangeroepen: tien gebruikte opdrachten worden geweigerd; bronpad naar kaartvensters gecontroleerd. |
| B02 | P1 | Na uitzoomen onder 16,5 weigert Android normale navigatie vanaf de kaart. | Werkelijke parser: zoom 15 / 15,5 / 16 / 16,49 geweigerd; 16,5 en 17,6 geaccepteerd. |
| B03 | P2 | De minknop zoomt juist in wanneer de kaart onder 16,5 staat. | In de browser gereproduceerd: 15,5 wordt na een echte klik op min 16,5. |
| B04 | P2 | Een eigen route met heen-en-weersegmenten kan ondanks voldoende gelopen meters niet worden opgeslagen. | Routefuncties uitgevoerd: 799,0 geldige meters worden na vereenvoudiging 399,5 meter; stoppen wordt geweigerd. |
| B05 | P2 | Een onzekere actie kan nieuwe acties blijven blokkeren terwijl de herstelmelding is weggedrukt. | Bestaand codepad bevestigd; geen nieuwe netwerkstoringsproef uitgevoerd. |
| B06 | P2 | De Plaagbende toont dezelfde algemene melding bij technisch verschillende fouten. | Codepad bevestigd: afwijzing, verdwenen doel en ander mislukt verzoek worden achter dezelfde `false` verborgen. |
| B07 | P2 | Een verlopen of verdwenen Plaagbende wordt als “Verslagen!” gepresenteerd zonder gewonnen gevecht. | Renderpad bevestigd: iedere ontbrekende actuele invasie/ballon komt in deze succesweergave. Geen onterechte serverbeloning vastgesteld. |

### B01: opdrachten ontbreken tussen Android-kaart en spelserver

- De toestemmingslijst in `src/nativeFieldProtocolV2.ts:3` mist **`plaagFight`, `raidPass`, `raidJoin`, `raidInvite`, `raidFight`, `raidClaim`, `raidLeave`, `routeRecord`, `routeSave`, `routeDelete`**.
- Deze opdrachten worden wel aangeroepen vanuit `PlaagbendeV2`, `GoRaidV2` en `RoutesV2`. Deze schermen kunnen onder de kaart worden geopend: `ExploreV2.web.tsx:165-167`, `FieldHomeV2.tsx:99`, `GoGymsV2`.
- `ExploreV2.tsx:43` negeert een afgewezen bericht zonder antwoord. `BridgeFieldV2.web.tsx:20` wacht vervolgens **25 seconden** en geeft `false` terug. Bij Plaagbende blijft intussen “Even geduld…” staan en volgt daarna de algemene foutmelding.
- Dit verzoek bereikt de spelserver dus niet. Het is voor dit APK-codepad geen aangetoonde Firestore-storing. Hetzelfde raidscherm openen via het native hoofdmenu gebruikt een ander pad en kan wel werken; daarom kunnen knoppen op de ene plek werken en op de andere niet.
- Herstel: alleen de daadwerkelijk gebruikte kaartopdrachten gericht toelaten, bestaande parametervalidatie/auth behouden en een geldige maar niet ondersteunde opdracht direct afwijzen met een antwoord. **Hiervoor is een nieuwe APK nodig; alleen de webserver bijwerken verandert de ingebouwde lijst niet.**
- Herstelcontrole: elk genoemd kaartvenster door de echte parser/RPC-keten voeren, plus een verboden accountopdracht blijven weigeren.

### B02: camera-validatie verbreekt navigatie

- `ExploreV2.web.tsx:58` laat zoom **15–20** toe. `nativeFieldProtocolV2.ts:12` accepteert pas **16,5–20**.
- `BridgeFieldV2.web.tsx:22` stuurt de actuele camera mee bij gewone navigatie, bijvoorbeeld Bugs, Strijd, Instellingen en Profiel.
- Daardoor wordt het hele navigatiebericht bij een geldige uitgezoomde kaartstand verworpen. De kaart kent deze weigering niet; het menu sluit soms al voordat Android de opdracht verwerkt (`FieldHomeV2.tsx:69`).
- Herstel: één consistent bereik voor kaart, knoppen en native validatie. Ongeldige cosmetische camera-informatie mag een verder geldige, veilige bestemming niet ongemerkt onbereikbaar maken.
- Herstelcontrole: alle gewone bestemmingen openen bij zoom 15, 15,5, 16,5 en 20, met behoud van controles op niet-eindige/ongeldige camera-invoer.

### B03: min gebruikt een oude ondergrens

- De zoomknoppen in `ExploreV2.web.tsx:112` rekenen nog met `Math.max(16.5, ...)`.
- Na knijpen naar 15,5 gaat min daarom naar 16,5. Vanaf 16,5 doet min niets, hoewel de kaart zelf verder kan uitzoomen.
- Herstel: dezelfde grenzen gebruiken als de kaart; min mag nooit een grotere zoomwaarde opleveren.
- Herstelcontrole: echte klik bij 15 / 15,5 / 16,5 / 17,6 en afwisselen tussen knijpen en knoppen.

### B04: routevereenvoudiging verwijdert werkelijk teruggelopen stukken

- `game/routesV2.ts:30-32` gebruikt afstand tot de oneindige begin/eindlijn. Collineaire keerpunten verdwijnen daardoor.
- Reproductie met geldige kleine GPS-stappen op wandelsnelheid: **0 → 300 → 100 → 400 meter**, samen circa 799 meter. Vereenvoudiging houdt alleen 0 → 400 over.
- `stopRecording` herberekent de afstand daarna uit dit verkorte pad (`routesV2.ts:74`). De UI heeft op basis van de opgenomen meters al “Lang genoeg!” en een actieve Klaar-knop getoond (`RoutesV2.tsx:53`). Toch meldt de server vervolgens “Loop minimaal 500 m … Nu: 400 m”.
- Herstel: echte richtingswisselingen behouden bij padvereenvoudiging; opgenomen, getoonde en opgeslagen routeafstand moeten overeenkomen zonder GPS-validatie te omzeilen.
- Herstelcontrole: rechte route, bocht, gesloten lus en collineair heen-en-weerpad; kist-/afstandregels behouden.

### B05: herstel kan uit beeld verdwijnen terwijl de blokkade blijft

- `GameV2.tsx:117` bewaart een onzekere actie na een verbindingsfout/5xx. Dat is terecht om dubbele uitbetaling te voorkomen.
- “Sluit melding” wist alleen de zichtbare tekst wanneer `pending` bestaat (`GameV2.tsx:153`). De nieuwe actie wordt vervolgens in `run` geweigerd totdat de oude actie opnieuw wordt gecontroleerd (`GameV2.tsx:123`).
- Dit is geen aangetoonde permanente deadlock: een volgende actie kan de melding weer tonen. Het verklaart wel een ogenschijnlijk actieve knop die geen nieuwe spelactie uitvoert.
- Herstel: laat de veilige herstelactie vindbaar zolang iets onzeker is, of controleer dezelfde ontvangstbevestiging automatisch. **De onzekere opdracht niet zomaar wissen of met een nieuw ID herhalen.**

### B06/B07: Plaagbende-terugkoppeling onderscheidt de toestand niet

- `PlaagbendeV2.tsx:27` vertaalt een mislukte `run` doorgaans naar “Dat lukte niet. Probeer het opnieuw.” Het kaartframe ontvangt geen oorspronkelijke foutreden.
- `PlaagbendeV2.tsx:23,30` behandelt een ontbrekende actuele invasie of verlopen ballon altijd als “Verslagen!”. Een verlopen tijdvenster, verdwenen post of echt gewonnen gevecht zijn verschillende toestanden.
- Herstel: technische weigering, locatieprobleem, vertrek/verloop en echte winst apart terugmelden met korte tekst. Geen nieuwe beloning of gevechtsregels nodig.

## 3. Wat daadwerkelijk is gecontroleerd

- Volledige bestaande suite opnieuw uitgevoerd: **531/531 groen**, TypeScript groen, webexport groen.
- Browser op een apart account in een eigen **in-memory** spelserver, met gesimuleerde GPS: echte minknop geeft de verkeerde zoomrichting; Plaagballon start in de gewone webversie wel een gevecht met een bevestigde `plaagFight` HTTP 200. Geen paginafouten.
- Werkelijke Android-berichtparser direct uitgevoerd voor de genoemde opdrachten en camerastanden. Dit is sterk bewijs voor de afwijzingen, **geen fysieke Android-proef**.
- Route-opname- en vereenvoudigingsfuncties uitgevoerd met 41 geldige punten, circa 799 meter en gewone wandelsnelheid.
- Live `/api/game/info`: HTTP 200, cloudmodus, bekende spelregels, minimumclient 0.1.21. Dit eenvoudige verzoek bewijst niet dat alle geauthenticeerde spelacties werken.
- Vercel-deployment 0.1.24 staat READY. Historische foutlogs konden door de bewaartermijn niet worden opgehaald. De beschikbare laatste 30 minuten bevatten geen error/fatal-records voor deze deployment; daaruit volgt **niet** dat eerdere serverfouten afwezig waren.
- Bewijs: `.local/audit20261031/bridge-proof.json`, `route-proof.json`, `browser-proof.json`, `tests.log`, `typecheck.log`, `web-build.log` en vier screenshots. QA-token alleen lokaal en genegeerd door Git; geen persoonlijke spelerslocatie gebruikt.

## 4. Waarom de groene tests deze fouten missen

- Plaagbende-tests roepen de service direct aan, zonder Android-kaartbericht. Een werkend servercommando bewijst de ontbrekende koppeling niet.
- De cameratest gebruikt zoom 18 en extreem ongeldige waarden, maar controleert niet het geldige nieuwe bereik 15–16,5.
- Routevereenvoudiging wordt op een bocht getest, niet op collineair teruglopen.
- De eerdere `.local/scan0124.py` gebruikt voor veel schermen `element.click()` vanuit JavaScript. Dat controleert de handler, maar omzeilt echte aanraak-/klikvlakken en bewijst geen Android-RPC-doorgifte.

De kleinste nuttige aanvulling is gerichte regressiedekking op bovenstaande contracten en handelingen. Geen nieuwe brede testinfrastructuur nodig.

## 5. Afbakening

Eerst B01/B02 herstellen, dan B03/B04 en foutfeedback. Niet tegelijk opnieuw ontwerpen. Reeds bestaande accounts, collectie, IV's, voorraad en beloningen moeten behouden blijven. Nog open bewijs: echte APK-aanraking/knijpgebaren, eventuele aanvullende cloud-5xx, daadwerkelijke netwerkvertraging en fysieke GPS/achtergrondwandeling. Overlappende kaartmarkers zijn in de dichte QA-opstelling gezien, maar niet als algemene fout op echte postafstanden vastgesteld.

## 6. Herstel in 0.1.25 / Android 26

- **B01:** alle tien gebruikte kaartcommando's toegelaten; verboden opdrachten blijven geblokkeerd. Geldige commandoberichten krijgen bij afwijzing direct een foutantwoord. De echte APK heeft via de kaart een Plaagbende-gevecht in Firestore gestart.
- **B02/B03:** gedeelde zoomgrenzen 15–20 voor kaart, knoppen en native parser. Min 15,5→15 in de browser gecontroleerd; zeven min-tikken en vervolgens native Instellingen openen in de definitieve APK gelukt.
- **Extra tikfout uit emulatorproef:** DOM-kaartmarkers konden boven de cameraknoppen reageren. De kaartlaag heeft nu een eigen stapelcontext onder de bediening. Dezelfde reeks min-tikken opent geen post meer.
- **B04:** echte keerpunten en afstand tot het lijnsegment blijven behouden. De regressietest neemt de volledige geldige heen-en-weerroute op, stopt en bewaart circa 800 m.
- **B05:** een onzekere actie houdt zijn herstelknop zichtbaar; geen wegdrukbare blokkade. Hetzelfde actie-ID/ontvangstbewijs blijft behouden.
- **B06/B07:** oorspronkelijke foutreden gaat via Android terug naar het Plaagvenster; verlaten/verlopen doel krijgt geen winsttekst. Een gesimuleerde 409-fout is in de browser letterlijk in het venster gezien, met opnieuw bedienbare startknop.
- Plaagbende-artwork: Marcel, Colette en Gaston met baret en baguette; transparant WebP op ballon/post en in het venster. Actieknoppen blijven onderaan zichtbaar. Geen wijziging aan beloningen, accounts of collectie.
- De webexport wist nu Metro-cache, zodat de gebundelde appversie overeenkomt met `app.json`; een oude configversie kon anders ten onrechte het updatescherm activeren.
- **Controles:** 535/535 tests, TypeScript en webexport groen. Afbeeldingen op 320/390/430 px zonder overflow. Nieuwe eigen Android 15-emulator met synthetische GPS; bestaande emulator- en gebruikersdata behouden. APK-versie, dezelfde ondertekening, backend en 300 portretten gecontroleerd. Geen fysieke telefoon-, Health Connect- of buitenwandelingproef. Details en gevechtsbewijs staan in het release-testbestand en het werkregister.
