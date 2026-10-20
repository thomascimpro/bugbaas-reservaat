# BugBaas — Werkregie en selectieve QA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** De al grotendeels gebouwde BugBaas PoGo-versie beheersbaar afronden met aantoonbare maker/reviewer/tester per wijziging, herbruikbaar testbewijs, minimale onnodige hertests en een veilige native/live/cloud-releasegate.

**Architecture:** Één eigen project-Git-basis met kleine, afgebakende BB-tickets en een leidend Markdown-register; historische `POGO_UITVOERING.md` blijft ongewijzigd auditarchief. Een dunne change-impact selector bepaalt welke tests geraakt worden; append-only testrecords borgen actor, code- én test-fingerprint, runtime, screenshots en vorige bewijsrun. Alleen goedkope unit/TS-checks standaard bij merge, zware browser/native/cloudchecks bij passende wijzigingen of release.

**Tech Stack:** Expo 54, React Native/Web, TypeScript, Node/tsx tests, Playwright/Python, MapLibre/Three.js, Firebase/Firestore, SQLite-QA.

**Spec:** `docs/POGO_FO_20261019.md`; `docs/POGO_TO_ASSETS_20261019.md`; actuele feitelijke status `docs/POGO_UITVOERING.md`; [werkregister](../../POGO_WERKREGISTER.md); [testmatrix](../../POGO_TESTMATRIX.md).

## Global Constraints
- Bestaande spelerdata, CP/IV, shinies, shiny-art, buddy, competitieve ratings, items en geschiedenis niet verliezen of stilzwijgend migreren.
- Geen productiepublicatie of wijziging van Firebase/Vercel/ander online project zonder expliciete toestemming.
- Geen Pokémon/Niantic-afbeeldingen, eigen kaart/POI-data rechtmatig en met juiste attributie.
- Vervang `HIST-GROEN` niet met `ACTUEEL-GROEN` zonder exact code-/test-/omgevingsbewijs.
- Onbekende bouwer van oud werk blijft `onbekend`, nooit automatisch OS-username of projectaccount als auteur registreren.
- Browsersimulaties vervangen nooit GPS-wandeling op Android of live POI-veiligheidscontrole.
- De huidige POGO-implementatie is **verder dan FO/TO concept**: G1/G2/G3/G5/G6 reeds WEB gebouwd, 183/183 unitchecks historisch groen; niet overnieuw bouwen.
- De repo bevat nog geen eigen `.git`; het momenteel gevonden bovenliggende Git-root is `C:/Users/thoma.THOMAS`, dus committen vanuit de huidige map is onveilig tot er een echte projectrepo is.
- `.gitignore` sluit al `node_modules/`, `.local/`, `dist/`, `android/`, `.env*`, `.vercel/`, sleutels uit; controleer gevoelige/QA-bestanden expliciet bij eerste projectcommit.
- Geen volledige herhaling van 28 browserscreens na ongerelateerde wijzigingen. De bestaande 183-test suite duurt circa 2,5s; die mag bij integratie gewoon volledig draaien.

## Review Focus
1. Oude QA-output zonder bronversie/auteur mag géén verzonnen maker of automatisch herbruikbaar PASS worden; tests voor onbekende fingerprint in Task 2/3.
2. Een gedeeld widget, `game/typesV2.ts`, `package-lock.json`, `App.tsx`, gewijzigde tests/fixtures of renderer kan veel schermen invalideren; conservatieve dependency/fallbacktests in Task 3.
3. Native bridge in Chromium geslaagd terwijl ADB `unauthorized` blijft: hardwarestatus moet geblokkeerd blijven; Task 6.
4. Overpass 406/429/timeout en synthetische OSM-testdata zijn geen live gevalideerde route of rechtmatige POI-bron; Task 7.
5. Een replay, database-herstel of overlappende gebruikersactie mag geen dubbele beloningen of verlies van specimen-identiteit/IV/shiny veroorzaken; Task 7/9.

---

## File Structure / eigendom
**Bestaand, niet zomaar herschrijven:**
- `docs/POGO_UITVOERING.md`: historische uitvoering en bewijs (bestaand).
- `docs/POGO_FO_20261019.md` / `docs/POGO_TO_ASSETS_20261019.md`: requirements, geen dagelijkse status.
- `docs/POGO_WERKREGISTER.md`: vanaf nu **actuele operationele bron** voor tickets/rollen/staten.
- `docs/POGO_TESTMATRIX.md`: toetsselectie en beslisregels.

**Bij uitvoering van automatisering pas toevoegen:**
- `qa/test-impact.json`: machineleesbare mapping bestanden → risicogroep → tests.
- `qa/runs.jsonl`: append-only, per command één resultaat; geen raw tokens, persoonslocaties of databases.
- `scripts/qa/impact.ts`: pure testselectie, geen side effects.
- `scripts/qa/fingerprint.ts`: SHA256-inputset (inclusief relevante config/fixtures).
- `scripts/qa/record.ts`: gevalideerde append-only runrecords.
- `scripts/qa/run.ts`: opt-in command runner met veilige QA-omgeving.
- `tests/qaImpact.test.ts`, `tests/qaRecord.test.ts`: regressietests voor selecteren/registreren.
- `.github/workflows/qa.yml` pas nadat eigen Git repo/CI-scope expliciet bevestigd is.

## Werkpakket A — structuur en testgeheugen

### Task 1: Project-eigen Git, privacy en immutable baseline (BB-00)

**Files:**
- Inspect: `.gitignore`, `docs/POGO_UITVOERING.md`, `src/GameV2.tsx`, `tests/*.test.ts`.
- Create in project metadata: `.git/` als **eigen Git-repository**, alleen wanneer dit veilig is en na controle van bovenliggende root.
- Modify: `docs/POGO_WERKREGISTER.md` (baseline SHA + datum + eigenaar/uitvoerder; eigenaar laat zich expliciet toewijzen).

**Interfaces:** produceert `<baseSha>` voor alle volgende task-/testrecords; niemand gokt auteur van oudere bron.

- [x] **Step 1: Inspecteer scope en geheimen**: bevestigd op 20-10 via Devspace Work2: `git rev-parse --show-toplevel` = `C:/Users/thoma.THOMAS`, eigen `.git` ontbreekt. `.gitignore` uitgebreid; QA-SQLite zit in `.local/`; één mogelijk publieke Firebase API-key in clientconfig, verifieer bij de eerste staged-file review. **Dit is een voorbereidende controle, geen Git-commit.**
- [ ] **Step 2: Eigen lokale private projectrepo + eerste commit** — **gedeeltelijk uitgevoerd op 20-10**: gebruiker heeft `git init -b main` in de juiste BugBaas-map uitgevoerd; Devspace heeft de juiste repo-root/branch gecontroleerd en `dist-android-v2/` uitgesloten. **Nog te doen:** bestanden staged controleren, **eerste lokale commit** door gebruiker in PowerShell; nog geen GitHub/remote. Zie actuele checkpoint in `docs/POGO_WERKREGISTER.md`. **Geen tweede init en geen herhaling van tunnelanalyse.**
- [ ] **Step 3: Verifieer repo-afbakening**: `git rev-parse --show-toplevel` = exact `bugbaas-reservaat`; `git ls-files` toont géén `.local/`, credentials, SQLite-data, `node_modules/`, `dist/`.
- [ ] **Step 4: Leg `baseSha` vast** in BB-00; bestaande runs zijn HIST-GROEN, niet retroactief op deze SHA uitgevoerd.
- [ ] **Step 5: Commit**: `chore(qa): isolate BugBaas source baseline` (lokaal; niet pushen zonder opdracht).

### Task 2: Maker/tester/reviewer bewijscontract (BB-01a)

**Files:**
- Create: `scripts/qa/record.ts`, `tests/qaRecord.test.ts`, `qa/runs.jsonl` (klein, gesanitiseerd).
- Modify: `docs/POGO_WERKREGISTER.md` alleen voor BB-01a.

**Interfaces:**
- `export type QaResult = 'PASS'|'FAIL'|'BLOCKED'|'SKIP_REUSED'`.
- `export type QaRecord = {runId:string; taskId:string; testId:string; result:QaResult; actor:string; actorType:'human'|'agent'|'ci'; revision:string; testRevision:string; environment:string; startedAt:string; evidencePath?:string; scope:string[]; previousRunId?:string; skipReason?:string; origin:'direct'|'reused'}`.
- `export function validateRecord(input:unknown):QaRecord`.
- `export async function appendRecord(file:string,record:QaRecord):Promise<void>` atomair/append-only of lock-geserialiseerd.

- [ ] **Step 1: Schrijf tests** dat PASS zonder snapshot/actor/omgeving geweigerd wordt, reused alleen met bestaand `previousRunId` + `skipReason`, geen dubbele `runId`, geen token of exact GPS in evidence.
- [ ] **Step 2: Run**: `npx --no-install tsx --test tests/qaRecord.test.ts`. Verwacht **FAIL** zolang record.ts ontbreekt.
- [ ] **Step 3: Implementeer validatie/append** met type-safe foutmeldingen en veilige opslag, zonder bestaande `POGO_UITVOERING.md` te overschrijven.
- [ ] **Step 4: Run** dezelfde tests; verwacht PASS + toon het nieuwe `runId` en gesanitiseerde JSON-regel.
- [ ] **Step 5: Commit**: `feat(qa): record per-task authors, testers and evidence`.

### Task 3: Risicogerichte testselectie met bewijshergebruik (BB-01b)

**Files:**
- Create: `qa/test-impact.json`, `scripts/qa/impact.ts`, `scripts/qa/fingerprint.ts`, `tests/qaImpact.test.ts`.
- Consume: `docs/POGO_TESTMATRIX.md`, `qa/runs.jsonl`.

**Interfaces:**
- `type TestDecision={testId:string; action:'RUN'|'REUSE'|'BLOCKED'; reason:string; previousRunId?:string}`.
- `export function chooseTests(changedPaths:string[],registry:ImpactRegistry,prior:QaRecord[],newFingerprint:Record<string,string>):TestDecision[]`.
- `export async function fingerprintInputs(paths:string[]):Promise<string>` (deterministische gesorteerde `path + SHA256(contents)`).
- Onbekende bestandswijziging of ontbrekend bewijs → `RUN`/conservatieve fallback, nooit `REUSE`.

- [ ] **Step 1: Schrijf tests** voor alleen dex-UI, gedeeld `uiV2.tsx`, `game/typesV2.ts`, wijziging in `tests/*.test.ts`, `package-lock.json`, gewijzigde shiny-palette, puur docs, ontbrekende snapshot, plus geldige reuse bij gelijk gebleven inputsets.
- [ ] **Step 2: Run**: `npx --no-install tsx --test tests/qaImpact.test.ts`. Verwacht FAIL voordat de selector bestaat.
- [ ] **Step 3: Bouw eerst alleen pure selectie** op expliciete glob-/dependencygroepen uit de testmatrix; pin testcode/fixture/hash en pakketversies. `REUSE` vereist een direct PASS-run met dezelfde inputfingerprint.
- [ ] **Step 4: Run** QA-tests; verwacht dat een geïsoleerde Bugdex-wijziging **geen** 28-schermen-browseropname selecteert; een gedeelde HUD-wijziging wel brede navigatie kiest; onbekend bestand = safe fallback.
- [ ] **Step 5: Commit**: `feat(qa): calculate change impact and reusable test evidence`.

### Task 4: Kleine QA-runner en selectieve browserscreens (BB-01c)

**Files:**
- Create: `scripts/qa/run.ts`; optionally `scripts/qa/cli.ts`.
- Modify: `package.json` (nieuwe `qa:affected`), gerichte Playwright-helper rond bestaande `.local/docs-final-browser-audit.py` (niet bestaande screenshots/fixtures wissen).
- Test: `tests/qaImpact.test.ts`, `tests/qaRecord.test.ts` en één veilige lokale QA-run.

**Interfaces:**
- `npm run qa:affected -- --base <sha>`: standaard **plan** met `RUN / REUSE / BLOCKED`.
- `npm run qa:affected -- --base <sha> --run`: **alleen geselecteerde** tests starten na veilige omgevingcheck.
- Browserhelper accepteert optioneel `--screens=S05,S06,S08`; zonder vlag oorspronkelijke brede test mogelijk. Elke geselecteerde screenshot heeft eigen id + hash/actortijd.

- [ ] **Step 1: Test CLI dry-run**: output toont geen tests die niet wijzigen, en slaat nooit `HIST-GROEN` automatisch over zonder snapshot.
- [ ] **Step 2: Run CLI dry-run**: verwacht fout wegens ontbrekende CLI/command; geen browser/DB-mutatie.
- [ ] **Step 3: Implementeer runner** en vang `exitCode`, test output, run-id, actor/runner + sanitization; geen native-acceptatie op browsermock. Test lokale test-DB uitsluitend met `mode:local`.
- [ ] **Step 4: Run** dry-run + klein dex-testje; check dat één record ontstaat en een identieke volgende run besluit `REUSE` met vorige run-ID. Wijzig testbestand: resultaat moet terug naar `RUN`.
- [ ] **Step 5: Commit**: `feat(qa): run only affected screen flows and record results`.

### Task 5: Eén taak = één change set, één review en makkelijk overdraagbaar (BB-01d)

**Files:** Modify `docs/POGO_WERKREGISTER.md` (per BB-ticket gekozen maker, reviewer, testbewijs, SHA); optionally `docs/POGO_UITVOERING.md` één link terug naar nieuwe actuele tracker.

**Interfaces:** Bij elk ticket zijn `taskId`, bouwer, basiscommit, changed paths, PASS- of reuse-records, reviewer en volgende actie verplicht. Historische auteurs blijven onbekend.

- [ ] **Step 1: Pak één laagrisico tekst/UI-workitem als proef**; werk gescheiden branch. Noteer maker/tool en korte acceptancecriteria vóór edit.
- [ ] **Step 2: Run gerichte `qa:affected`** en slechts betrokken UI-browserflow; bewaar SHA, screenshots/log, skip-redenen.
- [ ] **Step 3: Reviewer controleert** code + acceptatie (voor security/GPS/gegevensmigratie onafhankelijk); tester en reviewer zijn aparte rollen, mogen niet automatisch gelijk zijn.
- [ ] **Step 4: Sluit ticket** als `BOUW KLAAR + PASS(scope)`; native/live-gebreken blijven apart `BLOCKED`, geen universeel groen.
- [ ] **Step 5: Commit**: `docs(qa): record work item and reused evidence`.

## Werkpakket B — resterende echte productrisico's

### Task 6: Android GPS + 3D kaart op fysiek toestel (BB-60)

**Files:**
- Inspect/modify alleen na diagnose: `src/ExploreV2.tsx`, `src/BridgeFieldV2.tsx`, `src/nativeFieldProtocolV2.ts`, `app.json`, `plugins/withReleaseConfig.*`.
- Test: `tests/nativeFieldV2.test.ts`, actuele Android build/run, `adb logcat`.

**Interfaces:** Bestaande `worldLocate`, `worldEncounter`, `worldCast` server-commands blijven onveranderd waar mogelijk. Browserbrug is geen hardwareverificatie.

- [ ] **Step 1: Isoleren ADB en Gradle-blokker** (ADB unauthorized, Gradle Java loopback) zonder firewalls/auth/SSL uit te schakelen; leg oorzaak, uitvoerder en logs vast.
- [ ] **Step 2: Specificeer Android acceptatietest vooraf**: toestemming weigeren/herstellen, GPS-versheid, kaartzoom/pitch/bearing, vangst + terug, achtergrond, buddy, portretten, geen data-/tokenlek.
- [ ] **Step 3: Test nieuwe native wijziging** met `npx --no-install tsx --test tests/nativeFieldV2.test.ts` + `npm run typecheck` en alleen benodigde bridgebrowserflow; registreer SIM-groen.
- [ ] **Step 4: Test op echt Android-toestel** en log werkelijke toestelnaam/OS, FPS, accu, GPS/looptijd en crashlog; alleen dan NATIVE-groen.
- [ ] **Step 5: Commit**: `fix(native): verify BugBaas field on Android` als de blokkade daadwerkelijk is opgelost; anders ticket `GEBLOKKEERD` met herhaalbare oorzaak.

### Task 7: POI en routes, van synthetisch naar betrouwbaar live (BB-70)

**Files:** `server/worldSitesDataV2.ts`, `game/worldSitesV2.ts`, `src/WorldSitesV2.tsx`, `tests/worldSitesV2.test.ts`.
**Interfaces:** Bestaande `poiSpin`, `routeStart`, `routePause`, `routeResume`, `routeFinish` receipts, afstand en toestemming bewaren.

- [ ] **Step 1: Leg de beperkingen van huidige provider vast** (Overpass 406/timeout/429); zoek legale, betrouwbare OSM- of eigen gecureerde POI-bron zonder limit-ontwijking of betaalde dienst zonder akkoord.
- [ ] **Step 2: Schrijf tests** voor lege/stale/offline response, onveilige POI (privéterrein/snelweg/water), routevolgorde, GPS-afstand, dubbele claims.
- [ ] **Step 3: Run** `npx --no-install tsx --test tests/worldSitesV2.test.ts`; wijzig alleen betrokken data-/serverlaag, herhaal synthetisch browserpad.
- [ ] **Step 4: Laat op fysieke kaart een échte, wettelijk toegankelijke publieke route en post toetsen**; documenteer privacyveilig resultaat, geen precieze woonlocaties in gedeelde reports.
- [ ] **Step 5: Commit**: `feat(field): validate public POI and route source` als bewezen; anders LIVE-OPEN blijven.

### Task 8: Kleine resterende schermverbeteringen, NIET de webapp herbouwen (BB-10/20/30/40/50)

**Files:** Kies per ticket maar één scherm in `src/FieldHomeV2.tsx`, `src/GoCollectionV2.tsx`, `src/GoBattleV2.tsx`, `src/WorldSitesV2.tsx` of `src/ExploreV2.web.tsx`.
**Interfaces:** Bestaande FO S01–S18 en huidige 28 nieuwe browserbeelden vormen de baseline; geen van G1–G6 opnieuw implementeren.

- [ ] **Step 1: Schrijf precies de nog zichtbare afwijking t.o.v. FO/audit** met screenshot, geen generieke \"redesign\".
- [ ] **Step 2: Voeg gerichte UI-test toe** voor het probleem op 390px en één relevante randbreedte 320/430px.
- [ ] **Step 3: Implementeer uitsluitend die schermwijziging** en verifieer BROWSER-AREA + TS. `npm test` bij merge is sneller dan complexe unit-cache.
- [ ] **Step 4: Registreer wat niet gewijzigd is** als `SKIP-GEREGISTREERD` met vorige geldige run; test niet opnieuw PvP/GPS als alleen een Buddy-label verandert.
- [ ] **Step 5: Commit**: `fix(ui): improve Sxx <concreet>`.

### Task 9: Releaseregel met drie echte blokkades (BB-90)

**Files:** `docs/POGO_WERKREGISTER.md`, `docs/POGO_UITVOERING.md`, geselecteerde QA-scripts en echte release-manifest; geen nieuwe productieconfig zonder toestemming.
**Interfaces:** Eén `releaseSha` verwijst naar alle gebruikte `runId`-records; release-toestemming door projecteigenaar.

- [ ] **Step 1: Run** `npm test`, `npm run typecheck`, `npm run web:build` op exact dezelfde `releaseSha` en hou separate rapporten bij.
- [ ] **Step 2: Run** hoofdmap→vangen→dex→detail→terug, ranked en route in echte QA-omgeving; volledige 28-beeldscan alleen als het releasebeleid/impact dit eist.
- [ ] **Step 3: Eis NATIVE-GROEN** met fysieke wandeling, GPS/fallback en redelijke FPS/batterij.
- [ ] **Step 4: Eis WORLD-LIVE en CLOUD** (legale post/route en niet-destructief getest Firestore-herstel); lokale SQLite-restore is onvoldoende.
- [ ] **Step 5: Reviewer + projecteigenaar signeren** het SHA/risicooverzicht. Geen productie-release zonder expliciete go/no-go.

## Parkeerplaats (niet afhankelijk voor huidige Android/POI-release)
**BB-80, S16 Nest/Raid** en extra evolutielijnen: eigen kleine specificatie/plan pas als de basis werkt. Geen ongevraagde frameworkrewrites; laat toekomstige ontwikkelaars deze features niet markeren als gebouwd op grond van een statische wireframe.

## Plancheck
- FO S01–S18 worden gedekt door bestaande `POGO_UITVOERING.md` en BB-10…80; dit plan bouwt alleen **ontbrekende zekerheid** en **nieuwe tracking/tooling**.
- Rollen, herhaal-/skiplogica en vijf risicofocuspunten hebben toetsbare taken.
- Er is bewust geen andere cloud, nieuwe database, betaalde atlas of nieuwe buildarchitectuur gekozen.
- Alle data-/serverwijzigingen vragen hun eigen gerichte tests; lage-risico schermwijzigingen vragen geen volledige dure screenshotbatch.
