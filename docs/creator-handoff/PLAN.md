# Eén BugBaas volgens de TO/FO-previews

Versie 3 — 4 november 2026.

**Uitvoering 9 november:** [0.1.38](../releases/0.1.38.md) bouwt de nieuwe onderbalk en één gedeelde Arcade-rang voor alle zeven games. Ranked wisselt zonder spelersscores score achterlaten en optionele botduels af; echte spelersscores krijgen voorrang. De concrete Arcade-regels in het releasebewijs vervangen hiervoor het eerdere voorstel voor uitsluitend Strijd. Claude's overgedragen animaties/materialen blijven behouden. Het onderstaande afzonderlijke Arena-ontwerp is niet volledig als nieuwe Arena-ladder geïmplementeerd.

**Ontwerpaanvulling 9 november (voorstel, nog niet gebouwd):** [Strijd, acht rangen en seizoensbeloningen](STRIJD_RANGEN_SEIZOENEN_20261109.md). Sluit aan op de voorgestelde onderbalk Kaart/Bugs/Arcade/Tas, met Strijd binnen Arcade. Bevat expliciet de voorgestelde wijziging dat vaste computertrainers Arena-punten kunnen geven zodat de klim ook solo werkt. Geen gameplay-, belonings-, account- of databasewijziging door deze ontwerpaanvulling; de beschreven cijfers zijn startwaarden voor een speeltest.

**Laatste gebruikersbesluit:** behoud de originele BugBaas-mechanics en kopieer de bestaande spelcode. Verbeter alleen gericht met squadsteun, betrouwbare invoer/rewards en duidelijke gamekeuze/ranked. De hieronder nog genoemde eerdere remakes zijn historische uitvoeringsdetails; de originele beweging, sprongen, towers, powerups, combo’s en levels gaan voor. Claude doet presentatie/3D/animaties.

 Opdracht: dezelfde professionele natuurwereld en bediening in kaart, verzamelen, upgraden, Arcade en gevecht. Codex bewaakt het geheel, spelmechanieken, balans, bronnenonderzoek en gerichte bug-/speltests. Claude verzorgt schermindeling, visuele uitvoering, 3D en animaties binnen de previews. Sol 6.1 op zeer hoog verzorgt technische modules en integratie. De gebruiker heeft deze verdeling en uitvoering gevraagd. Dit plan vervangt conflicterende taakverdelingen in oudere voorstellen; bestaande werkbestanden blijven behouden.

## Technische status 4 november

De zeven originele Arcadeports, gedeelde appbediening, Spelen/Oefenen/async Ranked, serverreplay en eenmalige dag-/weekbeloningen zijn lokaal aangesloten. 673 tests, TypeScript en webexport groen; zeven gamebedieningen in de browser en één volledige Tikduel-beloning bewezen. Geen nieuwe APK of live cloudpublicatie. Details/bewijs: `../POGO_WERKREGISTER.md` en `sections/tester.md`. Claude werkt de presentatie af; `progress.json` blijft diens gezamenlijke tracker, hier niet parallel overschreven.

## Het eindbeeld

Eén app opent op **Kaart** bij je echte locatie. Eén vaste onderbalk biedt **Kaart · Arcade · Bugs · Strijd**. Dezelfde squad, exemplaren, stats, moves, held items en voorraad werken overal. De kaart is geen achtergebleven apart deel en Arcade is geen los venster met een tweede navigatiebalk. De tijdelijke extra Arcade-knop uit de eerste lokale proef verdwijnt zodra de gezamenlijke navigatie wordt aangesloten.

Volle natuurlijke HD-scènes, donkere teal-glaspanelen, dunne lichte randen, één cyaan hoofdknop, kleine echte iconen en leesbare echte getallen. Geen witte lijstvellen of nieuwe kleurthema's naast dit ontwerp. Decor blijft op de achtergrond; informatie in één oogopslag. Hoofdknoppen 1–2 woorden, hoogstens één doelzin, details achter (i)/400 ms hold. Algemene fouten mogen kort zijn, maar mogen niet de werkelijke oorzaak of herstelactie verbergen.

De bestaande kaart blijft echte geografie tekenen, met straten, gebouwen, water, natuur en bereik. P01-v2 bepaalt de plaatsing en sfeer, niet fictieve wegen op een bitmap. Biomen en weer blijven speldata. Alle belangrijke hitdoelen minimaal 48 px. Beelden behouden hun verhouding; achtergronden cover, figuren contain, knoppen als schaalbare UI, geen tekst/getallen in de bitmap.

## Visuele bron per onderdeel

Alle beelden onder `../../../bugbaas-creatorpakket-20261102/previews/`.

| Onderdeel | Gekozen voorbeeld | Verplichte uitwerking |
| --- | --- | --- |
| Kaart, menu, Arcadehome | P01-v2, P22 | Eén gedeelde onderbalk; volle kaart; één Speel met volgende game |
| Start/account/trainer | P02 | Logo zonder witte plaat, korte keuze; gekozen portret past bij model-ID |
| Netvangen | P03 | Vrij vangveld; netveeg, gekozen net/lokmiddel, korte bevestigde uitkomst |
| Bugs en team | P04, P05, P19 | Raster, CP/type, kort detail, squad, upgrades en echte evolutielijn |
| Lopen, cocons, buddy | P07, P08, P17 | Echte voortgang; compacte terugkomst, geen eindeloze beloningspagina |
| Scores/vrienden | P09, P16 | Eerdere score herkenbaar; geen nep-live tegenstander |
| Gym/raid | P10, P20 | Rustige tabs, herkenbare baas/verdediging, duidelijke vervolgactie |
| Tikduel/Webrenner/Nestwacht | P13 | Eerste/tweede/derde paneel; één gebaar per game |
| Windvlucht/Vlinderjacht/Bladtoren | P14 | Eerste/tweede/derde paneel; geen extra knoppen toevoegen |
| Bubbelzwerm | P15 | Richtveld en volgende bubbel, geen uitgebreide zijbalk |
| Actieduel | P00, P18 | Groot speelveld, twee typegekleurde charges, twee ontwijkingen |
| Plaagbende | P23, P24 | Portret, één doel, één spel, één Speel; Frans/Grieks via uiterlijk |
| Settings/help/medailles | P11, P12, P21 | Gedeelde componenten; korte hulp en duidelijke progressie |

Voor Arcade-mechanics gaat het gebruikersbesluit van 4 november met de oorspronkelijke spelcode onder `game/arcade/original/` voor oudere remake-regels in `01_GAMEONTWERP.md`, `games.json` en schermcontracten. De gekozen previews blijven de visuele bron. Geen scherm letterlijk als achtergrond gebruiken. Vergelijk de echte screenshot met het juiste paneel: compositie, figuurschaal, marges, HUD, kleur, hoofdactie en hoeveelheid tekst.

## Wat de speler doet

**Buiten:** lopen/fietsen → echte kaartbugs/posts → netvangen of wandelvangsten volgens `WALK_CATCH` → dex, stof, familie-nectar, cocons en buddyprogressie. **Binnen:** één Speel → korte Arcade of opgeslagen squadtegenstander → score/kleine reward → team verbeteren → opnieuw. **Samen:** eerdere scores en opgeslagen teams werken met minder dan vijf spelers; echte live Arena blijft een bewuste aparte optie. **Langere doelen:** evolutiefamilies, shinycollectie, betere squads, medailles en bestaande rang/gyms/raids.

Geen aparte Arcadecollectie, gearlevels, talentboom, nieuwe betaalmunt of tweede accountdatabase. Geen verlies van bugs, upgrades, stof of medailles bij een gemiste dag; de bestaande vangstreeks kan opnieuw beginnen. Oude foto-/safarifuncties worden niet stil opnieuw hoofdonderdeel. Bestaande accounts, IDs, IV, shiny, historie, voorraad, vrienden en ratings blijven behouden.

Arcadehome toont één voorbereide volgende ronde. Geen zeven verplichte keuzes. Eerste drie introducties: Tikduel, Nestwacht, Bubbelzwerm. Daarna bestaande gewichten en laatste twee uitsluiten uit `games.json`; keuze wordt servergebonden bewaard. Alleen volledig aangesloten games worden vrijgegeven. Een ongebouwde game krijgt geen lege knop of nepbeloning.

## Volledige game betekent méér dan beweging

Een game is pas klaar met alle onderstaande onderdelen:

1. Heldere lobby met één doel, dezelfde eigen squad en één Speel.
2. Geladen benodigde assets vóór het ticket begint; korte countdown.
3. Vaste regels en één hoofdgebaar; hitbox volgt het zichtbare object.
4. Bewegende figuren, raak/mis/waarschuwing, eigen schade/levens en leesbare score/tijd.
5. Begrijpelijk einde door tijd/winst/verlies; Stop levert geen beloning op.
6. Lokale scoreweergave en servercontrole zonder per tik op internet te wachten.
7. Eén bevestigde receipt, juiste resourceaantallen, medaille-/recordprogressie en Volgende ronde.
8. Correct sluiten, achtergrond, heropenen, netwerkverlies en accountwisseling.
9. Dezelfde regels bij lage/hoge framerate en minder beweging.
10. Echte screenshot/clip van de ingebouwde game plus relevante regel-/rewardcontrole.

Een proefrender of GLB met vijf clipnamen bewijst deze kring niet. Geen taak krijgt ‘af’ omdat een bestand bestaat.

## Verdeling van het werk

Dit is een praktische projectverdeling; geen claim van een algemene benchmark tussen modellen.

| Verantwoordelijke | Werk | Grens |
| --- | --- | --- |
| Codex, ontwerp/regie | Canoniek spelontwerp, engagement-/balansonderzoek, TO/FO, assetcontracten, samenhang, testen en bugs | Geen tweede implementatie naast Claude starten |
| Sol 6.1, zeer hoog | Deterministische simulaties, stat-/typeberekening, server-tickets/receipts, opslagcompatibiliteit, navigatiestate/native bridge, gerichte tests en technische integratie | Geen eigen afwijkende visuele stijl of gameplayregels verzinnen |
| Claude Opus 5.5 | Schermindeling/UX-compositie binnen de previews, 3D-anatomie/rigs/clips, Blender-renders, presentatie, animaties/VFX/audio, gedeelde glascomponenten | Geen stats/rewards/timers koppelen aan het laatste animatieframe; geen database-reset |

Sol beheert `game/arcade/**`, de serverhelper, commandkoppelingen, `game/typesV2.ts`, `server/http.ts` en als enige de integratie in `src/GameV2.tsx`. Claude beheert de bestaande visuele werkbestanden (zie samenwerking), `src/PogoUiV2.tsx`, modellen en visuele gamepresentatie. Overdracht 4 november: Claude mag de presentatie in `src/arcade/ArcadeScreenV3.tsx`, `ArcadeArtV3.tsx` en `src/arcade/original/*Scene.tsx`/`ButterflyWorld.ts` afwerken. Sol/Codex behouden de klok/invoer/replay in `ArcadeFieldV3.tsx`, `original/OriginalArcadeFieldV3.tsx`, `game/arcade/**` en server. Geen ander bestand stil claimen; bevestig de concrete presentatiebestanden in `CLAUDE_UITVOERING.md` en je tracker. De precieze IN-01-bestandstabel in sections/navigation.md gaat voor een algemene rolomschrijving. Geen twee schrijvers in hetzelfde bestand. De lopende gerichte correcties aan de eerste Arcadevelden eindigen vóór de overdracht daarvan aan Claude.

Voor nieuwe games: Sol maakt één pure simulator met invoer en events; Claude tekent die state en speelt events af. Geen React, DOM, netwerk of Blender in de simulator. Geen spelbeloning of scoreberekening in een renderer. Behoud huidige Expo/React Native/Three/server/Firestore/SQLite; geen tweede engine of platform toevoegen.

De huidige 2D-speelproef gebruikt een kleine React Native-presentatie. Houd verdere bewegende objecten in één renderer en HUD ≤10 updates/s. Gebruik op web een Canvas/gelijke dunne renderer als dat nodig is; geen componentstack per particle. Web en APK delen dezelfde spelregels. Herschrijf de hele app niet om één animatie toe te voegen.

## Uitvoervolgorde

| ID | Resultaat | Eigenaar | Afhankelijk van |
| --- | --- | --- | --- |
| IN-01 | Eén shell/onderbalk; oude dubbele ingangen en tijdelijke knop vervangen; map/GPS blijven bewaard | Sol + Claude, gescheiden bestanden | Bestaande staat lezen |
| VS-01 | Gedeelde glascomponenten en vaste assetmappings in alle betrokken schermen | Claude | IN-01-interface |
| AN-00 | Gedeelde animatie-eventadapter, cleanup, presets, geluidlimieten | Sol contract + Claude presentatie | VS-01 |
| AN-01 | Bruikbare bug-/trainerclips, bron-/variantmapping en juiste pivots | Claude | Bestaande rigs behouden |
| GM-01 | Tikduel volledig zoals P13-1, inclusief nieuwe hits/uitval/einde/rewards | Sol kern + Claude beeld | IN-01, AN-00 |
| GM-02 | Nestwacht volledig zoals P13-3 | Sol kern + Claude beeld | GM-01 gedeelde kring |
| GM-03 | Bubbelzwerm volledig zoals P15 | Sol kern + Claude beeld | GM-01 gedeelde kring |
| GM-04 | Webrenner volledig zoals P13-2 | Sol kern + Claude beeld | GM-01 gedeelde kring |
| GM-05 | Windvlucht volledig zoals P14-1 | Sol kern + Claude beeld | GM-01 gedeelde kring |
| GM-06 | Vlinderjacht volledig zoals P14-2 | Sol kern + Claude beeld | GM-01 gedeelde kring |
| GM-07 | Bladtoren volledig zoals P14-3 | Sol kern + Claude beeld | GM-01 gedeelde kring |
| CB-01 | Actieduel met echte stats, eerlijk tempo, twee charges en veegontwijking | Sol regels + Claude beeld | AN-00/01 |
| CR-01 | Baretbende/Olijfgarde met één toegewezen spel en rescue | Sol encounter + Claude beeld | GM-01/02/03/06, CB-01 |
| WR-01 | Kaart/netvangen/posts/gym/raid visueel passend en geanimeerd | Claude presentatie; Sol bestaande regels bewaken | IN-01, AN-01 |
| PR-01 | Collectie/CP/evo/cocons/buddy/terugkomst visueel passend en geanimeerd | Claude presentatie; Sol mutaties bewaken | VS-01, AN-01 |
| RW-01 | Gedeelde resultaat-/beloningskring, medailles, dag/week, scores en rotatie | Sol regels + Claude beeld | GM-01; uitbreiden per game |
| QA-01 | Laatste integratie per gewijzigde kring, daarna kandidaat APK | Sol integrator + Claude visuele check | Betrokken games/schermen werkelijk af |

Eerst IN-01 en de gedeelde look: geen zeven losse spelapps maken voordat hun navigatie klopt. Daarna de eerste game geheel afwerken. De overige games gebruiken dezelfde start/resultaatopslag, settings en eigen squad. Technische kern en losse art kunnen parallel, maar één bestand heeft één eigenaar.

## Animatiecontract en beloning

Zie `sections/animations.md` voor ieder spel. Elk zichtbaar event bevat minimaal run-/battle-ID, volgnummer, tick/tijd, soort, actor/target, positie, type en eventuele hoeveelheid. De renderer speelt een event hoogstens één keer af. Bewaar geen onbeperkte eventlijst. Na sluiten, accountwissel of nieuw run-ID verdwijnen oude timelines, projectielen en geluiden.

Logica bepaalt raken, schade, score en tijd. De animatie volgt dat resultaat; `onAnimationComplete` geeft geen punten en start geen serverclaim. Tijdens een particle of een wegstervend label blijft het veld reageren. Bij gemiste frames springt de presentatie naar de actuele staat; de simulatie draait niet trager. Minder beweging schakelt bob, trails, shake en felle flits uit; verplichte targetpaden, timing, hitboxes en score veranderen niet.

Vier FX-fasen zijn aanwezig in A04/A25/A26; alle elf typen zijn afgedekt. A14 heeft per frame een gemeten net-handvatpivot, A18 is de shiny-strip. Nieuwe sparkle betekent afwijkend lichaamspalet plus bescheiden sterren, geen glittercirkel om een normale bug. Gebruik bestaande assets eerst; ontbrekende clip/beeldvorm apart als open taak registreren.

Arcade: eerste drie geldige rondes per UTC-dag ieder 75 stof +20 XP; eerste geldige ronde +100 stof; verslaan van een echte eerdere spelersscore +25 binnen die drie. Maximaal400 stof/60 XP; tegen een computerdoel is de maximale basis325. Geen mens-winbonus voor eigen record of NPC. Medailles na3/10/30 geldige rondes. De weekreward500stof/5nectar van een bestaande buddyfamilie na 5 verschillende geldige dagen is geïntegreerd in de receipt; voeg geen tweede claim toe. Plaagbende heeft een eigen budget, geen dubbele Arcadeclaim.

Na tijd/verlies: lokale score direct groot; bij ontbreken bevestiging ‘Score bewaard / Beloning volgt’ uitsluitend als lokaal opslaan echt gelukt is. Na bevestigde receipt: hoogstens drie resourcebubbels tegelijk, aantal per soort gegroepeerd, vliegen in650–900ms naar de juiste teller; totalen komen van de receipt. Tap kan de decoratieve reveal versnellen maar nooit opnieuw claimen. Daarna Volgende ronde. Verlies is geen rood foutscherm. Invalid/afgebroken/oefenrun krijgt geen verzonnen grondstoffen.

## Wat nu werkelijk bestaat

Op 4 november: zeven originele gameports en gedeelde shell gebouwd, Spelen/Oefenen/asyncRanked, serverreplay, dag-/weekrewards, combatflow3 en bende-rescue technisch aangesloten.673 tests/TypeScript/webexport groen; browserbewijs met tijdelijke database staat in `sections/tester.md`. Alleen Tikduel volledig als handmatige browserronde uitgespeeld, alle zeven games gestart/bediend/gestopt. Geen nieuwe APK of live cloudpublicatie.

Beschikbare bronassets: 153 bugvormen met bestaande modellen/portretmapping,26 nieuwe 2D-sets en16 cutouts (acht normaal/shiny-paren). De aanwezigheid bewijst geen professionele 3D-anatomie, af clips of volledig geteste HD-rendering. Claude's laatste uitvoeringsbericht is van 3 november; status van diens renderbatch nu niet opnieuw bewezen. Bestanden en lopende authoring behouden. Nog open: previewgelijke compositie, definitieve beelden/materialen, alle benodigde animatie/audio-bindings, native 3D-Vlinderjacht en uiteindelijke Android-/releaseproef.

## Samenwerking zonder dubbel werk

`progress.json` heeft per taak: eigenaar, toestand, bestandsclaim, afhankelijkheden, assetsMade, integrated, visuallyChecked, functionalChecked, evidence en blocker. Gebruik alleen open → bezig → aangeleverd → controleren → af (of geblokkeerd met reden). Alleen ‘af’ wanneer alle relevante velden en bewijs kloppen; een niet-relevante controle krijgt een concrete reden, geen blind vinkje.

Codex schrijft planwijzigingen als nieuwe revisie in `CLAUDE_INBOX.md`. Claude bevestigt in `CLAUDE_UITVOERING.md`, claimt één taak en meldt na een logisch blok alleen: taak-ID, bestanden, gemaakt/ingebouwd/bekeken, bewijs en resterende blokkade. Geen twee werkers laten schrijven aan dezelfde centrale bestanden. Codex leest deze bestanden bij hervatten en neemt nieuwe uitvoering niet aan uit alleen een groen vinkje in een ander document.

De directe Claude-opdracht wordt in de al bestaande BugBaas-chat geplaatst. Lopende veilige Blender-renders mogen doorlopen; geen tweede renderbatch of nieuwe Claude-chat starten. Als de chat nog geen ontvangst bevestigt blijft deliveryStatus op ‘queued’, nooit ‘gestart’. Er wordt geen permanente watcher of verborgen berichtenbot geïnstalleerd.

## Klaarcriterium

Voor ieder gewijzigd scherm: zelfde voorbeeldpaneel naast de echte screenshot op390×844; aanvullend320×568 en430×932 voor passen/bediening, geen algemene volledige herscan zonder reden. Iedere game minimaal een geldige uitkomst, verlies/stop, dubbele submit en korte netwerkonderbreking correct. Mobiele animaties ook in de APK bekijken; een browserproef is geen native bewijs. Vaste limieten30fps low, effecten begrensd/poolen, kaart niet onder een volledig spel blijven tekenen. Geen algemene claim ‘PoGO-niveau’, ‘helemaal cheatproof’ of ‘releaseklaar’ zonder het betreffende bewijs.


Bubbelzwerm-afloop verduidelijkt: een leeg bord is direct gewonnen, geen refill; alleen een echte serverreplay van het complete bord met minstens één geldig schot mag daarbij de gewone minimumduur/invoerdrempel overslaan. Dit staat ook in de bijgewerkte canonieke games.json en 01_GAMEONTWERP.md.


## Actuele rol en kaartafstemming — revisie 2

Codex blijft de regisseur/tester: controleren of alle systemen samen een begrijpelijk spel vormen, primaire bronnen voor engagement onderzoeken, beloningen en strategie doorrekenen en bewezen bugs gericht herstellen. Claude bepaalt de concrete schermindeling binnen de TO/FO-beeldkwaliteit. Sol doet de technische spel-/serverblokken; geen tweede visueel ontwerp.

Kaartzoom en 2D/3D blijven zichtbare kleine knoppen op de kaart. Links boven de zoom/2D-bediening, rechts kompas/weer, onder de gedeelde balk; avatar linksonder, Nearby rechtsonder en het net midden boven de balk. Claude verfijnt de marges/plaatsing voor rust en veilige bediening. De tijdelijke Arcade-knop verdwijnt bij IN-01. Dit vervangt de eerdere instructie die zoom alleen in een sheet stopte.

Na overdracht schrijft uitsluitend Claude `progress.json`; Sol levert technische bewijsregels in tester.md/technical.md en Codex levert planwijzigingen via CLAUDE_INBOX.md. Zo schrijven twee agents niet tegelijk in het statusbestand. Codex leest voortgang en controleert bewijs; een eigen script mag het statusbestand niet overschrijven met oude aantallen of vinkjes.

Onderzoek en toepasbare spelbesluiten staan in sections/gameplay.md en sections/pogo-research.md. De testuitkomst staat in sections/tester.md. Een bron ondersteunt een ontwerpreden; pas een spelproef toont of onze uitvoering leuk en begrijpelijk is.

## Dekking van eerdere verzoeken

| Verzoek | Behouden basis / concrete opdracht | Blok |
| --- | --- | --- |
| Google, Firestore, bestaande collectie | Eén account en voorraad, IDs/IV/shiny/historie bewaren; geen reset | Alle |
| Echt lopen, kaart, gebouwen, natuur, weer | Echte geodata, gecentreerd karakter, soepel draaien/zoomen, geen zwarte nachtbugs | IN-01 / WR-01 |
| Net vangen met skill en snelle herkansing | Bestaande veeg/traject/oordeel, vier netten/vijf lokmiddelen, geen sleepnet als hoofdvangst | WR-01 |
| Posts/resources/cocons | Bestaande postafstand/cooldown, 2/5/7/10km, negen slots, machines parallel; heldere art | WR-01 / PR-01 |
| AFK, kilometers, terugkomst en snel opruimen | GPS/Health Connect ontdubbelen; compacte rarity-/type-/CP-figuren; beschermde selectie. Actueel `WALK_CATCH`:5/km normaal,10/km workouttempo,max120/dag; zelfde looptegoed, geen netverbruik. Native bewijs blijft open | AF-01 / PR-01 |
| CP, levels, upgrades, moves, held items | Werkelijke stats, één fast/twee charges, acht items, familie-nectar/stof, legale TM; geen dubbele bonus | GM / CB-01 / PR-01 |
| 150+ bugs, verschillende evoluties, 2D/3D/shiny | 153 bestaande vormen; familie-anatomie en HD-look verbeteren, sparkle én ander palet; Oerbugs blijven apart | AN-01 / PR-01 |
| Competitie bij minder dan5 spelers | Eerdere score/zelfde seed+klasse+regels; opgeslagen squad; NPC herkenbaar; echte live Arena optioneel | GM / CB-01 / RW-01 |
| Oude leukste minigames verbeterd | Zeven games, één Speel, echte squadsteun, iedere game volledig | GM-01 t/m07 |
| Franse/Griekse Plaagbende | Eén toegewezen spel/doel, baret/baguette/olijfstijl, eigen rescuebudget | CR-01 |
| Gyms/raids/munten/shop | Zes verdedigers, 1munt/10min, max8u/48, gecombineerd50/dag; dagelijks remote recht; bestaande raidtiers | WR-01 |
| Vrienden/giften/vriendschap/ruil | Bestaande sociale data en limieten; eerdere score zichtbaar zonder nep-online | VS-01 / RW-01 |
| Dailys/week/buddy | Werkelijke bevestigde progressie, claimed grijs/onderaan, geen login-straf of tweede munt | PR-01 / RW-01 |
| Minder tekst/wit/uitrekking/cropping | Eén glasstijl, echte labels/getallen, contain/nine-slice; info op verzoek | IN-01 / VS-01 |
| Muziek, animaties, effects, lagere kwaliteit | Volledige eventtabellen per game, gedeelde audio/settings, low/reduced met gelijke regels | AN-00 / AN-01 / GM / CB |
| Soepel, fouten en dubbelclaim oplossen | Lokaal reageren, geen roundtrip per tik, beperkte assets, receipts en lifecycleguards | Sol / tester |
| Browser + APK/GitHub | Eerst geïntegreerde gewijzigde kring en native bewijs, dan releaseartefact; huidige versie niet als af publiceren | QA-01 |
| Wiki/fotoarchief/expeditie-oude dashboard | Wiki expliciet later; legacy-/safarisystemen niet als extra hoofdroutes terugbrengen | Bewust buiten deze versie |


Actuele aanvullende testdekking: elf gerichte tests en TypeScript groen, inclusief echte tweede spelersscore/+25, UTC-acceptatiedag, gewijzigde stats na ticket en een werkelijk weggevallen HTTP-response met command/run-herhaling. Zie sections/tester.md; dit vervangt oude beperkte testzinnen, geen native-/algemene releaseclaim.

## Aanvulling 7 november 2026: Claude Code Game Studios en GitHub-werkwijze

**Status:** plan en werkafspraak; nog geen nieuwe agents geïnstalleerd of gamecode aangepast.

### Basis voor toekomstige gameontwikkeling

- **Proces-/agentbasis:** [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios). Gebruik deze repository als vaste inspiratie- en referentiebron voor game design, specialistische AI-agentrollen, gameplaybalans, UI/UX, technical art, performance, testbewijs en release-quality gates. Raadpleeg de relevante actuele GitHub-documentatie/skills wanneer een taak in zo'n gebied begint. Vertaal bruikbare werkwijzen naar BugBaas; geen blind kopiëren van alle 49 agents/74 skills of engine-afhankelijke scripts.
- **Technische codebasis en projectwaarheid:** [thomascimpro/bugbaas-reservaat](https://github.com/thomascimpro/bugbaas-reservaat), bestaande Expo/React Native + TypeScript + Three.js game, server en opslag. Bestaande gameplay, TO/FO-previews, accounts, collectible IDs, rewards, GPS-contracten en assetbronnen blijven leidend. Er komt geen tweede engine en geen vervangende app.
- **Actuele afspraken gaan voor:** AGENTS.md, dit PLAN.md, docs/POGO_WERKREGISTER.md, docs/creator-handoff/START_HIER.md, docs/creator-handoff/progress.json en docs/POGO_TESTMATRIX.md. Bij strijdigheid eerst bron/actuele gebruikersbesluiten controleren, niet zelfstandig overschrijven.
- Game Studios is een **procesreferentie**, geen gekopieerde dependency of automatisch gesynchroniseerde codebase. Overnemen alleen wanneer concreet nuttig voor een bestaande BugBaas-taak.

### GitHub verplicht voor Claude en Codex bij elk ontwikkelwerk

1. **Voor iedere taak:** check repository, juiste branch, remote updates, werkboom, actuele taakstatus en toegewezen bestanden. Haal wijzigingen veilig binnen zonder lokale wijzigingen of andermans werk te overschrijven. Gebruik GitHub ook om eerdere commits/PR's te controleren tegen dubbel werk.
2. **Tijdens ontwikkeling:** Codex bewaakt plan/integratie en game-/serverkwaliteit; Claude UI, 3D, animaties en art; Sol of andere gespecialiseerde rollen waar relevant. Eén schrijver per bestand. Gebruik een eigen taakbranch of afgesproken exclusieve bestandsclaim. Bestaande afspraken in dit plan over bestandsverdeling en de enkele schrijver van progress.json blijven gelden.
3. **Na wijziging:** voer de relevante tests uit volgens de bestaande testmatrix, controleer het diff, commit logisch afgebakend met taak-ID en push naar GitHub wanneer het werk klaar is. Bij samenwerking: review/PR en gecontroleerde merge; leg commit/PR en testbewijs vast in de bestaande overdracht/werkregistratie. Geen tweede takenregister.
4. **Bij nieuwe sessie:** Claude en Codex lezen opnieuw GitHub + actuele projectregistratie. Alleen een GitHub-branch, commit of PR betekent niet automatisch dat een feature geïntegreerd, getest of gereleased is.
5. **Veiligheid:** nooit force-push of hard reset over andermans werk, geen secrets/.env, private QA-data, ruwe assetpacks of precieze persoonlijke GPS in de publieke repository. Geen APK-release, Firebase-/serverproductiemutatie, accountreset of onomkeerbare merge zonder afzonderlijk akkoord. Is GitHub niet bereikbaar, meld expliciet dat het werk niet is gesynchroniseerd.

### Compacte Game Studio, afgestemd op BugBaas

| Rol uit Game Studios | Praktische eigenaar | Toegevoegde controle |
| --- | --- | --- |
| Game Director | Codex | Scope, prioriteiten, samenhang, PR/integratie |
| Gameplay Engineer | Sol/Codex | Bestaande simulatie en server-authoritative uitslag/rewards |
| Game Designer / Economy | Gerichte specialistische review | XP, CP, zeldzaamheid, loot, PvP, progression en balans |
| UX Designer | Claude | Bediening, HUD, onboarding en schermcompositie binnen TO/FO |
| Technical Artist | Claude | 3D, rigs, VFX, animaties, geluid en beeldkwaliteit |
| QA Engineer | Codex/reviewer | Gerichte code-/browsertests, screenshots en reproduceerbaar bewijs |
| Performance / Security | Gerichte review | Android FPS/geheugen, replay, anti-cheat, privacy en autorisatie |

Dit zijn inzetbare **rollen**, geen zeven permanent draaiende subagents. Start alleen wat nodig is. Gebruik waar passend de Game Studios-ideeën achter balance-check, ux-review, team-polish, test-evidence-review en story-done, maar vervang engine-specifieke Godot/Unity/Unreal-controles door de bestaande React Native/Expo/Three.js-tests.

### Per feature: vaste korte kring

Context en code lezen → één taak met eigenaar/acceptatiecriteria → zo nodig design/balansreview → kleinste gerichte implementatie → relevante tests en zichtbare schermcontrole → GitHub-commit/PR en taakoverdracht. De simulator/server bepaalt score, schade en rewards; de renderer speelt deze uitkomst af. Screenshots bewijzen een beeld, niet automatisch native FPS. Browsermock bewijst geen fysieke GPS of Health Connect; markeer ontbrekend bewijs als **niet getest**.

### Eerste pilot: Tikduel (GM-01)

Controleer de originele bestaande game, zonder remake: gewone/sterke/Oerbugs met identieke seeds en CP/squad-effect, bewegende hitboxes en taptiming, tap-/combo-audio, echte screenshots ten opzichte van P13, Android-performance waar meetbaar en eenmaal bevestigde serverreward met retry. Alleen aantoonbare tekortkomingen repareren. Registreer bevindingen, tests en commit in bestaande werkregister/tracker.

Vervolg na bewezen pilot: overige zes Arcadegames → 3D/art/animatie → PvP/raids → kaart/verzamelen → progressie/rewards. Geen nieuwe reviewlagen zonder concreet voordeel; prioriteiten uit het actuele werkregister blijven voorgaan.

### Broncontrole en concrete toepassing — 7 november

GitHub-aanvulling `fd1f447` is ingelezen en behouden. De branch `feature/game-studio-phase1-20261107` bevat bij deze controle dezelfde documentbasis, nog geen pilotwijziging. In deze checkout ontbreken `.claude/agents` en `.claude/skills`: het externe Game Studios-pakket is een referentie, geen geïnstalleerd of automatisch draaiend team. De actuele README en relevante `balance-check`/`ux-review`-bronnen zijn geraadpleegd; hun nuttige regel is bewijs vóór een groen oordeel. Ontbrekende native meetdata blijft **niet getest**, ook bij groene unit-tests.

Daarnaast is het afzonderlijke browserpakket `game-studio` beschikbaar met richtlijnen voor UI, Three.js, sprites, GLB-optimalisatie en playtests. Dit is een ander pakket dan Donchitos' Claude Code Game Studios. De bestaande Expo/React Native/TypeScript/Three.js-stack en GLB-bronnen blijven behouden; `three` en glTF Transform zijn aanwezig. ImageGen en de bestaande Blender-koppelingen passen bij artwerk. Er zijn voor deze review geen engines of agentpakketten geïnstalleerd en geen parallelle agents gestart.

De rolverdeling hierboven blijft een verdeling van specialismen. **Actuele integratie en overgedragen bestanden worden sinds4 november door Codex beheerd**; Claude krijgt een concrete visuele taak met bestandsoverdracht als die weer aan het werk gaat. Oude zinnen dat alleen Claude de tracker mag schrijven zijn historie na die overdracht; één schrijver per bestand blijft verplicht.

Prioriteit binnen de bestaande pilot, zonder nieuw spelontwerp:

1. **Tikduel compleet beoordelen:** bewegend doel en hitbox moeten overeenkomen; tap/combo geeft direct feedback en geluid; bestaande helper/squadsteun blijft aantoonbaar; stop/retry betaalt niet dubbel. Werk vanuit de originele simulator en events.
2. **Upgrade voelbaar maken:** vergelijk zwakke en sterke legale squads bij gelijke seed/invoer/klasse. Laat de bestaande stat-/typebijdrage uitlegbaar zien. Verander geen rewards of kosten voordat de gecombineerde vroege vang-/loop-/spelopbrengst is doorgerekend. Het bestaande5–10minuten-doel voor een eerste nuttige upgrade is nog een te toetsen doel.
3. **Eén beeldtaal en rustige HUD:** de0.1.35-iconen/branding zijn afgewerkt; uiteenlopende trainer-/bug-/Arcadestijlen en bewegende3D/evoluties blijven gerichte aandachtspunten. Gebruik bestaande art eerst, houd het speelveld vrij en pauzeer camera-input onder overlays.
4. **Soepelheid bewijzen:** simulatie/timing buiten renderers houden, HUD-updates begrenzen, GLB-materialen/texturen/caches meten voordat optimalisatie of extra effecten worden toegevoegd. Browserbeelden bewijzen geen Android-FPS, accu of echte achtergrondkilometers.

De huidige visuele release0.1.35 heeft703 groene tests, TypeScript/webbuild, gerichte320/430px-webbeelden en ondertekenings-/inhoudsbewijs. Op gebruikersverzoek geen APK-installatie-/emulatorproef. Dit sluit de pilot en de open3D-/fysieke QA-taken niet af. Gebruik `progress.json` en `POGO_WERKREGISTER.md`; maak geen nieuw takenregister of dubbele implementatie.
