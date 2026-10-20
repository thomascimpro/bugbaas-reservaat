# BugBaas Reservaat — verplichte projectinstructies (AGENTS.md)

**Lees dit bestand bij iedere nieuwe chat/sessie die aan deze BugBaas-projectmap werkt.** Dit bestand is de vaste startinstructie voor Devspace/Codex-agenten; het actuele werkgeheugen staat in `docs/POGO_WERKREGISTER.md`. Geen voortgang uitsluitend in chatgeheugen bewaren.

## 0. Project en werkgrenzen
- Dit is **BugBaas Reservaat (PoGo-variant)**: een Expo / React Native / Web spel met 3D-bugs, kaart, Bugdex en PvP.
- Werk alleen in deze projectmap. De bovenliggende Git-root is/was **`C:/Users/thoma.THOMAS`**; gebruik die NOOIT voor `git add`, commits, branch-creatie of `git clean` van BugBaas.
- **Maak geen nieuwe Git-werkboom vanuit de bovenliggende thuis-repository**. Eerst een zelfstandige Git-repository in deze projectmap verifiëren.
- Bestaande spelcode, opgeslagen specimens, IV/shiny, voortgang, vrienden, Elo, itemvoorraad en oude gebruikersgegevens behouden. Geen reset en geen productierelease zonder afzonderlijke toestemming.
- Alle code/QA vindt plaats op een afgebakende projectcheckout en expliciete QA-data. Geen tokens, sleutels, precieze woonlocaties of QA-databases committen.

## 1. LEES EERST: bronnen van waarheid, op volgorde
1. **`AGENTS.md`** (dit bestand): verplichte werkwijze, geen dubbele uitvoering.
2. **`docs/POGO_WERKREGISTER.md`**: **ENIGE ACTUELE BRON** voor BB-werkpakket, bouwer, teststatus, blockers, eerstvolgende actie en bewijs; check eerst de bovenste sectie `ACTUELE CHECKPOINT`.
3. **`docs/superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md`**: concreet 9-task implementatieplan. Volg uitsluitend de huidige, nog open stap. Niet automatisch alle negen taken uitvoeren omdat ze in het plan staan.
4. **`docs/POGO_TESTMATRIX.md`**: kies gerichte tests en geldig te hergebruiken bewijs; geen herhaling zonder impact.
5. **`docs/POGO_UITVOERING.md`**: historische implementatie/testlogs van 20 oktober. Bewijs lezen, geen oude stappen opnieuw uitvoeren.
6. **`docs/POGO_FO_20261019.md`, `docs/POGO_TO_ASSETS_20261019.md`, `docs/POGO_VISUELE_AUDIT_20261019.md`**: eisen en ontwerp; oorspronkelijke FO/TO zijn deels al gebouwd. Behandel ze NIET als lege todo-lijst.

## 2. Beginprotocol voor ELKE BugBaas-chat
1. Open **de juiste** Devspace projectmap; lees deze `AGENTS.md` en vervolgens `docs/POGO_WERKREGISTER.md` (ook wanneer een workspace-ID al bestaat).
2. Zoek het relevante `BB-xx`-ticket en lees `ACTUELE CHECKPOINT`. Controleer of het gevraagde werk niet al **afgerond / getest / geblokkeerd** is. Bekijk dan de concrete bron of bestaande bewijspaden in plaats van opnieuw te beginnen.
3. Hervat vanaf de **eerste open afvinkstap**. Als de blocker ongewijzigd is, herhaal de mislukte stap niet onbeperkt: maximaal één voorzichtige nieuwe poging bij een aantoonbaar veranderde conditie, anders status `GEBLOKKEERD` handhaven en dit concreet melden.
4. Registreer vóór edits `BB-ID`, maker (mens of AI/model waar bekend), scope, basiscommit of expliciet `nog geen Git SHA`, en de gekozen testimpact. **Bestaande makers uit het verleden = onbekend**; geen auteurschap raden.
5. Pas het kleinste nodige aan; geen onverwachte refactors, duplicaten van al werkende features of massale test-sweeps.
6. Test alleen relevante delen volgens `POGO_TESTMATRIX.md`. Een historisch PASS zonder versie-bewijs is `HIST-GROEN`, geen actuele universele PASS. Een oude test blijft geldig als relevante code, fixtures, afhankelijkheden en omgeving aantoonbaar ongewijzigd zijn; noteer dan `SKIP-GEREGISTREERD` met vorige run.
7. **Vóór beëindigen** werkregister bijwerken: gewijzigde bestanden, maker, datum, exacte test+uitkomst+bewijs, eventuele open blocker en **één eerstvolgende concrete stap**. Markeer niets als af zonder direct bewijs.
8. Bij nieuwe chat: herstel status uit **bestand + lokale Git-historie**, niet uit het geheugen of het oorspronkelijke FO. Geen herhaalde implementatie of QA-opname van afgeronde zaken.

## 3. ACTIEVE STAP BIJ INVOERING VAN DEZE INSTRUCTIES
**BB-00 / Task 1 — project-eigen Git-basis en auteurs-/testprovenance.**

- **Update 20 oktober 2026:** gebruiker heeft met Windows PowerShell **`git init -b main`** uitgevoerd binnen BugBaas. Devspace heeft daarna bevestigd dat de Git-root nu exact **de BugBaas-projectmap** is en branch `main` bestaat. **Niet opnieuw initialiseren. Er is nog GEEN eerste commit/SHA.** De eerdere root `C:/Users/thoma.THOMAS` was alleen de oude bovenliggende repo.
- Bestaande `.gitignore` sluit `.local/`, `node_modules/`, `dist/`, `android/`, `.env*` en sleutelformaten uit. Alle ontdekte SQLite-QA-bestanden zaten in `.local/` en worden dus niet gecommit.
- Er is een mogelijke **publieke Firebase client API-key** in `src/firebaseConfig.ts`; behandel die als projectconfiguratie, geen aanname dat dit een private service-accountkey is. Inspecteer rechten/config veilig voordat je een remote repo publiceert; toon de waarde niet in logs.
- **De Git-initialisatie is VOLTOOID, maar de eerste baselinecommit nog NIET.** De oudere `Devspace_home_tunnel` was offline, maar is niet nodig voor het al uitgevoerde `git init`: de gebruiker werkt rechtstreeks in PowerShell. De actieve Devspace Work2-verbinding is gezond. Niet meer debuggen/herinstalleren aan de tunnel zonder nieuwe aanwijzingen; poort `8088` is van de BugBaas-QA-server. `Devspace_work2__bash` is voor inspectie/tests/builds, **niet** Git-writes.
- **EERSTVOLGENDE ACTIE**: gebruiker staged uitsluitend projectbestanden vanuit de al bestaande Git-repo, controleert staged bestanden/ignore en maakt de **eerste lokale private baselinecommit**. Verifieer daarna `git rev-parse --show-toplevel`, `git ls-files` (geen `.local/`, `dist-android-v2/`, sleutels, SQLite of `node_modules/`) en `git rev-parse HEAD`; noteer de SHA in BB-00 en markeer voltooid. **Geen nieuwe `git init` en geen GitHub-push** zonder expliciete opdracht.
- Is `.git` inmiddels aanwezig? Controleer herkomst, status en eerste commit. **Niet opnieuw `git init` of een nieuw project starten** als BB-00 al is voltooid.
- **BB-01 (automatische testselectie) is de VOLGENDE taak, niet onderdeel van BB-00.** Niet implementeren op basis van dit startbestand zonder gebruikersverzoek.

De status hierboven is alleen een korte verwijzing naar het **actuele** werkregister. Als de twee verschillen, verifieer de echte projectstatus en corrigeer deze AGENTS-checkpoint; het werkregister is leidend.

## 4. Kwaliteits- en veiligheidsgates
- 183/183 historische functionele tests, 28 schermchecks en native/POI-browsersimulaties zijn eerdere bewijzen; ze kunnen oud zijn. Niet allemaal routinematig opnieuw testen. De goedkope unit/TS-suite bij integratie draaien wanneer toepasselijk.
- Web-simulatie is geen echte Android-GPS/wandeling. Geblokkeerd blijven: native fysieke proef, betrouwbare veilige live POI/routebron en Firestore/cloud-restore.
- Geen productiepublicatie, backup-restores op live data, private locaties delen, ADB-auth/Gradle-beveiliging omzeilen of betaalde diensten starten zonder toestemming.
- Gebruik exacte codepaden, scope, testcommando's en bewijs. Geen onbewezen `KLAAR`, `GETEST` of `RELEASED`.

## 5. Bij volgende sessie
Begin met: **`AGENTS.md` → `docs/POGO_WERKREGISTER.md` → huidige taak in plan**. Vat maximaal kort samen wat gedaan is en wat openstaat; pak de eerste open actie op. Dit voorkomt loops, dubbele werkpakketten en dure herhaalde browserchecks.
