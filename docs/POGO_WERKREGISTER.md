# BugBaas — actuele voortgang

Bijgewerkt: 20 oktober 2026. Houd dit kort: taak, resultaat, controle en wat nog openstaat. Bestaand ontwerp is geen nieuwe todo-lijst.

## ACTUELE CHECKPOINT

**BB-52: bestaande loop volgen → vangen → eigen bug → verbeteren aangesloten; buddyafstand duidelijker.**
- `/root`: een verre Nearby-bug krijgt een gekoppeld kaartdoel. Binnen 65 m verschijnt de vangknop; verlopen/gevangen doelen verdwijnen en de kaart keert terug naar de trainer. Kaartdoel staat niet over de vangst heen. Naam blijft op smalle schermen op één regel met de volledige toegankelijke naam.
- Vanuit het bevestigde vangstresultaat opent **Bekijk bug** precies het gevangen exemplaar. Web en bestaande native-bridge geven een gevalideerde exemplaar-ID door; onbekende/niet-eigen IDs vallen veilig terug op de collectie. Native bridge accepteert dit alleen bij de collectie, zonder nieuwe spelcommando's of accountgegevens.
- Sol 6.1 `g1_g3_map`: collectie consumeert een gerichte ID bij openen/wisselen, niet opnieuw bij iedere state-update. Power-upbevestiging toont CP én HP vóór/na; beoordelen toont echte aanval/verdediging/HP naast IV. Buddy heeft een voortgangsbalk en de bestaande +1 soortnectarbeloning.
- Sol 6.1 `world_surface_finish`: compacte buddyafstandring op de kaart, uitleg bij lang indrukken en begrijpelijke lege/GPS-status in Nearby. `world_actors_finish`: dezelfde buddy opnieuw kiezen bewaart afstand ook serverzijdig; alleen werkelijk wisselen reset de basis. Geen extra candy/XP of nieuwe beloningsregels.
- **243/243 functietests, TypeScript en webbuild groen**: `.local/play-loop-tests.log`, `.local/play-loop-typecheck.log`, `.local/play-loop-web-build.log`. Browser: buddyvoortgang, geen dubbel buddycommand, doel buiten/binnen bereik na lopen, voorraadverbruik bij echte UI-vangst, gericht detail, echte power-up/IV-behoud, detail blijft gesloten na polling, terug naar kaart en automatische doelopruiming/lege Nearby. Geen browserfouten. [Resultaten en screenshots](../../bugbaas-play-loop/checks.json); [laatste kaartdoelplaatsing op 320/390/430 px](../../bugbaas-play-loop-layout/checks.json).
- Eigen QA-account met ingerichte eerdere collectie/voorraad/buddyafstand en doelverloop; echte OSM-kaart, UI/serveracties en gesimuleerde GPS. Preview 8087 bijgewerkt; productie en bestaande spelerdata behouden. Betrouwbare postenbron, fysieke Android-wandeling en cloudherstel blijven open; geparkeerde raids/evolutielijnen niet toegevoegd.

**BB-51: kaartdekking bij verder rondkijken hersteld en op acht echte kaartlocaties gecontroleerd.**
- Sol 6.1 `g1_g3_map`: 3D-bebouwing/natuur volgt het bekeken kaartcentrum; GPS blijft uitsluitend de spelpositie en plantvrije ruimte bepalen. Nieuwe brondata vernieuwt decor ook bij hetzelfde objectaantal. Gebundelde updates, bestaande aantalslimieten en eventopruiming behouden.
- De oorspronkelijke vlakke gebouwlaag stopte bij zoom 14 terwijl de oorspronkelijke 3D-laag verborgen was. Gebouwfootprints blijven nu tot zoom 24 zichtbaar, ook buiten de 100 gedetailleerde 3D-gebouwen. `world_surface_finish` voegde het passende dag-/nachtpalet toe.
- Browser — `/root`: Utrecht/Neude, Amsterdam/Vondelpark, Rotterdam/Blaak, Veluwe, Brussel, Antwerpen, New York/Central Park en Tokio/Meiji. **42 tegelverzoeken met HTTP 200, geen kaartverzoek- of browserfouten**; ontvangen vectorbestanden ook gedecodeerd op echte wegen, gebouwen, natuur en water. Geen garantie over ieder wereldwijd kaartvak of over volledigheid van OSM.
- Stad/bos: vrij pannen over **762/763 meter**, nieuwe tegels en decor, 2D/3D en hercentreren; gameplay-GPS bleef gelijk. Echte UI-vangst in Utrecht/Brussel voegt bug/stof toe en verbruikt voorraad; server weigert een te verre encounter zonder extra bug. Normale animatie bij een gesimuleerde wandeling van 20 m: trainer/camera volgen, precies 20 m voortgang. Vondelpark op 320/390/430 px zonder horizontale overflow.
- **13/13 gerichte kaarttests, TypeScript en webbuild groen**: `.local/real-map-tests.log`, `.local/real-map-typecheck.log`, `.local/real-map-web-build.log`. [Browserresultaten](../../bugbaas-real-locations/checks.json), [ontvangen kaartlagen](../../bugbaas-real-locations/actual-tile-layers.json), [bewegingscontrole](../../bugbaas-real-locations/walking-check.json).
- Echte externe kaart-/weergegevens met verse **gesimuleerde browser-GPS** en eigen QA-accounts; geen fysieke wandeling of Android-prestatiebewijs. Postenbron bleef op alle acht locaties `unavailable`; geen fictieve posten toegevoegd. Preview op 8087 bijgewerkt; spelerdata behouden, geen productiepublicatie.

**BB-50: 3D-wereld verder afgewerkt; zevendaagse vangstreeks toegevoegd.**
- Natuur/gevels — Sol 6.1: bladbomen en coniferen, struiken/bloemen/riet en contactschaduwen; warme daken, dakranden, ramen en deuren. Echte Polygon/MultiPolygon-footprints en binnenhoven behouden. Instancing/batching met vaste limieten; geen begroeiing op wegen, water of gebouwen, hoge begroeiing vrij rond trainer.
- 3D-personages — Sol 6.1-opvolger `world_actors_finish`: cosmetisch vloeiende GPS-beweging en kijkrichting, buddy, echte beschikbare insectclips, kleine idlebeweging en postcooldownkleuren. Ranger heeft alleen een idle-`Animation`, geen nieuwe loopclip. Alleen werkelijk geladen soorten schakelen hun fallbackportret uit. Dag/nachtbelichting en opruiming van gedeelde resources bijgewerkt.
- Wereldoppervlak — Sol 6.1-opvolger `world_surface_finish`: 64px gras/bos/waterpatronen, oeverlijnen op bestaande watergeometrie, warme wegen/paden en dag/nachtpalet. Geen nieuwe kaartbron of verzonnen terrein.
- Camera/GPS — `/root`: schuiner kaartbeeld, trainer lager in beeld, bovenaanzicht/3D-knop, vrij rondkijken en opnieuw volgen via GPS-knop. Laatste kaart blijft staan bij kort GPS-verlies; vangen/posten blijven afhankelijk van verse GPS. Afsluitfout tijdens camerabeweging opgelost.
- Vangstreeks — Sol 6.1 `g1_g3_map`: één voortgang per echte server-UTC-vangdag, ook autocatch. Na een gemiste dag opnieuw beginnen; na dag 7 een nieuwe cyclus. Dag 7 +500 stof en +2000 XP bovenop de bestaande beloningen; gewone vangsten blijven 100 stof. Geen login-/trainingbonus of terugwerkende beloning. Onderzoeksstempels blijven apart behouden.
- Getest: **237/237 functietests, TypeScript en webbuild groen**. Logs `.local/world-polish-tests.log`, `.local/world-polish-typecheck.log`, `.local/world-polish-web-build.log`.
- Browser: stad/bos/meadow/waterkant op 320/390/430px; 3D/bovenaanzicht, GPS-beweging, handmatig slepen/hercentreren, kaart→collectie→terug, dag/nachtpresentatie en dag-7-vangst/resultaat/profiel/herladen. Geen browserfouten. [Wereldscreenshots/resultaten](../../bugbaas-world-polish/checks.json) en [vangstreeksresultaten](../../bugbaas-world-polish/streak-checks.json). Gesimuleerde GPS; dagpreview en zes eerdere vangdagen alleen in QA ingesteld. Geen echte wandeling of toestelprestatiemeting.
- Geen productiepublicatie, spelerreset of nieuwe betaalde dienst. De bestaande live postenbron en echte Android-/cloudherstelgates blijven open. Postmodellen zijn verbeterd; geen werkende live postenbron claimen.

Vorige afgeronde spelonderdelen:

**Vier PoGO-achtige spelonderdelen uitgevoerd met drie Sol 6.1-agents en root.** Branch `codex/bb-01a-qa-records`.
- Collectie — `g1_g3_map`: naam/dex, CP-bereiken, IV-sterren, shiny/favoriet/buddy/team; combineren met `&`/`!`, snelkeuzes, reset en waarschuwing vóór een power-up een leaguegrens overschrijdt.
- Onderzoek — `g4_android`: één stempel per serverdag bij de eerste opgehaalde dagtaak. Gemiste dagen wissen niets. Iedere zeven stempels automatisch 500 nectarstof, 10 veldnetten, 2 lokbloemen en 1 snelle TM. Bestaande claims/XP blijven behouden.
- Vrienden — `g5_live_world`: eerste echte dagvangst (ook auto) geeft een habitatkaart, max. 10 in de tas. Sturen/openen werkt via bestaande servertransacties/receipts; één cadeau per vriend per dag, geen nieuw zolang ongeopend, maximaal één vriendschapspunt per paar per dag. Harten op 1/7/30/90 dagen en kaartenalbum. Openen: 5 veldnetten, 1 lokbloem, 100 stof. Her-toevoegen reset de cadeaugeschiedenis niet. Geen locaties gedeeld.
- Vangen/HUD — `/root`: geanimeerde vangstfeedback met bevestigde CP/XP/stof/soortnectar, badge voor nieuwe soort en knop naar de collectie. Echte eindige netvoorraad. Klaarstaande onderzoeken, cadeaus en dagbox krijgen een kleine cijferbadge.
- Getest: **219/219 functietests, TypeScript en webbuild groen**. Logs `.local/pogo-slice-tests.log`, `.local/pogo-slice-typecheck.log`, `.local/pogo-slice-web-build.log`.
- Browser: echte vangst, combinatiezoekfunctie/reset, CP-waarschuwing, zevende stempel/eenmalige beloning en twee spelers die vrienden worden/cadeau sturen/openen. 320/390/430 px bekeken; geen browserfouten. [Screenshots en resultaten](../../bugbaas-pogo-slice/checks.json). Alleen geïsoleerde QA-accounts, ingerichte testvoortgang en gesimuleerde GPS; geen echte wandeling.
- Eerder afgerond: BB-01a (`4181c33`); kaartbebouwing/GPS-opruiming/providerfouten (`b6fdb4a`). Stad 100 gebouwen en bos 160 bomen eerder browsergetest; geen nieuwe kaartscan nodig voor deze spelonderdelen.

**Resterende concrete blokkade: BB-70 — toegestane werkende live bron voor posten/routes.** Bestaande providerweigering niet opnieuw blijven proberen. Androidbouw blijft apart geblokkeerd door Java-loopback. Extra testselectie/runner/CI bouwen we nu niet; zie het [eenvoudige plan](superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md).

## Stand per onderdeel
| ID | Onderdeel | Stand / resterend |
|---|---|---|
| BB-00 | Eigen Git-repo | Klaar: baseline `ab57e804118251ab2ca184a9eff200932555467c`. Niet opnieuw initialiseren. |
| BB-01a | Bewijsregistratie | Klaar + gericht getest, zie checkpoint. |
| BB-01b/c/d | Extra QA-automatisering | Geparkeerd; geen voorwaarde voor verder spelwerk. |
| BB-10 | Menu/navigatie/camera | Web gebouwd, eerder browsergetest. Alleen hertesten bij relevante wijzigingen. |
| BB-20 | Dex/collectie/detail/evolutie | Web gebouwd: #001–030 en rups → mot; uitgebreid zoeken en CP-grenswaarschuwing getest. Native detail nog 2D-fallback. |
| BB-30 | 3D-bugs en shiny-art | 30 soorten en 60 portretten gebouwd; eerdere artcontrole beschikbaar. |
| BB-40 | Tas/dagtaken/trainer/buddy/vrienden/PvP | Web gebouwd; stempelboek, cadeaus, vriendschap en zevendaagse vangstreeks getest. PvP-regels behouden. |
| BB-50 | Webkaart/GPS/vangen | Werelddecor/camera bijgewerkt; verder pannen en volledige vlakke bebouwing hersteld. Acht echte kaartlocaties, twee vangsten en gesimuleerde wandeling gecontroleerd; zie BB-51. |
| BB-60 | Android | GPS-start/stop-race opgelost, 7 gerichte tests groen. Echte uitvoering geblokkeerd door Java-loopback en ADB unauthorized. Fysieke wandeling/GPU/accu open. |
| BB-70 | Posten/routes | Cache/foutafhandeling verbeterd, 10 gerichte tests groen. Toegestane betrouwbare live bron en veilige buitenroute open; providerblokkade niet omzeilen. |
| BB-80 | Nesten/raids | Later, niet gebouwd. |
| BB-90 | Release/cloudherstel | Lokale QA-restore geslaagd (600 records); echte cloudrestore, Android-wandeling en productieakkoord ontbreken. |

## Bewijs en regels
- [Historisch uitvoeringsverslag](POGO_UITVOERING.md): eerdere 28 schermchecks, 13 navigatiechecks, 5 native-brugchecks en 5 synthetische post/routechecks. Dit is geen nieuwe run op iedere wijziging.
- Unit-/TypeScript-runs voor BB-01a staan in `qa/runs.jsonl`; de nieuwe spelcontroles staan in bovenstaande logs en screenshots. Geen volledige schermscan herhaald.
- Browserbrug ≠ echt Android. Synthetische punten ≠ veilige live route. Oude auteurs blijven onbekend als ze niet aantoonbaar zijn.
- Geen productiepublicatie, reset van spelerdata of remote push uitgevoerd.

## Bijwerken na een taak
Eén korte notitie volstaat: **taak — gedaan — getest (commando of screenshot) — eventueel geblokkeerd — volgende stap**. Gebruik het bestaande bewijs waar dat nog relevant is; bouw geen extra administratie om een gewone fix heen.

Mechaniekreferenties: [collectiezoeken](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/1486-searching-filtering-your-pokemon-inventory/?pgo_client=iOS), [onderzoeksstempels](https://pokemongo.com/news/research), [cadeaus](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/85-sending-receiving-gifts/?game_client=iOS&l=en). BugBaas gebruikt eigen assets en bovenstaande eigen beloningsbundels.

Ontwerpdetails: [FO](POGO_FO_20261019.md) en [TO](POGO_TO_ASSETS_20261019.md). [Testmatrix](POGO_TESTMATRIX.md) is een hulpmiddel, geen verplicht traject voor iedere wijziging.
