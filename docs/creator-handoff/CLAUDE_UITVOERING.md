# Claude — ontvangst en uitvoering

## 2026-11-03 10:05 — ontvangst PLAN.md v1
- Planrevisie ontvangen: **PLAN.md v1** (Codex, 3 nov). Leidend; mijn eerdere `docs/SAMENWERKING.md` en `docs/PLAN_NAAR_PREVIEWS.md` zijn als vervangen gemarkeerd. `AGENTS.md` regel 1 wijst nu naar `docs/creator-handoff/START_HIER.md`.
- Actieve taak-ID en bestandsclaim: **WR-01 (bezig)** — `src/FieldHomeV2.tsx`, `src/ExploreV2.web.tsx`, `src/MapPropsV2.tsx` (nieuw), `src/WalkingSceneV2.ts` (alleen presentatie), `src/BeginnerGuideV2.tsx`, `src/EnvironmentV2.tsx`. Daarnaast **VS-01 (deels aangeleverd)** — `src/PogoUiV2.tsx`. Geen `progress.json` aangetroffen om in te claimen.
- Gemaakt:
  - VS-01 kern: `PogoUiV2` naar glas-look (`PO.surface`, `PO.rim`, cyaan pil, glascirkel, glasvel).
  - PR-01 deel: `src/BugDetailV2.tsx` (glas, één hoofdknop, extra's achter ☰) + multi-power-up (−/+/MAX ≤10, kosten, competitiegrens).
  - WR-01 deel: kaart-HUD (kompas, avatar, net, in de buurt; 2D/3D/zoom als kleine glasknoppen linksboven); gymtoren-render met verdedigende bug erop, raidcocon in tierkleur met wiegen/gloed (`src/MapPropsV2.tsx`).
  - 3D: gym, post, raidcocon, natuur (9), type-emblemen (11), arenaplatform, medailles, 12 trainerportretten, materiaalupgrade 153 bugs (staging) — zie `assets/3d/README.md`.
- Ingebouwd: glas in kaartmenu/bugdetail; gymtoren + raidcocon in de kaartmarker; zoomknoppen. Rest staat klaar als asset.
- Visueel/functioneel gecontroleerd, bewijs: `.local/glass-ui/` (menu, detail, power-sheet 390×844), `.local/detail-ui/` (390/360, power-up en evolutie geklikt), `.local/map-ui/`. tsc groen; laatste `npm test` 566/566 vóór Sol's Arcade-werk.
- Resterende blokkade of interfacevraag:
  - IN-01: de tijdelijke `ArcadeEntry` (`right:14, top:122`) lag over de zoomknoppen; ik heb mijn knoppen naar linksboven verplaatst. Graag de definitieve onderbalk zo dat linksboven (2D/zoom) en rechtsboven (kompas) vrij blijven.
  - 306 HD-bugportretten renderen nog (veilige lopende batch; geen tweede gestart).
- Volgende taak-ID: WR-01 afmaken (post/natuur-GLB in `WalkingSceneV2`, vang-animatie), dan PR-01 en de visuele kant van GM-01 zodra Sol's simulator-events vastliggen.

## Gebruikersbesluit 2026-11-03 (graag opnemen in PLAN.md v2)
De gebruiker zegt letterlijk: "doe wel zoom knop, ik vroeg dat … pas plan aan dat goed is. gehele scherm moet logisch, simplistisch en duidelijk ingericht worden, dit soort taken kan jij beter".
1. **Schermindeling/UX-compositie per scherm** (wat staat waar, één hoofdactie, minimale tekst, logische volgorde, wat achter ☰/(i)) wordt Claude's taak, binnen de previews van Codex. Codex blijft ontwerp/acceptatie; Sol techniek en `GameV2`-integratie.
2. **2D/3D en zoom +/− blijven als kleine knoppen op de kaart** (niet in een menu).
3. Voorstel indeling kaart (P01-v2): linksboven 2D/zoom, rechtsboven kompas/weer, onder één onderbalk Kaart · Arcade · Bugs · Strijd met het net midden boven de balk; avatar linksonder; in de buurt rechtsonder. De tijdelijke Arcade-knop vervalt bij IN-01.

## 2026-11-03 15:45 — ontvangst revisie 2 + blok VS-01/PR-01
- Planrevisie ontvangen: **revisie 2** (CLAUDE_INBOX). progress.json overgenomen; ik ben vanaf nu de enige schrijver en heb mijn echte gedeeltelijke opleveringen met bewijs ingevuld (IN-01 → controleren, VS-01/PR-01/WR-01/AN-01 bezig).
- Taak: **VS-01 + PR-01** (Bugs-tab volgens P04-1, Strijd-hub volgens P18-1).
- Bestanden: `src/GoCollectionV2.tsx` (alleen lijst-presentatie), `src/GoBattleV2.tsx` (alleen hub-presentatie; gevechtsscherm/flow3 van Sol ongemoeid), `src/GoEchoArenaV2.tsx` (alleen presentatie; echoQueue/team-logica ongewijzigd), nieuw `src/TypeEmblemV2.tsx` + `assets/v2/types/*.webp` (3D-type-emblemen, 96 px).
- Gemaakt/ingebouwd/bekeken: titel+teller, één zoekveld + sorteerpil + filterknop, kaarten met groot beeld/type-embleem/CP; Strijd met arena-held (teamleider groot), glazen tabs zonder uitlegregels, "Mijn team"-kaarten met embleem/CP/HP-balk, één cyaan **Duel**-pil. Labels/testIDs behouden (`battle-tab-*`, `Start duel`, `Kies sterk team`, `Sorteer …`, `go-bug-*`).
- Bewijs: `.local/tour/bugs-strijd.jpg`, `.local/tour/sheet.jpg` (390×844). `tsc` groen.
- **Testmelding voor Codex (tester) / Sol:** volledige suite 614/620. Zes fouten buiten mijn bestanden: `tests/commandLoadingV2.test.ts` (3× opslagrondes/metadata), `tests/goFeaturesV2.test.ts:34` (offline duel, actual 0 vs 738), `tests/loadingRewardsV2.test.ts:14`, en "valid team/build commands … six solo NPC duels". Lijkt samen te hangen met de combat/echo/service-wijzigingen van vandaag.
- Volgende: tekst/glas voor menu-pagina's (Tas, Cocons, Buddy, Gyms, Vrienden, Doelen, Instellingen); daarna GM-01-presentatie. **Overdrachtsverzoek:** `src/arcade/ArcadeFieldV3.tsx` en `src/arcade/ArcadeScreenV3.tsx` voor de visuele/animatielaag van de zeven spellen (alleen presentatie; simulators/receipts blijven van Sol). Tot bevestiging raak ik die niet aan.

## 2026-11-03 16:30 — VS-01 basiscomponenten
- Bestanden: `src/uiV2.tsx` (Panel, Button, IconButton, ArtTile, info-popup, input, chip, error → glas/cyaan), `src/TabsV2.tsx` (glazen tabs; uitlegregel onder tabs niet meer getoond).
- Effect: alle oudere menu-pagina's (Team, Tas, Bugdex, Cocons, Buddy, Gyms, Profiel, Doelen, Instellingen) volgen de previewstijl zonder per-scherm-ombouw.
- Bewijs: `.local/menu-pages/sheet.jpg` (9 pagina's, 390×844, geen paginafouten). `tsc` groen; suite 614/620 (dezelfde 6 serverfouten als hierboven, niet veroorzaakt door deze wijziging).

## 2026-11-03 17:15 — AF-01 Wandelvangst (gebruikersbesluit, vervangt Codex-balans 1/250 m · 20/dag)
- Gebruiker letterlijk: "melding zegt dat voor 4.2km 8 bugs krijg en game open staan er andere waardes. moet wel gelijk zijn … denk eerder aan 10 bugs per 1km (maar random, en random type/rarity, zelfde spawnkansen als wild) … voor echte workouts meer … standaard beweging wat minder … simpel maar rewarding (met verslavingsmodel)".
- Oorzaak mismatch: melding toonde `daily.catches` (alle vangsten), terugkomst alleen autovangsten sinds vertrek; autovangst ving alleen als er toevallig een spawn binnen bereik was (max 1/30 s, net + 75%-kans).
- Nieuw (`game/walkCatchV2.ts`): 1 bug per 200 m (5/km); workout = gemiddelde pace ≥1,75 m/s (6,3 km/u) telt dubbel (10/km); > 7 m/s telt niet; willekeurige wilde spawn op je plek (zelfde soort-/zeldzaamheids-/shinykansen), altijd gevangen, geen net; elke 10e bug van de dag = jackpot (zeldzaamste van die plek); max 120/dag; max 5 per serveraanroep, rest blijft tegoed. Health Connect-afstand (app dicht) voedt hetzelfde tegoed, pace uit tijd tussen syncs, uitbetaling bij de eerstvolgende verse GPS-fix.
- Server (`server/goServiceV2.ts`): alleen `auto()`-staart, nieuwe `walkCatch`/`grantAutoCatch` (zelfde beloningspad als autovangst: stof, nectar, XP, kaart, cocon, logboek), `awayCatch` op walk-tegoed, `adventureSync` geeft verstreken seconden mee. Postdraaien ongewijzigd.
- Melding (`autoNotificationTextV2`) en terugkomstpopup tonen dezelfde regel `walkTodayText`: "👟/🏃 4,2 km · 🐞 34".
- Tests: 7 nieuwe in `tests/autoAwayV2.test.ts`; 5 oudere autovangsttests aangepast aan afstand i.p.v. net/nabije spawn (kaart, streak, postcooldown en dubbele-betaling-bij-verloren-antwoord blijven bewaakt). Suite 616/622 (zelfde 6 bestaande fouten).
- **Voor Codex (balans/tester):** graag controleren of 120/dag en de jackpot passen bij de economie; waarden staan op één plek (`WALK_CATCH`). **Voor Sol:** ik heb in `server/goServiceV2.ts` alleen deze functies gewijzigd; geen gelijktijdige edits gezien (laatste wijziging 14:20). Back-up van vóór de wijziging: `.local/goServiceV2.before-walk.ts`.

## 2026-11-04 — ontvangst overdracht 4 november (presentatie afwerken)
- Revisie 4 nov ontvangen en gelezen (CLAUDE_INBOX, PLAN, sections/animations/navigation/tester, POGO_WERKREGISTER regel 7–9, `.local/asset-approval-20261104/`).
- Antwoorden verwerkt: AF-01 = `WALK_CATCH` (200 m, workout dubbel, 120/dag) bevestigd; 153 materiaal-upgrades en 286/306 HD-portretten vrij voor gerichte inbouw; 20 herrenders (ant_elite, spider_1, wasp_1, wasp_3, firefly_1, mosquito_1, snail_1, snail_2 te klein; butterfly_ultimate, dragonfly_3 afgesneden; telkens normaal+shiny).
- Claim nu: AF-01-UI (`src/AutoCatchToastV2.tsx`, `src/AwaySummaryV2.tsx`). Daarna claim `src/arcade/ArcadeScreenV3.tsx`, `src/arcade/ArcadeArtV3.tsx` en `src/arcade/original/TapDuelScene.tsx` (AN-00 gedeelde laag + GM-01). Klok/invoer/server blijven van Codex/Sol.
- Volgorde: (1) toastpositie bewijzen, (2) terugkomstpopup met rarity-achtergrond + "zwakke wegsturen" (beschermd: favoriet/shiny/buddy/team/gym), (3) AN-00/GM-01, daarna GM-02…07. Portretherrender parallel op lage prioriteit.

## 2026-11-04 16:20 — AF-01-popup, AN-00, GM-01, GM-02 (eerste ronde)
- **AF-01 terugkomstpopup** (`src/AwaySummaryV2.tsx`): regel `walkTodayText` groot; tegels in zeldzaamheidskleur met sterren, shiny-✦ en ♻ op zwakke; knop "♻ n weg" + nectar per familie, tweede tik bevestigt, `goTransferMany` met `transferSelectionV2(DEFAULT_TRANSFER_OPTIONS)` beperkt tot de weg-vangsten (favoriet/shiny/buddy/team/gym/zeldzaam/goede beoordeling/twee aanvallen blijven). Bewijs `.local/away-ui/` (1,44 km → 14 bugs, 3 weg).
- **Interfaceverzoek aan Sol (GameV2, één prop):** `src/GameV2.tsx` regel ~231 `<AwaySummaryV2 … open={open}/>` → `… open={open} run={run} busy={busy}/>`. Zonder deze props blijft de knop verborgen (de popup werkt verder). Ik heb dit alleen tijdelijk voor de browserproef gedaan en GameV2 daarna byte-exact hersteld.
- **AN-00** (`src/arcade/ArcadeScreenV3.tsx`): één spel-HUD volgens P13 (sluiten links, tijd midden, 🏆 score + 👑/🎯 doel rechts); losse doelregel vervalt.
- **GM-01 Tikduel** (`TapDuelScene.tsx`, nieuw `tapPortraits.ts`): zie progress.json; 1000 catalogusidentiteiten tonen nu 113 HD-portretten (stadium volgt zeldzaamheid), catalogus/regels ongewijzigd.
- **GM-02 Nestwacht** (`NestDefenseScene.tsx`, nieuw `assets/v3/arcade/nest.webp` uit A03, bron in `source.json`): dubbele HUD en technische labels weg, HD-pad en nest, bouw/upgrade/terugslag/impact.
- Tests 678/678, tsc groen. Bewijs `.local/tap-ui/`, `.local/nest-ui/`.
- Volgende: Bubbelzwerm (GM-03), daarna Webrenner/Windvlucht/Vlinderjacht/Bladtoren; daarna gedeeld resultaatscherm (pending/accepted/reward) en 320×568.

## 2026-11-04 — Claude stopt, overdracht aan Codex
Gebruiker: "zet alles klaar voor codex dat hij het af kan maken, ook visueel". Alle zeven games zijn qua HUD en labels in glasstijl gezet (GM-05/06 nog niet in de browser bekeken). Volledige lijst van gedaan, open en bestanden: `CLAUDE_OVERDRACHT_AAN_CODEX.md`. `progress.json` is overgedragen aan Codex. Niets gecommit of gereleased.

## 2026-11-07 — GM-01 Tikduel-pilot (PLAN.md, aanvulling 7 nov): overlapfix, daarna overgedragen
- **Bevestigd (plan P1):** tik-input kiest de *eerste* overlappende target in `originalTapTargets`, de scène tekende de lijst in volgorde (laatste bovenop) → zichtbare bovenste bug ≠ geraakte bug.
- **Fix (alleen presentatie):** nieuw `src/arcade/original/tapDrawOrder.ts` (`tapDrawOrder` = omgekeerde tekenvolgorde, `topVisibleTarget`); `TapDuelScene.tsx` tekent via `tapDrawOrder`. Score/selectie/simulatie ongewijzigd.
- **Regressie:** `tests/tapDrawOrderV3.test.ts` — seed 42, alle overlappen elke 100 ms: bovenste getekende bug == bug die `originalTapDuel.input` raakt; bewijst ook dat de oude volgorde in meerdere gevallen fout was. Groen.
- **Extra:** type-icoon (hoofdtype) op elke squadhelper-cirkel, zodat zichtbaar is hoe die bug helpt (upgrade/squadbijdrage voelbaar, plan punt 2).
- **Getest:** volledige suite 705/705, `tsc` groen; browser 390×844 Tikduel gespeeld (nav nu Arcade → Speel; Spellen/Oefen bestaat niet meer), screenshots `.local/tap-ui/play-390-*.png`. 320×568-run liep vast op het openen (scriptkwestie, niet onderzocht).
- **Overdracht:** Codex bleek tegelijk in dezelfde bestanden te werken (`tapDuel.ts` targetId, `tapFeedback.ts`, `TapDuelScene.tsx`, `originalTapButterflyV3.test.ts`) en bouwt op `tapDrawOrder` voort. Om dubbele schrijvers te vermijden stopt Claude hier: **Codex is eigenaar van alle Tikduel-bestanden en commit/pusht de pilot samen.** Niets gecommit door Claude; checkout teruggezet op `codex/fix-native-plaag-0125` (zelfde commit 97223d0).

## 2026-11-07 — claim PR-01 evolutie-animatie
- Claim: `src/BugUpgradeFxV3.tsx` (alleen presentatie; wordt pas na bevestigde serverstate afgespeeld, vertraagt `goEvolve`/`goPower` niet). Tikduel-bestanden blijven bij Codex. De 20 portretherrenders bleken al gedaan (0.1.31, `assets/v2/portraits/v1`), niet opnieuw gedaan.

## 2026-11-08 — PR-01 evolutie-animatie + VS-01 laatste groene accenten
- **PR-01** `src/BugUpgradeFxV3.tsx`: evolutie volgens P04-3/PoGO — oude vorm → wit silhouet, steeds snellere wissel oud/nieuw silhouet, lichtflits met stralen, nieuwe vorm met sprankels (1,8 s, één Animated-tijdlijn, tik = overslaan, reduced motion = statisch, `grow`-klank bij de flits). Speelt alleen na bevestigde species/CP-wijziging; vertraagt `goEvolve`/`goPower` niet. Eén stabiele boom zodat de (3D-)detailweergave niet herlaadt. Power-up: ring, pop en opstijgende sprankels. Bewijs `.local/evo-ui/evo-0.png` (silhouet) en `evo-4.png` (nieuwe vorm), Monarchvlinder.
- **VS-01** glas/teal i.p.v. oud groen: `TransferHelperV2` (opruimhulp), `GoGymsV2` (gymkaarten/verdedigers), `GoCocoonsV2`, `FieldBagV2`, `GoFriendsV2`, `CoinShopV2`, `GiftRevealV2`, `RoutesV2`. Alleen kleuren. Bewijs `.local/glass-0108/sheet.jpg` (Tas, Cocons, Vrienden, Gyms 390×844).
- Tests 707/707, `tsc` groen. Commit op eigen branch `claude/visuals-20261108` (gemaakt zonder de gedeelde checkout van Codex te wisselen).
- Nog open (Claude-lijst): vangstkaart P03-3 visueel bewijs (headless worp lukt niet), post/natuur-GLB in vangscène (eerst verkleinen), raidcocon tijdens actieve raid bekijken, autovangst-toast boven net opnieuw bewijzen. Arcadegames zijn nu Codex-werk (GM-01/02 commits); niet dubbel doen.

## 2026-11-08 — realistischer bugs (licht) en duidelijkere kaart (gebruikersvraag)
- **Licht bugs** (`src/bugModelV2.ts` `lightBugs` + nieuw `outdoorEnvironment`, gebruikt in `src/WalkingSceneV2.ts` vangscène en `src/nativeBugViewerV2.ts` 3D-detail): studio-`RoomEnvironment` + felle hemisfeer vervangen door buitenlicht — warme lage zon, zachtere lucht/bosgrond-vulling, koel tegenlicht en een in code gebouwde bosrand-omgeving voor reflecties (geen download). Doel: minder speelgoedplastic, kleur past bij de HD-achtergrond. Geometrie/animaties/ID's ongewijzigd.
- **Kaart** (`src/worldSurfaceV2.ts`, `src/ExploreV2.web.tsx`): dieper groen, donkerder stenen gebouwen met donkere rand, donkerder wegrand; wilde bugs krijgen een donkere contactschaduw i.p.v. witte gloed en verre bugs zijn minder vervaagd (.82). `tests/worldSurfaceV2.test.ts` volgt de nieuwe gebouwkleuren.
- Bewijs: `.local/world-0108/map.png` (na), `.local/world-0108/before-after.jpg` (voor 5 nov / na), vangscène `.local/world-0108/catch.png`. Tests 721: alles groen behalve een tijdgevoelige raid-schedulemeting onder lage CPU-prioriteit (los herhaald: groen).
- Volgende stap realisme (niet gedaan): materiaal per familie in de Blender-materiaalpijplijn (chitine-structuur, doorschijnende/iriserende vleugels, zachte rupsen/slakken, haartjes). Kaartobjecten: grotere gym met teamkleur-lichtbundel en duidelijker post-model.

## 2026-11-08 — AN-01 materiaal per lichaamstype, gymbundel, afronding Claude-lijst
- **Oorzaak plasticlook (bevestigd):** alle 155 GLB's hebben dezelfde laklaag (clearcoat 0,6 / ruwheid 0,16) en de vangscène (`addGloss`) zette daarbovenop elke bug op ruwheid ≤ 0,38 met reflectie 1,6.
- **Fix** `src/bugModelV2.ts` (`bugSurface`, `applyBugSurface` bij het laden, één keer per model): zachte lijven (larve, made, rups, bladluis, jonge slak, zilvervisje, termiet) vochtig-mat met sheen; harige (bij, mot, spin, mug, zweefvlieg, langpootmug, vlinder) mat fluweel; kevers/schorpioen/kakkerlak/oorworm hard gepolijst; overige matige lak. Glas, kristal, vleugels (transparant), metaal en ogen blijven zoals gemaakt. `src/WalkingSceneV2.ts` `addGloss` volgt nu hetzelfde type. Geometrie, animaties en ID's ongewijzigd; HD-portretten niet opnieuw gerenderd.
- **Kaart** `src/ExploreV2.web.tsx`: gym krijgt een lichtbundel in teamkleur (Bos/Zon/Water, neutraal licht), gedimd buiten bereik. Posten hadden al een bundel.
- **Tests:** nieuw `tests/bugSurfaceV2.test.ts` (o.a. "Stage" telt niet als vliegend hert). Volledige suite 722/722, `tsc` groen, webexport groen.
- **Bewijs:** `.local/world-0108/catch-sheet.jpg` (Eikelboorder, Bidsprinkhaan, Langpootmug, Rups), `gym-beam.jpg` (voor/na), `map.png`.
- **Raidcocon tijdens actieve raid:** bekeken, cocon in tierkleur met ★ en aftelling boven de gym (`.local/world-0108/map-light.png`). Afgevinkt.
- **Post-/natuur-GLB in vangscène:** bewust niet gedaan. De vangscène heeft een geschilderde HD-achtergrond; losse 3D-planten ervoor botsen met perspectief en licht. `Post.glb` is al 96 KB en natuur-GLB's zijn < 130 KB; ze blijven op de kaart.
- **Naar Codex (niet headless te bewijzen):** autovangst-toast boven het net en vangstkaart P03-3 vragen een echte worp met precieze GPS. Headless blijft "GPS zoeken" staan. Het vangen/net/wandelen is Codex' lopende werk (`codex/catch-skill-walk-sync`). Daarom hier niet aangeraakt; graag bekijken op toestel of met jouw GPS-mock.
- Claude-lijst hiermee af. Open voor een volgende ronde: nieuwe lowpoly-loopmodellen (geometrie) zijn de grootste resterende realisme-winst; materiaal alleen helpt beperkt.

## 2026-11-09 — PR-01 cocon-uitkomstanimatie + voorstel ontbrekende animaties
- **Gebouwd** (branch `claude/cocoon-hatch`, vanaf `main` 0.1.37, eigen worktree; gedeelde checkout en Codex-bron niet aangeraakt): nieuw `src/CocoonHatchFxV3.tsx`, ingehaakt in `src/GoCocoonsV2.tsx`. Speelt alleen na een door de server bevestigde `lastHatch` terwijl het scherm open is; heropenen speelt niets opnieuw. Beloningen zijn al geboekt; de animatie toont ze alleen.
- **Verloop (~3,4 s):**
  - cocon valt in en slingert aan zijn draad;
  - steeds harder wiebelen in stoten, met lichtscheuren door de zijde;
  - flits met stralen, blaadjes en sprankels;
  - bug springt eruit en landt op een schaduw;
  - "UITGEKOMEN!", naam, sterren en zeldzaamheid in tierkleur (shiny goud met extra ✦);
  - CP, ✨ en snoep, daarna "Bekijk bug" / "Verder".

  Tik = overslaan naar het resultaat; reduced motion = direct het resultaat; klank `grow` bij de flits, `reward`/`shiny` bij de bug.
- **Getest:** `tsc` groen, 723/723 tests. Browser 390×844 en 320×568: echte server-claim van een 5 km-cocon, reeks in beeld, sluiten werkt, geen consolefouten (`.local/claude-cocoon/.local/hatch-ui/`). Op korte schermen staat het podium hoger, zodat de tekst de bug niet raakt. Native en reduced motion niet in de browser bekeken.
- **Voorstel ontbrekende animaties/transities (code-inventaris, niet live doorgespeeld):**
  1. Raidcocon komt uit: op kaart/raidscherm wisselt cocon → boss nu hard. Hergebruik dit uitkomstpatroon met raid-ei-art.
  2. Trainer level-up: alleen een badge. Volledig scherm met level, beloningen en klank `reward`.
  3. Gevechtsuitslag (gym/raid/ranked/bende): statische titel; klanken `win`/`lose` bestaan maar worden niet gebruikt. Overwinnings-/verliesanimatie.
  4. Gym veroveren / verdediger plaatsen: geen teamkleur-flits.
  5. Ruilen: geen ruilanimatie (twee bugs wisselen).
  6. Buddy aaien/voeren: geen hartjes.
  7. Schermovergangen: menupagina's wisselen hard. Korte slide/fade van 150–200 ms voor secundaire pagina's; tabs direct laten.
  8. Klank: buiten Arcade/vangen bijna geen geluid (`click`, `buy`, `sell`, `win`, `lose`, `summon` ongebruikt).

  Al aanwezig: vangen (net, wiebel, gevangen, shiny), post draaien, cadeau openen, evolutie/power-up, gevechtseffecten, Arcade-laden.

## 2026-11-09 (2) — level-up, raidcocon, raid-aantrekkingskracht, gymbordje
- **Level-up** (nieuw `src/LevelUpFxV3.tsx`, `src/TrainerV2.tsx`): na een door de server geaccepteerde "Levelbeloning"-claim gouden draaiende stralen, de trainer komt omhoog, "LEVEL n" slaat in met schok en flits (bij meerdere levels "+n levels"), confetti en beloningschips (✨, netten, TM), daarna "Verder". Tik = overslaan, reduced motion = resultaat. Bekeken 390×844 met echte claim (`.local/claude-cocoon/.local/fx-ui/level-sheet.jpg`).
- **Raidcocon komt uit:**
  - `CocoonHatchFxV3` heeft een raidvariant (eigen ei-art, "DE BAAS IS UIT!", tierkleur, geen beloningen). `src/GoRaidV2.tsx` speelt die alleen bij de live-overgang ei → baas terwijl de raidkaart open is.
  - Op de kaart springt de baas met een flits-pop tevoorschijn (`bb-raid-pop`).
  - Grens: de uitkomst-animatie op de raidkaart niet live in de browser gezien. Het gymscherm opende op de tab "Vechten" en de testklik op "Raids" pakte niet. Het component zelf is via de cocon bewezen.
- **Raid trekt aandacht** (`src/ExploreV2.web.tsx`): een draaiende lichtkrans in tierkleur en een uitdijende ring rond elke raid op de kaart; sterker na uitkomen. Bekeken (★5- en ★1-raid).
- **Gym toont wie hem bewaakt:**
  - een bordje onder de gym met teamnaam in teamkleur (of "Vrij") en zes bezettingsbolletjes;
  - "🛡 naam" van de eerste bewaker, "⭐ Jij" als jij erop staat (goudrand), "Claim hem!" bij een lege gym;
  - tijdens een gevecht ⚔️ met botsanimatie en een flikkerende teambundel.

  Bekeken: neutrale gym met "Wilde wachters". Het gevechtsbordje en "Jij" zijn niet live gezien (geen tweede speler).
- **Testwerkwijze:** de QA-server-kopie (`.local/claude-cocoon/.local/visual-server.ts`, buiten Git) zet een klare cocon klaar (`QA_COCOON`) en kiest het lokale raidgeheim opnieuw tot een gym binnen N s uitkomt (`QA_RAID=N`). Klokverschuiving werkt niet: de server weigert dan de GPS-meting als verouderd.
- **Tests:** 723/723 en `tsc` groen (een kaarttest verwachtte `data-near` direct na de klasse; de attribuutvolgorde is aangepast).
- **Voor Codex (spelregel, niet visueel):** het gymscherm opent op "Vechten" terwijl er een raid op die gym is. Overweeg "Raids" als starttab zolang er een raid loopt.

## 2026-11-09 (3) — medailles, uitslag/gym-moment, munten, Strijd-uitleg, voorstel Arcade
- **Medaillekast:** `game/medalsV3.ts`, `src/MedalCaseV3.tsx` in Doelen; 32 Blender-medailles (`assets/v2/medals/`, `build_medals.py`). Alleen weergave, uit bestaande tellers; de oude gouden rand op statistiektegels is weggehaald (één systeem).
- **Uitslag:** `src/ResultFxV3.tsx` over het gevechtsresultaat (winst, verlies, gelijk) en "Gym veroverd!" in `GoGymsV2`. Duel tot verlies in de browser bekeken.
- **Balans en munten:** zie `docs/design/arcade-strijd-20261109/VOORSTEL.md` §5 (7 km-cocon, cocon-XP, levelbeloning, extra muntbronnen + winkeluitleg).
- **Strijd-uitleg:** `src/StrijdGuideV3.tsx` + tab-illustraties (`assets/v2/modes/`, `build_modes.py`), bekeken 390×844 en 320×568.
- **Voor Codex:**
  - het Arcade-voorstel §4 (jouw bestanden);
  - de balans-/exploitpunten §5 (ranked-farming, NPC-rangsnelheid, dagelijkse ★3-bug, fietsvangst, arcade-XP, routes).
- **Tests:** 728/728 en `tsc` groen.
