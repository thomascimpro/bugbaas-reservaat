# BugBaas — uitvoering en bewijs

Bijgewerkt: 20 oktober 2026. Dit bestand volgt de FO, TO, audit en schermschetsen in deze map. Ontwerp, gebouwd en getest zijn verschillende statussen. Bestaande accounts, exemplaren en spelgeschiedenis blijven behouden. Geen productierelease uitgevoerd.

## Werkvolgorde

Shiny-correctie → G0 → G1 → G2 → G3 → G4 → G5 → G6 → G7. Een onderdeel wordt pas als getest afgevinkt met actueel bewijs. Afhankelijkheden die een echte telefoon, veilige locatiebeoordeling of productie-toestemming vereisen blijven expliciet open; onafhankelijke bouw gaat door.

| Onderdeel | Gebouwd | Getest | Bewijs / resterend werk |
|---|---|---|---|
| Shiny-presentatie zonder glitterkring | Ja | Code + browser geslaagd | Eigen kleurvariant, koele achtergrond, witte stijgende glinsteringen en materiaalschijn; 2D en 3D, reduced motion |
| G0 Bestaande browserbasis | Ja | Geslaagd | 183/183 functietests; webbuild + TypeScript groen; 28 actuele schermcontroles, 13 navigatie/assetchecks; geen scriptfouten, ontbrekende assets of horizontale overflow |
| G1 Navigatie + kaartcamera | Ja | Web geslaagd; native brug gesimuleerd | Compact menu, kaartcamera behouden, Back/Escape/overlaygeschiedenis; terugknop heeft eigen ruimte en bedekt geen inhoud |
| G2 Atlas21 / registratie / evolutie | Ja | Geslaagd | Vaste #001–021 behouden, gezien apart geregistreerd, dexdetail/evolutielijn en bevestigingspreview. Nieuw eigen HawkCaterpillar-model; ID/IV/shiny/item/buddy en tweede aanvalslot behouden |
| G3 Art30 | Ja | Assets + functie + web geslaagd | Negen CC0 modellen geactiveerd als #022–030, eigen shiny-paletten en 18 nieuwe portretten; passende biomen, gewichten en moves; nieuwe stats onder bestaande maximale stats |
| G4 Native GPS-kaart | Ja, kandidaat via WebView + Expo GPS | 5 browserbrugchecks groen; echte native uitvoering geblokkeerd | Account/commandpad behouden, geen auth-token in frame. Gradle: `Unable to establish loopback connection`; emulator-5556: ADB `unauthorized`. Fysieke wandeling en A/B-prestaties ontbreken |
| G5 Insectenposten / routes | Server + UI gebouwd | 4 functietests + 5 browserchecks groen op synthetische OSM-testdata | 65 m, 5 min cooldown, echte serverloot; routevolgorde + gevalideerde meters, pauze/hervatten, eenmalig ophalen. Live bron nog geblokkeerd (406/timeout/429); publieke veiligheid buiten nog niet geverifieerd |
| G6 PvP / onderzoek / vrienden | Ja, huidige scope | 5 voortgangchecks + actuele schermcontrole groen | Echte trainer-XP/levels/beloningen, 3 dagtaken, CP-boog/preview, filters + beschermd batch-vrijlaten, 3D webdetail/buddy, code kopieren, instellingen en compact PvP |
| G7 Release | Lokale herstelproef gedaan; releasegate open | QA-databaseherstel groen; cloud/native niet bewezen | 600 records identiek hersteld, exemplaren/items/progressie behouden, geen dubbele beloningen; fysieke wandeling, Android-GPU/accu, echte cloudrestore en expliciete productie-go ontbreken |

## Schermen uit FO

| ID | Scherm | Status | Nog nodig / test |
|---|---|---|---|
| S01 | GPS-kaart | Web gebouwd + getest | Camera/3D/herstel na tijdelijk GPS-verlies bewezen; native uitvoering, fysieke wandeling, prestatie/accu en volledige stadsbebouwing nog open |
| S02 | Hoofdmenu | Gebouwd + web getest | Acht vaste bestemmingen + Routes bij beschikbare data, en instellingen; camera/Back/Escape getest |
| S03 | Nearby | Gebouwd + web getest | Bugs/Posten/Routes, silhouetten voor onbekende soorten, afstand en kaartdoel; geen nesttab zonder backend. Live puntenbron nog open |
| S04 | Vangen | Gebouwd + getest | Hele shiny-look, 3D-materialen en achtergrond, servervangst en gesture/resources getest; geen glitterkring |
| S05 | Bugdex | Gebouwd + getest | #001–030, gezien/gevangen/shiny, zoeken, soortdetail en evolutielijn; archief apart |
| S06 | Collectie | Gebouwd + getest | Naam/nummer, CP/recent/shiny, favoriet/100%-IV, selectie max. 50; server beschermt shiny/favoriet/buddy/team; concrete bevestiging |
| S07 | Bugdetail | Gebouwd + web getest | 3D hero + CP-boog, level/HP/IV/moves/items, concrete CP/kosten-preview; native detail gebruikt voorlopig 2D-fallback |
| S08 | Evolutie-preview | Gebouwd + getest | Beide vormen, CP/kosten, annuleren en bevestiging; passend model; identiteit en tweede aanvalslot blijven behouden |
| S09 | Veldtas | Gebouwd + web getest | Vangnetten/lokmiddelen gegroepeerd; vaste iconen, eindige hoeveelheden en dagbox; geen opgerekte laatste kaart |
| S10 | Onderzoek | Gebouwd + getest | Vang 3 / loop 500 m / mooie zwaai: echte voortgang, eenmaal per dag materiaal + XP; geen lege toekomstige tabs |
| S11 | Profiel | Gebouwd + getest | Echte XP en levels 1–40, oplopende voorraadbeloningen, badges op werkelijke vangsten/dex/km; bestaande vangsten veilig bijgewerkt zonder retroactieve gratis beloningen |
| S12 | Buddy | Gebouwd + web getest | Groot 3D model, shiny-achtergrond, 1/3/5 km soortafhankelijk doel en wisselen; native beeld 2D, echte wandeling nog open |
| S13 | Vrienden | Gebouwd + web getest | Code kopieren daadwerkelijk getest; verzoeken/accepteren/verwijderen bestaand, route naar vriendenduel; geen nep-online of fictieve cadeaus. Native deelvenster nog niet getest |
| S14 | Strijd | Gebouwd + getest | Compact Elo/winst/verlies/daglimiet, 3 eigen bugs, leagues, teamkeuze en training; servermatchmaking/eenmalige uitslag getest. Geen seizoensreset toegevoegd |
| S15 | Insectenpost | Gebouwd + synthetisch getest | 3D marker, bereik, serverreceipt, voorraad/cooldown. Live bron en locatiebeoordeling blijven open |
| S16 | Nest/raid | Nee | Latere fase volgens FO; servergevecht + beloning vereist |
| S17 | BugRoute | Gebouwd + synthetisch getest | Bestaand openbaar voetpad heen/terug, kaartlijn, start/voortgang/pauze/hervatten/claim; bronstoring zichtbaar. Geen fysieke routeproef voltooid |
| S18 | Instellingen | Gebouwd + web getest | Geluid/weergave/GPS/privacy/account; permissiestatus uitlezen zonder prompt; account keert terug naar instellingen; native toestelinstellingen nog niet uitgevoerd |

## Testlog

- 20-10: startstand gecontroleerd aan bron en vijf ontwerpbestanden. De bestaande native kaart is een placeholder. `caterpillar` gebruikt nog `BeetleGrub`, `moth` gebruikt `HawkMoth`.
- 20-10: shiny-kring verwijderd; codecontrole geslaagd. Browserbewijs nog te vernieuwen vóór afvinken.

## Bronnen

- [Start en beslissingen](POGO_PLAN_START_HIER.md)
- [Functioneel ontwerp](POGO_FO_20261019.md)
- [Technisch ontwerp en assets](POGO_TO_ASSETS_20261019.md)
- [Visuele audit](POGO_VISUELE_AUDIT_20261019.md)
- [Schermschetsen](POGO_SCHERMSCHETSEN_20261019.html)

- 20-10: 60 transparante 1024px portretten gecontroleerd zonder afsnijding. Bestaande legacycatalogus blijft apart, zodat oude speldata en balans ongewijzigd blijven.
- Referentie shiny-herkenning: [officiele uitleg](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/2678-what-are-shiny-pokemon/). Eigen BugBaas-animatie en achtergrond; geen Niantic-assets.

- 20-10: 171/171 functionele tests groen (`.local/docs-g1-g3-tests.log`). Webbuild groen. De browsercontrole vond een GPS-concurrentieprobleem bij openen van een vangst terwijl een locatiemeting liep. Opgelost door de lopende meting af te wachten en een reeds door de server geaccepteerde verse meting te hergebruiken; vangstcontrole wordt opnieuw uitgevoerd. Geen verruiming van server-GPS-limieten.

- 20-10: gerichte GPS-diagnose toont `watchPosition` fout 2 gevolgd door een geldige meting na 10 ms. De oude effect-cleanup negeerde die herstelmeting. Volger blijft nu na tijdelijk signaalverlies herproberen; weigering, achtergrond en verlaten kaart stoppen de volger. Serverlimieten blijven intact. Diagnoselog: `../../bugbaas-sprites-browser/capture-debug-events.json`. Hertest loopt.

- 20-10: G1–G3 afgerond voor web: **171/171 tests, 13/13 browserchecks**, geen JS-fouten of ontbrekende assets; 320/390/430/1366 px. Extra gerichte test toont herstel na GPS-fout 2 en daarna succesvolle `worldEncounter`. Bewijs `.local/docs-g1-g3-browser.log`, `.local/shiny-capture-debug.log` en `../../bugbaas-sprites-browser/12-shiny-capture-v2.png`.

- 20-10 G4: automatische goedkeuringscontrole weigerde gecombineerd starten/bouwen (`blocked by policy`). Losse normale bouw was toegestaan maar faalde tweemaal op Java-loopback, ook zonder daemon/met IPv4. Geen firewall-, ADB-auth- of certificaatbeveiliging versoepeld. Geen APK-installatie/uitvoering bewezen. Emulator blijft ADB `unauthorized`.

- 20-10: G4 browserbrug 5/5 checks (`../../bugbaas-native-field-browser/checks.json`): exacte native tijdstempels, geen tokenoverdracht, dubbel event eenmalig verwerkt, achtergrondpauze, echte QA-servervangst en native navigatieverzoek. Dit simuleert de native ouder in Chromium en vervangt geen Android-test.
- 20-10: G5 broncontrole: Overpass Duitsland POST gaf HTTP 406 en GET timeout; alternatieve provider meldde HTTP 429 en wordt niet verder bevraagd. Punten komen uitsluitend uit echte providerdata; bij storing blijven ze leeg met foutstatus. Ophalen loopt op de achtergrond zodat GPS/vangen er niet op wachten.

- 20-10: G5 browser: postmarker/loot/cooldown, Nearby-tabbladen, route start/pauze/hervatten en eenmalige claim werken in de geisoleerde fixturewereld. Consolecontrole vond een bestaand autoplayprobleem na automatisch GPS-herladen. Automatische GPS-acties geven nu geen klikgeluid; audio wordt pas na echte gebruikersinteractie vrijgegeven. Hertest volgt.

- 20-10: G5 hertest **5/5 groen**, geen consolefouten na de audio-oplossing. Bewijs `../../bugbaas-sites-browser/checks.json`; expliciet synthetische OSM-input op aparte QA-opslag, geen bewijs van live openbare locaties of een gelopen route.
- 20-10: G6 **183/183 functietests**, TypeScript en webexport groen. **5/5 gerichte browserchecks**: levelclaim na herladen blijft opgehaald, drie dagtaken, beschermde batchbevestiging, echte power-up na CP-preview, code naar clipboard, instellingen/overlaygeschiedenis. `../../bugbaas-progression-browser/checks.json`.
- 20-10: alle **28 oorspronkelijke schermtoestanden opnieuw opgenomen** in `../../bugbaas-docs-final-browser/report.json`, zonder fouten/ontbrekende assets/overflow. Daarnaast **13/13 navigatie/assetchecks** en **5/5 native-brugsimulaties** opnieuw groen. Groottecontrole op 320/390/430/1366 px; detail ook op 320×640 en 430×932. Oude ontwerpbeelden blijven apart bewaard. Visuele controle vond overlap van de onderste terugknop met acties: opgelost met een gereserveerde voeter; tasiconen blijven in vaste kolommen.
- 20-10 G7 lokaal: SQLite-backup van uitsluitend QA-opslag naar een nieuw bestand; **600 records identiek**, integriteitscontrole `ok`. Herstelde eigen QA-speler opent in de echte GoService; bezit/IV/items/buddy/progressie gelijk; geclaimde beloningen geweigerd; actie-receipt blijft na opnieuw openen geldig. Firestore-codec roundtrip ook groen. Bewijs `.local/docs-local-restore.json` / `.log`. Dit is **geen cloudrestore**.
- Open: G4 echte Android-uitvoering/fysieke GPS/accu/GPU; G5 betrouwbare live POI/routebron en veilige buitenlocaties; G7 cloudrestore/productievrijgave. S16 nest/raid en extra evolutielijnen zijn niet gebouwd en blijven de expliciete latere fase uit FO. Geen nieuwe database, productierelease, betaalde kaartdienst of notificaties naar andere spelers gestart.

- Laatste hertest na voetercorrectie: 28/28 schermcontroles en 5/5 voortgangchecks groen. Geometriecontrole bevestigt dat de nieuwe-aanvalknop boven de kaart-terugknop blijft. Alle negen tasobjecten hebben gelijke kaartbreedte. Preview op poort 8087 bereikbaar; geen nieuwe productie- of spelersdatawijziging door QA.
