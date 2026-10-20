# BugBaas PoGo — Technisch Ontwerp (TO) en assetstrategie
Versie: concept 1.0 — 19 oktober 2026. Alleen analyse en ontwerp; geen gamecode gewijzigd.

## 0. Actuele architectuur (vastgesteld uit code)
Expo 54 / React Native 0.81.5 / React Native Web, TypeScript, Firebase Auth en Firestore-adapter, SQLite QA, MapLibre GL 6.15 + THREE 0.186 op web.
- Root + route: `App.tsx` → `src/GameV2.tsx`; switch 'Safari'/'Team'/'Ranked' onder de motorkap. Volledig kaartgestuurd UI moet de interne naam 'Safari' niet meer aan eindgebruikers tonen.
- Webkaart: `src/ExploreV2.web.tsx`; 3D overlay `src/WalkingSceneV2.ts`; decor `src/natureMapV2.ts`; HUD `src/FieldHomeV2.tsx`. GPS via browser Geolocation API; server verifieert freshness/accuracy/snelheid.
- Native: `src/ExploreV2.tsx` is nog **placeholder**. Dit is de grootste platformblokker.
- Catch: `src/CatchV2.web.tsx`, logica `game/fieldV2.ts`, GPS `game/walkingV2.ts`.
- CP, IV, nectar, power, evolve: `game/goV2.ts`; transacties/receipts `server/goServiceV2.ts`.
- PvP: `game/goBattleV2.ts`, `src/GoBattleV2.tsx`.
- Collectie + Dex: `src/GoCollectionV2.tsx`; 3D model `src/bugModelV2.ts`; 2D artwork `src/bugPortraitsV2.ts`.
- Public endpoint: `server/http.ts`, `api/game.ts`; auth en opslag `server/firestore.ts`, `server/sqlite.ts`.
- Grote refactor vermijden. Eerst nieuwe schermcomponenten/routes als geïsoleerde UI-modules bovenop bestaande command/state-contracten.

## 1. Navigatie- en schermstate
Bestaande UI is verspreid over `tab`, `overlay`, `FieldHomeV2.sheet` en `selected`.
Voorstel: één centrale `navigationState` met `root: 'map' | 'collection' | 'battle'`, `screen: 'dex' | 'profile' | ...`, `modal: ...`, `stack`, `mapCamera`.
- Native/web dezelfde schermroute; GPS/maprendering platformafhankelijk.
- Navigatie bewaart kaartcentrum en zoom/pitch/bearing; na pop/close exact terug.
- Sluit overlays idempotent; actieve vangst laat geen verdwijnende beloning achter; aflopende gevechten eerst servermatig sluiten.
- `BackHandler`, browser history en toegankelijkheidsfocus op een plek, niet per Modal.
- Screens uitsplitsen in `src/screens/go` als iteratief vervolg, pas wanneer feature geïmplementeerd wordt.

## 2. Native GPS-kaart: eerst spike, daarna keuze
**P0:** maak read-only Android-spike om kaart, touch-gestures, ranger 3D en één bug op een echt toestel te vergelijken:
A. Native MapLibre (react-native-maplibre) + afzonderlijke renderer voor 3D overlay. Controleer native Android Expo development build / versiecompatibiliteit / GPU / fonts / GPS.
B. Bestaande MapLibre-webscene in WebView + veilige berichtenbrug van Expo Location. Alleen als frametime/memory stabiel zijn; WebView als compromis voor snelle preview.
Meet voor beide: cold start, tiles, 10/21 modellen, FPS, interacties, GL-context reset, crash-, batterij- en GPS-gedrag. Geen keuze claimen voordat spike slaagt.
App-backgroundlocation: aparte toestemming en expliciete privacy-uitleg. Web gesloten/gesloten tab heeft géén achtergrondtracking.

## 3. Kaart- en werelddata
`WorldEntities`: `BugSpawn`, `Poi`, `Nest`, `Route`, `Event`. Render eigen iconen; atlas/tiles niet kopiëren van Niantic. OSM/OpenFreeMap voorwaarden en attributie zichtbaar houden.
Voorstel nieuwe persistente records:
```ts
type Poi = {id:string; kind:'post'|'nest'; name:string; lat:number; lng:number; source:'osm'|'curated'; reviewed:boolean; enabled:boolean};
type PoiVisit = {uid:string; poiId:string; lastRewardAt:number; receiptId:string};
type BugRoute = {id:string; name:string; polyline:[number,number][]; lengthMeters:number; source:string; enabled:boolean};
type RouteRun = {uid:string; routeId:string; nextVertex:number; metersVerified:number; status:'active'|'paused'|'finished'; startedAt:number; lastFixAt:number; awardedAt?:number};
type DexSeen = {id:string; seenAt:number; caughtAt?:number; shinyCaughtAt?:number; number:number};
```
Locatie en routes alleen versturen voor viewport/kleine radius, met servercache/geofilter; geen wereldwijde POI-lijst naar clients. Curated locaties en geverifieerde toegankelijke paden; geen per ongeluk mapstop in private tuin, spoor, autosnelweg of water. Eerst juridische/kaartleverancierscheck voor OSM-data, POI-licenties en gebruikslimieten.
- Nieuwe commands na strikt schema: `poiInspect`, `poiSpin`, `routeStart`, `routeFix`, `routePause`, `routeFinish` + idempotent receipt.
- Strict GPS-metingen, serverafstanden, cooldowns en échte servertransacties; client mag geen rewards, coordinates namens server, CP of items invullen.
- POI loot, routes en events in aparte diensten: `server/poiService.ts`, `server/routeService.ts`; uitleesbare subsets in GameViewV2.
- Test: gelijktijdige requests/replay, timestamp drift, spoof, snelheidslimiet, false-positives op gebouwen en private grond, GPS terugval.

## 4. Bugdex / evolutie: compatibel datamodel
Nieuwe `DexSpecies`-registry (genummerd, gemigreerd): `id, dexNo, name, modelId, portraitNormal, portraitShiny, familyId, preEvolution?, evolutions:[{to,candy,item?,conditions?}]`. Nooit `number` afleiden uit huidige `Object.keys(WALK_MODELS)` na uitbreidingen; IDs/nummers expliciet en versioned.
- `seen`, `caught`, `shinyCaught` gescheiden; backfill `caught` uit `go.dex`, `seen` uit `discovered`, zonder zonder bewijs extra sightings te verzinnen.
- De eerste 21 zijn bestaand; historiemodus bewaart legacy-bugs apart, geen verwijdering.
- `Specimen.id`, IV, level, shiny, acquiredAt, buddy, favorite, item, rating blijven bewaard bij evo; herbereken CP/aanvalspool, wijzig soort ID alleen in servertransactie.
- Bescherming: geen evolutie zonder beschikbare sprite + model + movePool; geen arbitrage door familienaam-aanpassing.
- Bestaande functie `evolveGo` ondersteunt momenteel alleen `caterpillar→moth`. Voor meer lijnen apart ontwerp/migratie/testcases.
- **Belangrijke entomologische art-bug:** `WALK_MODELS.caterpillar='BeetleGrub'` en `WALK_MODELS.moth='HawkMoth'`. Dit is een keverlarve die nachtvlinder wordt. Kies een correcte, bijpassende rups + vlinder bij de eigen lijn; houd bestaande ID en specimen-progression intact. `beetle='ClickBeetle'` is een volwassen kniptor; kan een afzonderlijke larvelijn krijgen als biologisch passend. Andere insectensoorten niet zomaar als evolutie van elkaar koppelen.

## 5. Bestaande assetbibliotheek en kansen
**Herkomst bevestigd uit lokale `assets/3d/gobkit-insects/source.json` en `LICENSE.txt`:**
- Gobkit Free Insect Pack Vol.1, URL `https://gobkit.com/freebies/insect001/gobkit-insect001-pack.zip`, **30 CC0 .glb's**, gerigged/23 animatieclips per model volgens meegeleverde README.
- **21/30 modellen actief** als `WALK_MODELS`. **Negen al op schijf maar niet actief:** `AntlionLarva`, `Cockroach`, `CraneFly`, `Flea`, `GiantWaterBug`, `Mayfly`, `SoldierTermite`, `TigerBeetle`, `TortoiseBeetle`. Eerst mapping/naam/biomen/moves/balans, dan activatie. Geen nieuwe downloads nodig voor deze negen.
- 21 normal + 21 shiny 1024px origineel-PNG en bijpassende WebP's bestaan. 42 WebP's geteld.
- 2D afbeeldingen zijn renderingen van exact de actieve 3D-modellen, niet los getekende stijlvarianten.
- `assets/3d/gobkit-insects/source.json` bevat nog \"Asset library only; not wired into gameplay\"; die metadata is **verouderd** ten opzichte van actuele `WALK_MODELS`, corrigeren bij volgende contentrelease.
- Gobkit openbare webcatalogus verandert; lokaliseer en bewaar bron, hash, auteur, licentie op het moment van download. Hun algemene `/freebies` pagina toont niet noodzakelijk dezelfde 30-elementenlijst als de lokale insect-zip; dus geen aannames over meer identieke modellen.
Andere kandidaten na licentiecontrole: `https://gobkit.com/` (betaalde/gegenereerde stijlgelijkwaardige pack-opties: rechten/kosten checken), `https://sketchfab.com/` met uitsluitend expliciet compatibele commerciele licenties, `https://www.fab.com/` alleen met geschikte rechten. Geen CC-NC/ND-modellen gebruiken voor commerciële/AI-assetpipeline. Andere stijl = geen directe opname.

## 6. Uniforme kwaliteitsstraat voor ALLE modellen / portretten
**Eén model = één bron van waarheid**. Voor nieuwe art:
1. Assetbron/licentie/hash en anatomie/naam door review; één GLB / gedeelde oriëntatie/pivot/hoogte.
2. Rig compatibel of eigen rig met vaste named clips: idle, walk, attack, hit, flee, fly, etc. Ontbrekende clips expliciet markeren en passende fallback per soort; géén foutieve vlieg-animatie voor larve.
3. 3D-materialen en texturen normaliseren met vaste lichtopstelling; echte shiny-materialvarianten in `src/bugModelV2.ts SHINY_PALETTES`, geen willekeurige CSS hue-rotate.
4. Visuele norm: transparant 1024×1024, vaste 3/4-camera, vergelijkbare silhouette-occupancy (doel 70–85%), gelijke belichting, geen afgesneden antennes/poten; AA alpha en correct transparante marges.
5. Render met bestaande pipeline (NIET vervangen):
   - `scripts/render-bug-portraits.mjs` opent lokale 8094 renderstudio (uses `WALK_MODELS`, `THREE.ACESFilmicToneMapping`, exact `lightBugs`).
   - `scripts/save-bug-portraits.py` slaat normal + shiny PNG op + manifest.
   - `scripts/encode-bug-portraits.mjs` encodeert naar 1024x1024 WebP en genereert `src/bugPortraitsV2.ts`.
   - Render QA inspectie alpha margins, palette/material match, 320px cell en 3D capture, hashing + snapshot-diff.
6. Asset budget vastzetten: één bronmodel + 2 portretten per soort; voor 9 extra modellen: 9 GLB's al aanwezig, **18 extra WebP-portretten** te genereren; **30 soorten / 60 WebP-portretten** na succesvolle activatie. Leeftijdsfases vereisen extra unieke assets.
7. Variant/rare/shiny consistent tussen kaart, vangst, detail, buddy, Dex en PvP. Test matige Android GPU; laad alleen zichtbare modellen + kleine preload. Huidige `WalkingSceneV2.ts` laadt alle model-ID's in één `Promise.all`; productie optimalisatie: cache, lazy/pool/LOD.

## 7. Visuele UI-componenten
Eén componentset: `GoHeader`, `GoGlassSheet`, `BugCard`, `DexEntry`, `PokemonLikeCPArc` (zonder beschermde assets), `GoActionButton`, `NearbyTabs`, `MapHud`, `EvoGraph`, `PoiMarker`.
Eigen BugBaas-palet: natuur-groen, warm zand, blad-amber; donker tekstcontrast; 8px grid; touch targets >=44pt; responsive fullscreen-kaart op smartphone, gecentreerde maxWidth op desktop.
Doel: herkenbare ruimtelijke patronen en voorspelbare bediening zoals PoGo, geen pixelgekopieerd handelsmerk.

## 8. Werkpakketten / afhankelijkheden
| Gate | Afhankelijk | Resultaat |
|---|---|---|
| G0 Browserbaseline | Reeds uitgevoerd (28/28) | `../bugbaas-pogo-design-audit/report.json` |
| G1 UI-shell | route-state + mapcamera | Hoofdmenu/Dex/collectie/terug werken zonder state-verlies |
| G2 Atlas21 | versioned dex ID + seen/caught + EvoGraph | 21 entries + bestaande rups→mot, consistent model |
| G3 Art30 | 9 extra modellen: namen/types/animatie/portretten | 30/30 normal+shiny; 60 WebP + 3D; alle licences |
| G4 GPS-native spike | Android-renderer/GPS bridge | Werkende realtime 3D map op echte Android |
| G5 POI/Routes | datalicentie + server/state | Echte interacties op openbare plaatsen, beloningen/route |
| G6 PvP/Research polish | basis stabiel | Overgangen, visuals, uitnodigingen, meer onderzoek |
| G7 Release | restore test, geverifieerde cloud + echte wandeling | Pas dan APK / productie, expliciete go/no-go |

## 9. QA matrix en performance
- Functioneel web: smoke-toets elke schermroute 390×844; 320×640 en 430×932; 1366 desktop; portrait/landscape na relevantere implementaties.
- API: commandId replays, expectedRevision, gift/reward anti-duplication, raced POI, nickname, event expiry, wrong team/species, legacy migration.
- Asset: GLB openen + echte idle/walk/hit; PNG/WebP 1024×1024 alpha bounds; shiny-material # toetsen; GPU-memory; rechtencertificaat.
- UX: eerste gebruiker 0 bugs, 1 bug, 21/21 en 30/30; seen-not-caught; shiny-registered; évolueerbaar; geen voorraad; GPS denied/stale/inaccurate; offline/fetch fail; PvP timer.
- Native: minimaal twee Android-toestellen/emulator + fysieke GPS buitenwandeling, achtergrondgedrag, battery/thermal. Niet beweren dat browsergroen een native release is.

## 10. Bronlinks
- Lokale bronbestanden: `game/walkingV2.ts`, `src/bugModelV2.ts`, `scripts/*bug-portraits*`, `assets/3d/gobkit-insects/README.txt`, `assets/3d/gobkit-insects/LICENSE.txt`.
- Gobkit eigendom/licentie: https://gobkit.com/freebies en https://github.com/Ariescar/gobkit-free-assets
- Pokémon GO UI: https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/84-what-is-the-map-view/; https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/124-viewing-the-pokedex/
