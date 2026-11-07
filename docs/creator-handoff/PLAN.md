# Eén BugBaas volgens de TO/FO-previews

Versie 3 — 4 november 2026.

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

## Integrale Game Studios-review en uitvoeringsplan — 7 november 2026

**Status: review/plan, geen implementatie.** Dit hoofdstuk vervangt de eerdere losse Game Studios-aanvullingen, maar niet het oorspronkelijke TO/FO-spelontwerp, de bestaande taken of de bestandsclaims hierboven. De huidige hoofdbranch is BugBaas **0.1.35/code36**. Het project heeft **24 bestaande taken: 15 af, 3 bezig, 5 controleren, 1 geblokkeerd**. Historisch bewijs van de laatste release: 703/703 tests, TypeScript, cloudwebbuild en gerichte webbeelden geslaagd; APK ondertekend en statisch gecontroleerd. Voor 0.1.35 is geen runtime-installatieproef uitgevoerd; fysieke GPS, Health Connect, accu, hoorbaar geluid en Google-login blijven onbewezen.

**Geraadpleegde bronnen:** AGENTS.md; README.md; dit PLAN.md; START_HIER.md; progress.json; POGO_WERKREGISTER.md; POGO_TESTMATRIX.md; UX_REVIEW_20261105.md; releases/0.1.35.md; relevante secties onder creator-handoff/sections; de bestaande spel-, server-, UI- en testbronbestanden. Externe procesreferentie: [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios), met name brownfield adopt, balance-check, ux-review, asset-audit, perf-profile, security-audit, test-evidence-review en gate-check. Deze **richtlijnen zijn als beoordelingskader gelezen, niet als geautomatiseerde skills op BugBaas uitgevoerd**.

**Bewijslabels:** AANWEZIG = broncode/functie bestaat; CODE-GECONTROLEERD = relevante logica gelezen; HISTORISCH-GETEST = eerdere test- of logclaim met verwijzing; DEELS = acceptatie nog open; NIET BEOORDEELD = ontbrekende uitvoerbare gegevens, toestel, visuele proef of onafhankelijke meting. Geen score of groen oordeel verzinnen als bewijs ontbreekt. Geen nieuwe npm-tests, echte APK-/GPS-runs, assetbinaire metingen of menselijke speeltests zijn voor deze planreview uitgevoerd.

### 1. Volledige systeeminventaris tegen Game Studios

| Systeem | Wat aantoonbaar bestaat | Oordeel / ontbrekende acceptatie | Bestaande eigenaar of taak |
| --- | --- | --- | --- |
| Game-shell, navigatie, onboarding | Eén Expo/React Native-app, gedeelde tabs, menu, terugnavigatie, beginnerspad/levels en naam/avatar. Kleine webschermen historisch gecontroleerd. | DEELS: nieuw én terugkerend account, offline herstart, accessibility en echte Android-shell in één speelroute controleren. | Codex integratie; VS-01 |
| Google-login, account, legacy | Firebase Auth-verificatie, anoniem/gekoppeld account, naamwijziging zonder UID-wissel. Legacy-lees/claimpad voorbereid maar uitgeschakeld. | DEELS: persoonlijke Google-login en bestaande-account-upgrade niet live bewezen; legacy mag niet zonder bevoegde serverleestoegang/uitrol. | Codex/Sol; QA-02 |
| Kaart, GPS, 2D/3D, bereik | MapLibre/Three, markerbediening, native WebView-bridge, GPS-age/accuracy- en catch-radiuscontroles. | DEELS: fysieke locatie, kaartinteractie tijdens overlays, route buiten en real-world GPS-fouten nodig. | WR-01, QA-02 |
| Wilde spawns, biomen en weer | Gewichten, locaties, water/gebouw-scheiding en weather/biome-context in de spelcode. | DEELS: echt gebied, dataproviderrechten, veiligheid en onnauwkeurige GPS op buitenlocatie nog niet afgetekend. | WR-01 |
| Netvangen | Serverbeoordeelde veeg/net-trace, bewegende doelen, zeldzaamheid, aas, vangstuitkomst en bevestigde rewards. | DEELS: 0.1.34-netbediening heeft browserbewijs; fysieke tap/veeg-haptiek, natief cameragedrag en volledige P03-vergelijking open. | WR-01 |
| Wandelvangst/autovangst | 200 m per normale vangst, workoutroute met dubbel krediet, 120/dag, snelheidsgates, achtergrondcommandherstel; gerichte tests. | DEELS: echte route, Health Connect/GPS-ontdubbeling, force-stopgedrag, batterij en notificaties op fysiek toestel. | AF-01, QA-02 |
| Posts, gyms op kaart, eigen routes | OSM-gebaseerde posts/routes, cooldowns, eigen routevalidatie, dagelijkse rechten en serveracties. | DEELS: live POI/route-end-to-end en locatie-/veiligheidsproef, zonder echte GPS of precieze locatie in Git. | WR-01, QA-02 |
| Collectie, 153 vormen, Bugdex, shiny | 150 evolutiestadia plus 3 Oerbugs, bestaande IDs, IV/CP, shiny, detail, favorieten, filter en beschermde transfer. | DEELS: bestaande statische 153-GLB/306-portretchecks; live bewegend model, detail en evolutie-P04 op Android nog open. | PR-01, AN-01, VIS-01 |
| Evolutie, power-up, TM, held items | Serverregels, nectar/stof, moves, acht items, type-effecten en 1-10 gerichte power-ups. | AANWEZIG/HISTORISCH-GETEST: prijs-/krachtgevoel in echte starterroute en evolutie-morph zijn niet bewezen. | PR-01, balansreview |
| Cocons, buddy, terugkomst | 2/5/7/10km, maximaal negen cocons, incubators, buddy-harten, voer/cooldown en een beschermde terugkomst/transferroute. | DEELS: animaties, continue ontvangst, achtergrondkilometers en volledige P07/P08/P17-flow beoordelen. | PR-01, AF-01 |
| Dag-/weekdoelen, level, onderzoek | Trainer-XP/levels, dagonderzoek, postonderzoek, wandelweektreden, streaks, medailles. | DEELS: volledige eerste sessie en de samenhang tussen dailys, level, upgrade en voorraad numeriek controleren. | Codex game design |
| Economie en shop | Stof, familienectar, netten, TM, held items, gymmunten, daily/weekly rewards, servermatige grenzen. | NIET BEOORDEELD voor totale balans: productieopbrengst/uitgaven, sterke builds en vroege waardevolle upgrade niet door deze review gesimuleerd. | Balansreview |
| Zeven Arcadegames | Oorspronkelijke deterministische spelkernen, één replay/score/rewardkringsysteem, tutorial/keuze/ranked en eigen scènes. | DEELS: gerichte servertests bestaan; alle zeven volledige menselijke rondes, mobiel feel, FPS en UI-vergelijking ontbreken als recente complete set. | GM-01 t/m GM-07 (historisch af) |
| Tikduel | 30s/56 doelen, rarity-tikken, combo, squadhelpers, gerichte audio en serverreplay. | CODE-GECONTROLEERD: mogelijke zicht-/hitboxvolgordefout bij overlap; eerst regressie reproduceren. Helper-/CP-balans alleen historisch geïndiceerd. | GM-01 kwaliteits-pilot |
| Actieve squadgevechten | Flow3, echte stats/typen/energy, doelrichten, charge/dodge/switch, snelle respons. | DEELS: bron en browserchecks aanwezig; volledige duelreeks, latency, leesbaarheid en native bediening open. | CB-01 |
| Async ranked, Echo, dagstrijd, seizoen/cup | Bevroren challenge/seed/klasse, Elo/ratings, opgeslagen teams, NPC-fallback, dagpogingen en seizoensrewards. | DEELS: serverregels en deels tests; echte 2-account-match/retry en eerlijke speler-NPC-aanduiding opnieuw end-to-end controleren. | CB-01, Codex |
| Gymverdediging en munten | Zes plekken, teams, NPC, serverrotatie, 10 min/munt, max 8u/48 per bug, gecombineerd 50/dag. | DEELS: volledige winst → claim/verdediger terug → coins en de UI bij verlies in echte sessie controleren. | WR-01 |
| Raids en uitnodigingen | Timers, lobby voor maximaal zes, max vier remote, 1 gratis remote/dag, samen gedeelde schade en eenmalige claim; gerichte tests. | DEELS: live multiplayer/lobby, netwerkverlies, tijdvensters en duidelijke raidstatus nog geen volledige praktijkproef. | WR-01, CR-01 waar relevant |
| Plaagbende/Baretbende/Olijfgarde | Locatie-/ballonontmoetingen, toegewezen game of combat, serverbevestigde rescue met dagbudget. | DEELS: lokale tests; volledige online winst/rescue en alle faction-animaties open. | CR-01 |
| Vrienden, cadeaus, vriendschap | Vriendenparen, verzend-/openlimieten, verrassingen, niveaus en idempotente cadeauafhandeling. | AANWEZIG/HISTORISCH-GETEST: twee echte accounts en onbetrouwbaar netwerk nog praktisch doorlopen. | Codex/Sol |
| Ruilen | Nabije ruil, twee bevestigingen, revisionchecks, stofkosten, eigendomstransactie, bijzondere-daglimiet, beschermde bugs. | AANWEZIG/HISTORISCH-GETEST: fysieke 2-toestelproef met locatie en onderbreking ontbreekt. | Codex/Sol; QA-02 |
| 3D/visuele art/animatie | HD-portretten, GLB, shiny, VFX, zeven game-loadscreens, eigen UI-iconen en nieuwe branding 0.1.35. | DEELS: render-/parsercontrole ≠ kwalitatieve anatomie, consistente stijl of werkende clip; bewegende modelsampling en evolutie-morph open. | AN-01, VIS-01, VS-01 |
| Audio en toegankelijkheid | Originele tap/catch-WAV, muziek, effecten, mute/volumeslider, reduced-motion en labels. | DEELS: hoorbare Android-proef, audiolag, mix, focus bij achtergrond en echte screenreader-/touchcontrole open. | Claude presentatie; QA-02 |
| Performance en accu | Assetvoorbereiding, rendererlimieten en eerdere beperkte browser-/emulatorchecks. | NIET BEOORDEELD: geen actuele fysieke FPS/frame-time, GPU-/geheugentrend, koude start of accuproef. | Performance-review; QA-02 |
| Server, Firestore, auth, replay en privacy | Firebase tokencheck, server-authoritative score/reward, commandId/revisie, transacties, replay/idempotentie, requestgrenzen, privacyfilters. | DEELS: belangrijke tests bestaan; volledige threat model, brute-force/rate-limiting, abuse, productieconfig en cloudrestore niet onafhankelijk afgetekend. Geen exploit geclaimd. | Codex/Sol security |
| QA/testautomatisering | package.json heeft npm test/typecheck/web:build, historische 703 tests en gerichte browser- en integratiebewijzen. | DEELS: huidige runtime niet opnieuw getest; volledige fysieke matrix en cross-system human playtest ontbreken. Geen verplicht extra framework nodig. | Codex QA; QA-02 |
| GitHub/AI-agentproces | AGENTS.md, één PLAN.md, progress.json, werkregister, testmatrix, GitHub-branch/PR-regels. | DEELS: Claude Code Game Studios is referentie; CLAUDE.md en specialistische .claude/agents nog niet op main aangetroffen. Geen geïntegreerde automatische CI aangetoond. | Codex governance |
| Release/rollback | Gesigneerde 0.1.35 APK, versiecode36, webbuild/backend en statische bundle-/assetchecks. | CONCERNS: geen 0.1.35-installatie-/runtimecheck op verzoek; rollback, echte login/GPS/batterij en accountbehoud op toestel apart bewijzen. | Codex release/QA |

### 2. Alle zeven Arcadegames: concrete kwaliteitstoets

| Game | Bestaande kern behouden | Gerichte review en acceptatie |
| --- | --- | --- |
| Tikduel (GM-01, P13-1) | Originele doelreeksen, rarity/hits, combo, helperregels. | Overlap: zichtbare voorste bug is dezelfde die input raakt. Swipe/tap en tempo testen; gewone/sterke/Oerbugs met dezelfde seeds; tap/catch-audio, damage/score/replay en eindreceipt. |
| Webrenner (GM-04, P13-2) | Drie banen, sprongen, obstakels, pickups en score. | Volledige ronde met springen, botsing, verlies, pauze, verschillende FPS; speler en aankomend obstakel contrastrijk; geen vertekende hitboxes. |
| Nestwacht (GM-02, P13-3) | Vijandgolven, torens, spray, upgrades, pathing. | Bouw/spray/uitkomst in volledige ronde, laag en hoog scherm, pad- en nestleesbaarheid, lage framerate en correcte eindscore/reward. |
| Windvlucht (GM-05, P14-1) | Impuls, 2D-vlucht, obstakels, oorspronkelijke fysica. | Vergrootte speler daadwerkelijk herkenbaar in beweging; aanraking consistent, obstakel/waarschuwing duidelijk, geen nieuwe physics, volledige ronde en native meting. |
| Vlinderjacht (GM-06, P14-2) | Bestaande native/web-variant, kijkbeweging, netactie en 60s resultaat. | Startklok pas na eerste speelbare frame; echte vangst en net, bewegingscamera, lifecycle en performance op Android; browser/portretfallback niet als volledig native bewijs. |
| Bladtoren (GM-07, P14-3) | Oorspronkelijke spring-/hold-/combo-/platformregels. | Nederlandstalige veldstijl, duidelijke hoogte/landingshint, indrukken/loslaten, verlies/herstart, late frame/hitbox en native toets. |
| Bubbelzwerm (GM-03, P15-1) | Oorspronkelijke kleurketens, ricochets, bom/vries, serverversie. | Richtlijn en eerste botsing exact overeenkomstig simulator; leeg bord direct eindigt, geen dubbele beloning; volledige ronde en lage FPS. |

**Gezamenlijke acceptatie Arcade:** één werkende start → input → verlies/winst/tijd → lokaal resultaat → één serverbevestigde receipt → volgende ronde. Verifieer ook stop, dubbele submit, offlinerespons, accountwisseling, oude regelsversies, low/reduced-motion. Een animatie-clip of unit-test alleen is onvoldoende.

### 3. Prioriteitsbevindingen, niet gelijkstellen aan bewezen bugs

| Prioriteit | Vaststelling | Actie en bewijs |
| --- | --- | --- |
| P1 (code-aanwijzing) | Tikduel: originalTapTargets sorteert op prioriteit, de JSX-scène tekent de array in die volgorde, maar input kiest via find de **eerste** overlappende hitbox. Latere getekende targets liggen visueel hoger. | Eerst één deterministische overlap-regressietest op visuele z-volgorde; indien bevestigd inputselectie en rendering gelijk trekken, zonder bestaande scoring/helperprioriteit onbedoeld te veranderen. Relevante arcade-/replaytests plus screenshot. |
| P1 (ontbrekend bewijs) | QA-02: 0.1.35 is statisch gecontroleerd, niet geïnstalleerd/uitgevoerd. Eerdere emulatorproef voor 0.1.33 is geen bewijs van 0.1.35. | Android release-apk updaten over bestaande testaccount, startup/game/collectie/back/3D/audio onderzoeken en daarna echte GPS/Health Connect/accu lopen wanneer toestel beschikbaar is. |
| P1 (onvolledige spelersflow) | WR-01/PR-01/CR-01/CB-01: visuele en online integratie van kaart/vangst/evolutie/raid/Plaagbende/duel heeft bekende open eindproeven. | Per scherm/flow alleen de ontbrekende bewijsstap; geen remake. |
| P2 (balanshypothese) | Historische Tikduel-run met 12 seeds/ideale invoer: gemiddeld 69 gewone starter, 71 bij 1500CP-upgrade en 123 voor 3 Oerbugs. Geen menselijke of algehele fairnessmeting. | Herhaal op vaste seeds, meerdere werkelijke legale teams en invoerstrategieën. Scheid helperzeldzaamheid van CP/IV/items. Balans pas aanpassen na vooraf gekozen criteria. |
| P2 (economiehypothese) | Bestaand ontwerp wil dat eerste zinvolle upgrade snel haalbaar en voelbaar is; totale kaart-/buddy-/Arcadeopbrengst niet in deze review doorgerekend. | Simuleer eerste 10/30/60min en dag1/7 met verschillende echte spelpaden; registreer stof/nectar/cocons/XP en sinks. Eerst toon/intro verduidelijken, niet automatisch meer munten of geld introduceren. |
| P2 (art/feel) | 153 GLBs/306 portretten statisch bekeken; evolutie-morph, alle clips en Android-stijlconsistentie niet volledig bevestigd. | Matrix per familie en stadium, geautomatiseerde assetvalidatie en representatieve bewegende 2D/3D-sample; gerichte correcties met exacte model-ID. |
| P2 (documentkwaliteit) | README.md noemt bovenaan nog 0.1.25; POGO_TESTMATRIX.md noemt historische 183-teststatus en oude CI-parkeerkeuze. | Werk alleen het **actuele** voorblad en testbaseline bij; behoud oude releasehistorie expliciet als historie. Geen nieuw registratiesysteem. |
| P2 (engineering) | Grote centrale game-/server-/kaartbestanden bevatten veel verantwoordelijkheden; geen algemene runtimefout daarmee bewezen. | Dependency map en gerichte contracttests; opsplitsen pas bij concrete wijziging/risico, zonder tweede spelregelsbron of spaghetti. |
| P2 (security) | Serverauth, transactions en receipts bestaan, maar geen actuele complete externe aanvalstest of belastingsmeting. | Authz-matrix, concurrerende requests, forged inputs, GPS-spoofpogingen, rate-/payloadgrenzen, no-data exposure en veilige Firestore-backup/restore in testomgeving. |
| P2 (studio-operatie) | Game Studios-richtlijnen in plan maar geen operationele Claude-agentset op main. | Minimale rolbriefing + validatie van Claude Code/connector; niet alle vendor-hooks of 49 agents installeren. |
| P3 (bewijs/onderhoud) | Sommige oude documenten hebben tegenstrijdige release-/overdrachtszinnen en oude doelen. | Bovenaan huidige checkpoint gebruiken; oude historische regels dateren en laten staan, geen bulkdocs herschrijven. |

### 4. Uitvoeringsvolgorde met eigenaars en harde klaarcriteria

**Fase 0 — Studio operationeel maken (documenten en coördinatie, geen spelwijziging)**

- Codex controleert GitHub main, open werkboom/branches/PR's, 0.1.35-release, bestaande taakclaims en synchroniseert veilig. Raadpleeg Game Studios als **procesbron**, niet als engine of vervanging van PLAN.
- Maak een **minimale** CLAUDE.md met dezelfde bestaande bronleesvolgorde, bestandseigenaars, designbron en branch/testregels; voeg hooguit 4 korte Claude-specialisten toe voor Game Design/Economy, UX/Art, QA en Performance/Security. Gameplay Engineer blijft bestaande Sol/Codex-rol. Test of Claude deze instructies in de projectroot werkelijk laadt; anders is dit niet operationeel.
- Codex gebruikt AGENTS.md; Claude en Codex gebruiken beiden GitHub bij **iedere** taak: remote updates controleren, taakclaim, één schrijver/file, gerichte test, kleine commit/push naar taakbranch en PR/review wanneer gedeelde code verandert. Geen force-push/hard reset/secrets/precisie-GPS.
- **Klaar:** beide ontwikkelrollen kunnen op een schone taakbranch het actuele plan en de juiste file-eigenaar tonen; geen nieuwe duplicate tracker, database, shellhookdwang of ongeplande productieactie.

**Fase 1 — Tikduel kwaliteits-pilot (hoogste codeprioriteit)**

- Codex/Sol: deterministische overlap-fixture waarin 2 doelbugs gelijktijdig onder één tap liggen; toon werkelijke JSX-z-volgorde en door input gekozen doel. Fix alleen als de mismatch is bewezen.
- Herhaal gerichte originele Arcade-replay/score-tests, een dubbele submit en twee visuele screenshots met overlap; check P13.1 en echte tapaudio/reduced-motion waar mogelijk.
- Game Designer: leg 2–3 concrete balance-hypotheses vast en voer vaste-seed simulaties uit zonder bronmechanics te veranderen. User-facing feedback eerst, nerf/buff uitsluitend als cijfers én gamefeel dat ondersteunen.
- **Klaar:** input raakt voorste zichtbare bug of een expliciet en visueel eerlijk vastgesteld doel; score/replay blijven deterministisch, identiteit/collectie intact, relevante tests slagen. Geen 'spel voelt beter'-claim zonder playtest.

**Fase 2 — Alle reeds bestaande zeven games één voor één volledig beoordelen**

- Start per game met de tabel in §2 en gerichte echte browserbediening; plan geen hele port/herimplementatie. Pak echte regressies eerst, dan polish.
- Claude mag alleen afgesproken scène-/presentatiebestanden bewerken. Game-engineer beheert state, timing, hitboxes, rewards en replay. Een eventadapter mag de score nooit van een animatie-afloop laten afhangen.
- **Klaar:** per game screenshots van home/spel/uitslag, volledige ronde op relevante afmetingen, verlies/stop/offline/retry, serverreceipt, geen eerdere rules-versie gebroken; native claim alleen met native bewijs.

**Fase 3 — Kernloop, starters en balans (data vóór beloning aanpassen)**

- Test met verse **synthetische** profielen: onboarding → kaart → vangst/wandelen → dex → team → nuttige upgrade/evolutie → gevecht/Arcade → echte reward → terugkomst. Doe ook het offline/herstartpad.
- Bereken XP/stof/nectar/voorraad/cocons/munten als stromen per bron en sink; vergelijk zwakke/sterke teams op dezelfde seed/rules. Bij kleine spelerpopulatie blijven NPC en bewaarde score duidelijk onderscheiden van een echte live speler.
- **Klaar:** elke kernactie leidt begrijpelijk naar een volgende stap, geen verborgen dubbele claims, upgradeverschil aantoonbaar, geen nieuwe valuta of verplichte nieuwe dagmissies.

**Fase 4 — UX, beeldconsistentie, 3D/animatie/audio (bestaande open taken)**

- Werk VS-01, AN-01, VIS-01, WR-01 en PR-01 af volgens de gekozen P01–P24-previews. Controleer gym/volume-accent, net-/raidpresentatie, evolutie-morph, cocons, buddy en terugkomst. Behoud bestaande 0.1.35-art en alleen gerichte hertekeningen.
- Audit alle 153 GLB-bestanden en 306 portretreferenties op geldigheid/koppeling; beoordeel representatieve familie-/shiny-/Oerbug-modellen **in beweging** en op echt Android. Een GLB-bestand of clipnaam ≠ bewezen animatiekwaliteit.
- Voor elke zichtbare verandering: browserbediening bij **320×568, 390×844 en 430×932**, screenshot naast bijbehorende preview, geen overflow/console-error, knoppen voldoende groot (projectdoel minimaal 48px), reduced-motion zonder gameplayverschil.
- **Klaar:** geen placeholder/kale knop in de gekozen route, consistente art/tekst/bediening, juiste feedback bij succes/misser, mobiele beeldprestatie onderbouwd waar geclaimd.

**Fase 5 — Competitie, sociaal en multiplayer end-to-end**

- Controleer CB-01/CR-01, Echo, ranked, cup, gym, raid en Plaagbende met **twee of meer testaccounts** in een veilige testomgeving. Test gelijke/ongelijke score, race/retry, raid-lobby voortijdig sluiten, gedeelde schade, één claim, cadeau/ruil met beide bevestigingen en accountwissel.
- Test dat andere spelers geen privé-GPS/secret token in API-uitkomsten krijgen. Beperk mocks en houd testaccounts/data buiten productie.
- **Klaar:** start → samen spelen → netwerkonderbreking → win/verlies → juiste receipt/terugkeer werkt en de spelmodus toont eerlijk NPC, eerder scoredoel of echt live contact.

**Fase 6 — Native, performance en technische veiligheid**

- QA-02 eerst op beschikbaar fysiek Android-toestel: update **over** bestaande installatie, behoud verzameling, 10–20min echte route, background/resume, Health Connect, werkelijke GPS/afstand, hoorbare SFX, native 3D, crashlogs en accu. Gebruik geen precieze persoonlijke coördinaten in Git.
- Performance-specialist meet koude start, p50/p95 frametijd/FPS, geheugentrend, glTF/texturelaad, JS-stalls, netwerk/retries en batterij op realistische lage/gewone toestelinstelling. Geen verzonnen budgetoverschrijding; bestaande low-doel 30fps, pas extra targets na meting.
- Security-review met server-owned score/rewards, replay/idempotentie, input-rate/size, sessieauthenticatie, concurrentie, privacy, GPS-spoof en Firestore-testrestore. Geen productiegegevens muteren.
- **Klaar:** gedocumenteerd toestel/OS, uitvoerstappen, metingen, beperkingen en herstel; kritieke crashes, double-reward en dataverlies voorkomen door aantoonbare controles. Als ontbrekend: **NOT ASSESSED**, niet groen.

**Fase 7 — Releasegate en nazorg (alleen na apart gebruikersakkoord)**

- Gategraad per subsystem: PASS / CONCERNS / NOT ASSESSED / FAIL met bewijs. Integratie: npm test, npm run typecheck, webbuild, visuele hoofdkring, authentieke serverreplay, assets/licenties, signer/updatebehoud, Android-smoke, GPS/privacy/cloud-/multiplayerproeven waar relevant.
- Geen release, backendmutatie, Firebase-sleutel/configwijziging of oude-accountmigratie zonder expliciete opdracht. Een eventueel expliciet geaccepteerde testuitzondering wordt per release genoteerd; eerdere 0.1.35-uitzondering geldt niet automatisch voor een volgende APK.
- **Klaar:** commit/PR, release-notities en echte QA-bewijzen matchen de uit te leveren versie; rollback-/behoudroute bekend. Niet geteste onderdelen eerlijk gelabeld.

### 5. Rollen en samenwerkingscontract, geen nieuwe administratie

| Verantwoordelijkheid | Huidige praktische eigenaar | Bestandsgrens/overdracht |
| --- | --- | --- |
| Game Director / integratie | Codex | PLAN en integratie, actuele trackerclaims, GitHub-branches, PR en acceptatie. Sinds 4 november zijn overgedragen bestanden bij Codex; oude exclusieve Claude-trackerzinnen gelden niet onbeperkt. |
| Gameplay Engineer | Sol/Codex | game/arcade, game/goBattleV2.ts, server, deterministic replay, rewards, tests; bestaande bestandsclaims en integrator voor GameV2 blijven voorgaan. |
| UX Designer/Technical Artist | Claude wanneer daadwerkelijk ingezet | PogoUiV2, art/scene/GLB en toegewezen visuele bestanden volgens actuele claim. Geen wijzigingen aan server, rewards, physics, of dezelfde codefile naast Codex. |
| Economy/Game Designer | Lees-/reviewtaak onder Codex | Data/simulaties, hypotheses en voorstellen. Verandert geen prijzen of PvP-statregels zonder bewijs en gebruikersbesluit. |
| QA/Perf/Security Reviewer | Gerichte losse review | Tests/metingen/rapporteren; schrijft alleen na specifieke file-claim. Geen zelfstandige merge, release of wijziging aan spelerdata. |

**Werkregels:** GitHub is de enige gedeelde codegeschiedenis en PR-overdracht; progress.json het bestaande taakoverzicht; POGO_WERKREGISTER.md de actuele checkpoint; PLAN.md de ontwerp- en uitvoeringsbron. Een taak heeft één eigenaar, één concreet resultaat, benodigde files, testbewijs en een expliciete status. Claims zonder tool-/runtimebewijs zijn niet af. Kleine documentwijzigingen vragen geen gamebuild; wijzigingen aan gameplay/server wel relevante regressie-/typechecks. Gebruik Game Studios-specialisten alleen wanneer de taak ze rechtvaardigt. **Geen oneindige reviewcyclus**.

### 6. Tests en bewijs per domein

| Verandering | Minimum nieuw bewijs | Niet verwarren met |
| --- | --- | --- |
| Pure mechanics/hitbox/balans | Deterministische fixtures, fout- en grensgevallen, client/server replay, TypeScript | 'Bestaat in code' of een oude score-run |
| Serverreward/GPSpad/handel | Eigenaar/revisie, duplicate/retry, authz, limieten, geen partiële mutatie, bij merge volledige goedkope suite | Een clienttoast of database-object zonder echte settlement |
| UI/aanraakbediening | Werkende browser of native interactie, voor/na screenshot op relevant formaat, navigatie/overlay terug, no console error | Alleen een designboard of afbeelding |
| 3D/animatie/audio | GLB-/bron-/licentiecontrole, werkelijk afgespeelde beweging/geluid, load/unmount, reduced motion | Clipnamen, statische render en gebundelde WAV |
| Native GPS/Health/batterij | Fysieke toestelproef met toestemming/afstand/accu en gecontroleerd accountbehoud | Emulator of webnavigator-mock |
| PvP/raid/ruil | Meer-account e2e met netwerkverlies, identieke idempotente receipt, correcte zichtbaarheid en autorisatie | Enkel een geslaagde unit-test |
| Release/rollback | Laatste sourcefingerprint, testlog, web/API/backend, echte APK-installatie, signer/versie/asset-/nativebewijs, rollback | Alleen checksum of compile |

Metingen die niet in deze review beschikbaar waren: actuele native FPS, batterij, echte spelerretentie, echte Google-login, 0.1.35 APK-runtime, 2-account live raid/ruil, de volledige visuele TO/FO-vergelijking en elk fysiek model in beweging. Allemaal **NOT ASSESSED** tot een gerichte proef ze onderbouwt.

### 7. Eerstvolgende concrete opdracht

**Begin met fase 0 (minimale Claude/Codex-instructies) en fase 1 (Tikduel-overlap), op een eigen veilige GitHub-branch.** Controleer vooraf de actuele hoofdbranch en fileclaims; bestaande werkmappen en eerdere agentwerk niet overschrijven. Fase 0 kan zonder gamecode worden afgerond. In fase 1 gaat een rode deterministische overlaptest vóór de gerichte fix; daarna groene gerichte regressies en een echt screenshot. Leg de commit/PR en de uitkomst kort in het bestaande werkregister vast. Geen productie-merge of release zonder gebruikersopdracht.

**Documentatiehygiëne bij eerstvolgende gewone docs-taak:** vervang het verouderde README-voorblad van 0.1.25 door een verwijzing naar de actuele GitHub-release; verduidelijk in POGO_TESTMATRIX.md dat 183 een historische testsuite is en dat actuele aantallen uit release/checkpoint komen. Laat de historische releasebeschrijvingen intact.

**Eindconclusie van deze review:** de grote bouwstenen bestaan. De grootste kwaliteitskans zit in gecontroleerde gamefeel en hitboxfeedback, volledige end-to-end-speelrondes, levende 3D-/UI-afwerking en echte Android-/online testdekking. Niet in een tweede app, nieuwe engine, grote refactor of 49 extra agents.
