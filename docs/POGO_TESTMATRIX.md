# BugBaas — selectieve regressietestmatrix

**Datum:** 20 oktober 2026. **Status:** uitvoerbaar handmatig beslisprotocol; automatische selector is nog niet geïmplementeerd. Dit document voorkomt onnodig opnieuw afspelen van 28 Playwright-schermen terwijl het goedkope kernveiligheidsnet blijft bestaan.

## Beslisregel per wijziging (maximaal vijf minuten werk bij een normale UI-taak)
1. Noteer `BB-ID`, bouwer, start-revisie en gewijzigde bestanden in [werkregister](POGO_WERKREGISTER.md).
2. Kijk niet alleen naar het gewijzigde scherm, maar naar **transitieve dependencies**: gedeelde UI, game/types, servercommands, assets/shaders, Expo-config, packages, DB/schema, testscript. Een onbekend gewijzigd bestand → conservatief volledige relevante suite.
3. Maak twee sets: **MOET OPNIEUW** (geraakt) en **KAN HERGEBRUIKT** (ongewijzigde contracten met geldig oud bewijs). Leg elke skip met `previousRunId` vast.
4. Voer de kleinste toepasselijke test uit, bewaar alleen de nieuwe test-output/screenshot, noteer tester/runner, code-/test-fingerprint en omgeving. Markeer alleen die scope als ACTUEEL-GROEN.
5. Bij samenvoegen of release: voer goedkope `npm test` en `npm run typecheck` uit. De hele 183-test-suite duurde in het historische log circa **2,5 seconden**: daar caching bouwen heeft weinig zin. **Dure volledige browserscans, webexport en telefoontests zijn wijzigings-/releasetrigger**, niet voor iedere tekst- of schermwijziging.

## Toetsklassen
| Code | Wat | Vandaag beschikbaar | Frequentie |
|---|---|---|---|
| UT-AREA | `npx --no-install tsx --test tests/<onderdeel>.test.ts` | Ja, testbestanden bestaan | Na wijziging van spelregels of data |
| UT-ALL | `npm test` | Ja: historisch 183/183 in `../.local/docs-final-tests.log` | Bij integratie / shared servercontract / release; goedkoop |
| TS | `npm run typecheck` | Ja | Bij gewijzigde TS/TSX, merge/release |
| BROWSER-AREA | Playwright alleen aangeraakt scherm + 1 navigatieterugweg + relevante QA-acties | Deels: bestaande bredere `.local/docs-final-browser-audit.py`, diverse gespecialiseerde scripts | Alleen UI-/interactiewijziging; automatiseren met `--screens` in BB-01 |
| BROWSER-NAV | Volledige kaart→menu→scherm→terug + overlay/scroll op 320/390/430 | Bestaande nav-/browseraudits | Bij `src/GameV2.tsx`, `src/FieldHomeV2.tsx`, routing/back of gedeelde UI |
| BROWSER-ALL | 28 schermtoestanden, normale en smalle breedtes, 404/console | Ja: `.local/docs-final-browser-audit.py` en historische `../../bugbaas-docs-final-browser/report.json` | Alleen cross-cutting UI changes of release |
| ASSET | Animatie, GLB/material, shiny, 1024×1024 WebP, model-versus-portret, manifest/licentie | Bestaande art/portrait audit, nader te automatiseren | Alleen model/palet/renderer/manifest/assetpipelinewijziging of release |
| NATIVE | APK start op echt Android; fysieke GPS; schermtoets, logcat, GPU/FPS/accu | NEE, hardware/Gradle blokkeert | Bij native bridge/permissie/kaart, en release; browsermock nooit vervanging |
| WORLD-LIVE | Openbare POI-bron met rechten, route op straat, veiligheid, spooffout, GPS-noise, servercooldown | NEE, externe bron 406/429/timeout; synthetische test wel | Bij data/providerlogica of acceptatie vóór release |
| CLOUD | Firestore transacties, account migratie, herstel uit veilige backup zonder productiedatamutatie | Lokale SQLite-restore geslaagd; echte cloudrestore open | Bij opslag/schema/auth of pre-release |
| SECURITY | cmdId/replay/anti-cheat, GPS-/POI-afstand, toestemming/privacy, auth | Deel tests aanwezig, hardware-privacy open | Altijd bij relevante server/GPS/datachange en release |

## Bestanden → impact (minimumset, uitbreiden bij codewijzigingen)
| Wijziging | Verplichte tests | Wat mag je overslaan |
|---|---|---|
| Alleen tekst op één scherm, geen gedeelde UI | TS + BROWSER-AREA van dat scherm incl. terug/320px | Wereld/GPS/PvP/alle 28 schermen, zolang hun dependencies onveranderd zijn |
| `src/GoCollectionV2.tsx`, `game/dexV2.ts` | `tests/dexV2.test.ts`, `tests/goV2.test.ts` **als evolutie/CP raakt**, TS, BROWSER-AREA Bugdex/collectie/evo | Fysieke kaartloop/PvP-browser, zolang `goV2` geen shared strijdlogica raakt |
| `src/GameV2.tsx`, `src/GoBackV2.tsx`, `src/FieldHomeV2.tsx`, `src/uiV2.tsx` | TS, `tests/presentationV2.test.ts`, BROWSER-NAV (alle linkbestemmingen) | Volledige battle-simulatie als alleen de router/UI verandert, maar merge doet UT-ALL |
| `src/ExploreV2.web.tsx`, `game/walkingV2.ts`, `game/habitatsV2.ts` | `tests/walkingV2.test.ts`, `tests/habitatsV2.test.ts`, TS, kaart/GPS-vangst/browser | Account-/vrienden-/appraisal-browser |
| `game/fieldV2.ts`, `game/walkingRewardsV2.ts`, `src/CatchV2.web.tsx` | `tests/fieldV2.test.ts` en `tests/walkingV2.test.ts`, TS, gerichte vangst/browser | Bugdex-visuals en PvP-schermen als effecten/specimen-contract niet wijzigen |
| `game/goV2.ts`, `game/goBattleV2.ts`, `server/goServiceV2.ts` | `tests/goV2.test.ts`, `tests/trainerV2.test.ts` indien progressie raakt; UT-ALL wegens gedeelde state/rewards, TS, 1 relevante end-to-end actie | Alleen brede visual audit als de schermpresentatie niet verandert |
| `game/trainerV2.ts`, `src/GoCollectionV2.tsx` progression | `tests/trainerV2.test.ts`, `tests/dexV2.test.ts` indien registratie raakt, TS, relevante XP/level/beloning/browser | Alle GPS-buiten-/nearbybezoeken indien unchanged |
| `game/worldSitesV2.ts`, `server/worldSitesDataV2.ts`, `src/WorldSitesV2.tsx` | `tests/worldSitesV2.test.ts`, TS, synthetisch POI/Route in browser; WORLD-LIVE waar mogelijk | Ongewijzigde collectie-/PvP-browser |
| `src/ExploreV2.tsx`, `src/BridgeFieldV2.tsx`, `src/nativeFieldProtocolV2.ts`, `app.json`, `plugins/*` | `tests/nativeFieldV2.test.ts`, TS, NATIVE op fysiek toestel, toestemming/GPS-accuratesse | Alleen browsermock als **voldoende** bewijs is verboden |
| `src/bugModelV2.ts`, `src/WalkingSceneV2.ts`, `src/bugPortraitsV2.ts`, `assets/**`, `scripts/render-bug-portraits.mjs` | ASSET + gerichte map/catch/collection/3D browser, TS indien TS/TSX | Storage/PvP-server tenzij soort-stat/moves/evolutie wijzigen |
| `server/firestore.ts`, `server/firestoreCodec.ts`, `server/sqlite.ts`, `game/typesV2.ts` | `tests/firestoreCodec.test.ts`, `tests/v2.test.ts`, UT-ALL, TS, CLOUD/restore in veilige testomgeving indien schema raakt | Alleen cosmetische screenshots tenzij API-statevorm wijzigt |
| `package.json`, `package-lock.json`, `tsconfig.json`, `App.tsx`, gedeelde widgets/routers | TS, UT-ALL, webbuild, relevante BROWSER-ALL of BROWSER-NAV afhankelijk verandering | Geen automatische hergebruikbeslissing tot impact expliciet bekend is |
| Alleen `docs/*.md`, zonder functionele inhoud/veranderde requirements | Geen game/browsertest nodig; doc-link-/reviewcheck | Alle oude uitvoeringstests |
| Onbekend pad of twijfel over afhankelijkheid | Conservatieve TS + UT-ALL + 1 hoofdsmoke of volledige nav | Geen geautomatiseerde skip |

## Geldigheid van bestaand testbewijs
Een test die vorige week werkte blijft alleen `PASS VOOR DIT RESULTAAT` als de volgende elementen **identiek** zijn of invloedloos bewezen:
- Alle direct en indirect betrokken productiebestanden (inhoudshash, niet uitsluitend `mtime`).
- Testscript en fixtures + testdata-schema.
- Relevant pakket-/configversie en platform runtime (bijv. MapLibre, Android, React Native).
- Datamigraties en externe contracten indien die test daarvan afhankelijk is.
- Hetzelfde functionele risico; bij defecten op een nieuw pad is oude dekking niet automatisch toereikend.

Als bovenstaande klopt: schrijf **SKIP-GEREGISTREERD, vorige QA-run X nog geldig**. Historische runs zonder commit/fingerprint dienen als aanwijzing, niet als onaantastbaar bewijs.

## Minimale script-automatisering (BB-01)
Een eenvoudige change-impact runner is voldoende:
- `scripts/qa/changed.ts`: `git diff --name-only <base>...HEAD`, normalize paths; niet de bovenliggende huis-repository als project gebruiken.
- `scripts/qa/impact.ts`: regels bovenstaande in JSON met globpatronen, dependency edges, gerichte testcommands, geen glob/unknown → safe fallback.
- `scripts/qa/record.ts`: append-only JSONL record met actor, buildSHA, testSHA/fingerprint, command, environment, result, evidence, UTC time.
- `npm run qa:affected -- --base <sha>`: print **RUN**, **REUSE/SKIP**, **BLOCKED** en reden; voer pas gerichte tests uit indien gewenste vlag `--run` en QA-omgeving gescheiden van productie.
- Voor browser: `--screens=S05,S06,S07` in bestaande testscript of kleine runner die alleen deze schermentraversals met echte screenshots oplevert. Oud browserbewijsmateriaal blijft onveranderd.

Niet doen: ieder screenshot standaard opnieuw opnemen, stiekem testresultaten overschrijven, een vervallen test alsnog als groen presenteren, een CI-cache als oordeel over realtime GPS gebruiken, of externe service via te veel requests \"valideren\".

## Release blijft uitzondering
Vóór release **wel** eenmaal: UT-ALL + TS + webbuild, navigatie/essentiële flow, echte Android-GPS en accu, legale live POI/buitenroute, cloudrestore in veilige omgeving, asset/license check en human acceptatie. Deze gates kunnen NIET worden overgeslagen wegens een oude groene browserrun.

Zie [werkregister](POGO_WERKREGISTER.md) en [uitvoerbaar werkplan](superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md).
