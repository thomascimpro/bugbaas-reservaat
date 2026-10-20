# BugBaas PoGo — centraal werkregister

**Laatste inventarisatie:** 20 oktober 2026 (ChatGPT GPT-6, via Devspace Work2; broninspectie, geen nieuwe speltest).
**Doel:** direct zien **wat**, **door wie**, **op welke versie**, **met welk bewijs** is gemaakt, gecontroleerd of nog openstaat.
**Leidende registratie vanaf nu:** dit bestand voor actuele workitems; `POGO_UITVOERING.md` blijft historisch verslag. Functionele scope = `POGO_FO_20261019.md`; technische scope = `POGO_TO_ASSETS_20261019.md`.
**Belangrijk:** historische maker/testbediener is niet uit de bestaande logs te bewijzen: **onbekend**. Windows-bestandseigenaar ≠ auteur. Geen namen gokken.

## ACTUELE CHECKPOINT — BB-00 / Task 1 (20 oktober 2026)

**Status: IN UITVOERING — Git-repository AANGEMAAKT, EERSTE COMMIT NOG OPEN.**
**Verifieerbare actor:** gebruiker initialiseerde Git via Windows PowerShell (`git init -b main`); ChatGPT GPT-6 (Devspace Work2) verifieerde projectroot en bereidde de bestandsselectie/documentatie voor.
**Eerstvolgende actie:** **eenmalige veilige eerste lokale baselinecommit maken in bestaande BugBaas-Git-repo.** Geen nieuwe `git init`, geen tunnelherstel en geen herhaling van game-/browsertests.

**Afgerond en gecontroleerd:**
- [x] PowerShell gebruiker: `git init -b main` → lege Git-repo aangemaakt **binnen BugBaas**.
- [x] Devspace Git-inspectie: `git rev-parse --show-toplevel` = `C:/Users/thoma.THOMAS/Documents/Codex/2026-10-12/rev/outputs/bugbaas-reservaat`; `git rev-parse --git-dir` = `.git`; branch `main`; nog geen commits.
- [x] `.gitignore` beschermt `node_modules/`, `.local/` en SQLite, `.env*`, sleutels, `dist/`, `android/`, `.expo/` en werkboomhulpmiddelen. Op 20-10 aanvullend **gegenereerde `dist-android-v2/`** (11 MB) uitgesloten, niet de broncode of 3D-assets.
- [x] Verkennende staging-inventarisatie: na de ignore-aanpassing **544 niet-genegeerde bestanden** (eerder 629; gegenereerde Android-export nu genegeerd), circa 164 MB bronassets; geen individueel bestand boven 50 MB in onderzochte asset/exportmappen. `git check-ignore -v` bevestigt uitsluiting van `dist-android-v2/`, `.local/`, `node_modules/`, `dist/`, `android/` en `.env.local`. Standaard credentialpatroon vond alleen `src/firebaseConfig.ts` (Firebase-clientconfig, mag niet als servergeheim worden behandeld). `.env.example` bevat uitleg/voorbeeldwaarden. Dit is **geen sluitende securityscan**. Geen `git add` uitgevoerd door de agent.
- [x] Centrale `AGENTS.md` en `README.md`, FO/TO, werkregister, gerichte testmatrix en 9-task plan bestaan. Gamecode niet gewijzigd; tests opzettelijk niet opnieuw gedraaid.

**Nog open — NIET als GEREED markeren tot bewijs:**
- [ ] Gebruiker voert in **deze** Git-repo `git add -A` uit en controleert staged files op vertrouwelijke gegevens, gegenereerde export, grote niet-bedoelde bestanden en path boundary.
- [ ] `git diff --cached --check` slaagt, staged filelijst bevat geen `.local/`, `android/`, `dist-android-v2/`, `node_modules/`, persoonlijke SQLite of secrets.
- [ ] Gebruiker maakt de **eerste lokale commit** met bericht `chore(qa): isolate BugBaas source baseline`; nog **niet pushen**.
- [ ] Git SHA en `git ls-files`/projectroot worden **daarna** geverifieerd, SHA in dit register gezet. Daarna pas `BB-00 = GEREED` en `BB-01` starten.

**Weggevallen blokkade:** de eerdere noodzaak van een schrijvende Devspace home-tunnel geldt **niet meer voor Git-init**: de gebruiker heeft Git met eigen PowerShell succesvol geinitialiseerd. Historische diagnose: de afzonderlijke oude home-tunnel was offline maar actieve Work2 werkte al; legacy poort `8088` werd door BugBaas gebruikt. **Niet opnieuw proberen of herinstalleren.** De Devspace Work2-shell blijft uitsluitend lezen/tests/builds ondersteunen; Git-staging/commit wordt door de gebruiker zelf in PowerShell uitgevoerd.

**Hervatregel voor nieuwe chats:** `AGENTS.md` → dit blok → `git log -1` + projectroot + staged files inspecteren. Als een commit al bestaat: **niet opnieuw initialiseren of tweede baseline maken**; gewoon SHA vastleggen. Als commit ontbreekt: één keer veilig committen. **BB-01 is de volgende taak na BB-00.**

## Legenda / bronkwaliteit
- **BOUW** = functie aanwezig in code; **WEB-GROEN** = relevante browserchecks zijn geslaagd; **SIM-GROEN** = gesimuleerde GPS/native/POI; **NATIVE-OPEN** = nog niet op echte Android gedraaid; **LIVE-OPEN** = leverancier/locatie buiten niet geverifieerd.
- **HIST-GROEN** = resultaat uit historisch testbewijs zonder onveranderlijke codeversie; blijft referentie, maar mag pas hergebruikt worden na een wijzigingsanalyse.
- **ACTUEEL-GROEN** = vastgelegde projectcommit of input-fingerprint + command + testcodeversie + testomgeving + bewijsbestand + actor.
- **STALE** = relevant bestand, transitive dependency, testdefinitie, lockfile of omgeving veranderde; bewijs historisch bewaard, maar niet meer geldig voor het gewijzigde gebied.
- **SKIP-GEREGISTREERD** = test niet opnieuw gedraaid met schriftelijke impactanalyse + geldig eerder bewijs. Nooit stilzwijgend PASS.
- **GEBLOKKEERD / NIET-GEBOUWD** = expliciet niet klaar. Browserbrug ≠ native, synthetische OSM ≠ live route.

## Actueel overzicht (overgenomen en gecontroleerd tegen bestaande bron/logs)
| ID | FO-schermen | Werkpakket / prioriteit | Bouw | Testbewijs | Maker (historisch) | Open / volgende actie |
|---|---|---|---|---|---|---|
| BB-00 | alle | **Eigen Git-basis + provenance** · P0 | **IN UITVOERING: repo gemaakt; commit open** | PowerShell `git init -b main` door gebruiker, projectroot/branch door Devspace bevestigd; eigen `.git` aanwezig, nog geen SHA. `dist-android-v2/` extra uitgesloten. | Gebruiker: Git-init; ChatGPT GPT-6: Git-/ignore-review; eerdere code-auteur onbekend | **Eerstvolgende: staged files controleren, lokaal baselinecommit maken, SHA verifiëren; geen nieuwe init of tunnelreparatie** |
| BB-01 | alle | **Testimpact + bewijsregistratie** · P0 | Dit register gestart; automatische selectie nog niet gebouwd | Dit bestand + `POGO_TESTMATRIX.md` | ChatGPT GPT-6 (plan) | Automatische impactanalyse en testlog toevoegen, zonder tests steeds volledig te herhalen |
| BB-10 | S02,S03,S18 | Navigatie, menu, schermterug en kaartcamera · P1 | WEB gebouwd | HIST-GROEN: `../../bugbaas-docs-final-browser/report.json` en `../../bugbaas-sprites-browser/checks.json` | Onbekend | Geen nieuwe test zolang navigatie, gedeelde UI en kaartcamera niet wijzigen; native back-test later |
| BB-20 | S05,S06,S07,S08 | Bugdex/collectie/detail/evolutie · P1 | WEB gebouwd (#001–030, 1 evolutie) | HIST-GROEN: browseraudit + `../.local/docs-g1-g3-tests.log` | Onbekend | Geen feature opnieuw bouwen; bij UI/datawijziging alleen Dex/collectie/evolutie-suites; native 3D-detail apart |
| BB-30 | S04,S05,S07,S12 | 30 GLB's + normal/shiny portretten · P1 | Assets WEB gebouwd | HIST-GROEN: 60-portretcontrole en nav/assetchecks volgens `POGO_UITVOERING.md` | Onbekend | Nieuwe model-/shader-/renderpipelinewijziging pas dan art/3D-test; bron/licentie bewaren |
| BB-40 | S09,S10,S11,S12,S13,S14,S18 | Tas, onderzoek, trainer, buddy, vrienden, PvP en settings · P1 | WEB gebouwd | HIST-GROEN: `../../bugbaas-progression-browser/checks.json`, 183/183 unit-tests volgens log | Onbekend | Alleen geraakte pagina's opnieuw testen; native sheets en echte wandeling apart |
| BB-50 | S01,S04 | Web-GPS, 3D-wereld, vangen · P1 | WEB gebouwd | HIST-GROEN: `../../bugbaas-docs-final-browser/report.json`; lokatiefout-herstel eerder getest | Onbekend | Geen volledige vangroute bij alleen tekstwijziging; wel bij GPS-, world/field- of netlogicawijziging |
| BB-60 | S01,S04,S12,S18 | **Native Android GPS-kaart** · P0 | WebView-bridges kandidaat | **SIM-GROEN 5/5**, **NATIVE-OPEN**: `../../bugbaas-native-field-browser/checks.json` | Onbekend | ADB unauthorized/Gradle loopback verhelpen zonder veiligheid te versoepelen; APK op echt toestel + GPS-/GPU-/accutest |
| BB-70 | S03,S15,S17 | **Live insectenposten & BugRoutes** · P0 | Server + webflow gebouwd | **SIM-GROEN 5/5**: `../../bugbaas-sites-browser/checks.json`, `tests/worldSitesV2.test.ts`; **LIVE-OPEN** | Onbekend | Betrouwbare toegestane POI/routebron, veilig openbare punten/paden, echte buitenloop zonder neplocaties |
| BB-80 | S16 | Nesten / raids · P3 | NIET-GEBOUWD | NIET-GETEST | — | Apart FO/TO/task pas na stabiele basis; niet in huidig releasemoment suggereren als klaar |
| BB-90 | alle | **Cloudrestore + productie-gate** · P0 | Lokale herstelproef gedaan | **LOCAL-GROEN**: `../.local/docs-local-restore.json` (600 records); **CLOUD/NATIVE-OPEN** | Onbekend | Firestore-restore in veilige testomgeving, privacy/licenties, echte Android-/GPS-proef; expliciete eigenaar-go/no-go |

`HIST-GROEN` betekent **niet** dat ieder testresultaat vandaag nog op de allerlaatste bron staat. Het volledige 183/183-log dateert van 10:33; enkele UI-bronnen zijn later om 10:42 aangepast en de browser is om 10:45 opnieuw vastgelegd. Zonder Git SHA en dekking per test mag je geen universele actuele PASS afleiden. De browsercheck hoeft niet opnieuw zolang de relevante UI-scope en browseromgeving onveranderd zijn.

## Werkverdeling en controle (nieuwe taken)
| Rol | Verantwoordelijkheid | Verplichte vastlegging |
|---|---|---|
| **Opdrachtgever / projecteigenaar** | Prioriteiten, gewenste schermen, artkeuzes, finale acceptatie, productie-go | Naam/rol en expliciete akkoordstatus; nooit namens hen invullen |
| **Bouwer** (mens of AI-agent) | Eén zelfstandig workitem implementeren | Eigen naam/agent-ID, tool/model indien bekend, branch, begin-/eindcommit, gewijzigde bestanden |
| **Tester** (mens, CI of browseragent) | Per risico alleen toepasselijke tests uitvoeren | Tester/runner, testcommando, inputversie, datum, PASS/FAIL/BLOCKED, output/screenshot |
| **Reviewer** (voor hoog risico apart van bouwer) | Acceptatiecriteria, codewijziging, veiligheid, datamigratie controleren | Naam/actor, akkoord of opmerkingen, te controleren commit |
| **Releaseverantwoordelijke** | Restore-, privacy-, GPS-/native- en cloudchecks; vrijgeven | Release SHA en afzonderlijke productie-toestemming |

**Regels:** dezelfde AI-agent mag code schrijven en automatische tests draaien, maar dat is **geen onafhankelijke review**. Zonder identiteit blijft `onbekend`; zonder bewijs `niet getest`. Geen schijnbewijs toevoegen.

## Eén workitem, één eigenaar en één toetsbare oplevering
Maak voor elke toekomstige wijziging hieronder een record (of een nieuw workitem in dit register). **Begin NIET** met opnieuw testen van groene niet-geraakte schermen.

```md
### BB-XX — [klein, zelfstandig resultaat]
FO: Sxx | TO: §x | Prioriteit: P0/P1/P2 | Afhankelijk van: BB-...
Bouwstatus: TODO / IN_UITVOERING / KLAAR
Teststatus: NIET_GETEST / HIST-GROEN / ACTUEEL-GROEN / SIM-GROEN / STALE / GEBLOKKEERD
Bouwer: [mens/agent, tool/model indien bekend]
Tester: [CI/browser/mens, onafhankelijke reviewer ja/nee]
Reviewer/akkoord: [persoon, tijd of 'nog niet']
Startpunt: [project Git SHA (eigen repo) of expliciete baseline-fingerprint]
Wijzigingen: [exacte paden, nieuwe contracten, migraties, assets]
Gekozen tests: [test-ID + command + waarom]
Niet herhaalde tests: [test-ID + vorige bewijs-run + onveranderde afhankelijke bestanden]
Bewijs: [run-ID, commit, timestamp, relevante logs/screenshots]
Risico/open: [wat is NIET getest en waarom]
Volgende stap: [één concrete actie, verantwoordelijke]
```

## Eén nieuwe testuitvoering
Elke nieuwe bewijs-run bevat precies:
```json
{
  "runId": "QA-20261020-voorbeeld",
  "taskId": "BB-XX",
  "testId": "DEX-BROWSER",
  "result": "PASS",
  "actor": "naam of agent-ID",
  "actorType": "human|agent|ci",
  "revision": "git-sha-of-input-fingerprint",
  "testRevision": "git-sha-of-testdefinitie",
  "environment": "Chromium/version, 390x844, QA-server",
  "startedAt": "ISO-8601-timestamp",
  "evidencePath": "relatief pad naar log/screenshot",
  "scope": ["src/GoCollectionV2.tsx", "game/goV2.ts"],
  "provenance": "direct-run"
}
```
Voor hergebruik: schrijf een *nieuw* `SKIP-GEREGISTREERD` besluit met `previousRunId`, impactanalyse en reden. **Kopieer geen PASS-output alsof de test opnieuw gedraaid is.**

## Wat eerst oppakken
1. **BB-00 + BB-01:** project-eigen git en eenvoudige automatische bewijsregistratie; blokkeren geen handmatige checks maar voorkomen toekomstige test/author-chaos.
2. **BB-60:** Android lokaal uitvoerbaar krijgen. Browserbrug blijft voorlopig simulatiebewijs.
3. **BB-70:** echte, legale, veilige POI/routebron en buitentest. Provider-rate limits niet omzeilen.
4. **BB-90:** verifieerbare cloudrestore en releasecheck. Nog geen productie.
5. **BB-80:** optioneel later; geen current-scope blocker.

Zie [selectieve testmatrix](POGO_TESTMATRIX.md) en [uitvoerbaar implementatieplan](superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md). Bestaand historisch [testverslag](POGO_UITVOERING.md).
