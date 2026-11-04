# Technische overdracht — actueel 4 november 2026

Nieuwe Arcade-rondes gebruiken `${game}-2`, de oorspronkelijke ports onder `game/arcade/original/`, met gedeelde 20 ms-simulator en de bestaande `src/arcade/original/OriginalArcadeFieldV3.tsx`. Oude tickets behouden hun v1-replay. Scene-presentatie staat klaar voor Claude; klok, inputlog, servercontrole en stat-/rewardberekening blijven bij Codex/Sol.

- **Navigatie:** gezamenlijke Kaart/Arcade/Bugs/Strijd-shell; behouden tabstate, active/back-guards en native kaartfocus/inset ingebouwd. Geen tweede shell of losse Arcade-app maken.
- **Modi:** `arcadeStart` rouleert; `arcadePracticeStart` kiest expliciet een game zonder resources/medailles/rating; `arcadeRankedStart` kiest een willekeurig scoreduel met echte speler, identieke seed/game/regels/CP-klasse. Geen aanwezigheid nodig; beide Elo’s pas bij uitslag.25 starts/dag, 15 min herhaalbeperking, 48 h eerdere score geldig, verlopen claims bij terugkomst afgehandeld.
- **Invoer:** nieuwe replay maximaal10000 events / 1 MiB; alleen `arcadeSubmit` met `format:'original-2'` mag de oude 64 KiB-envelope overschrijden. Gewone acties houden 8 KiB. Submit accepteert geen clientscore of door de client bepaalde beloning. Lokale pendinglogs blijven perUID bewaard.
- **Progressie:** eerste 3 geldige rondes samen maximaal 400 stof / 60 XP; eerste ronde extra 100 stof, echte menselijke scorewinst maximaal 25 extra per beloonbare ronde. Weekreceipt 500 stof / 5 nectar van werkelijk aanwezige buddyfamilie na 5 verschillende dagen; geen tweede claim. Medailles 3/10/30. Bendes eigen beloning/budget. Alle uitbetalingen idempotent.
- **Opslag:** bestaande accounts/collectie/IDs behouden. Additieve ArcadeRuns/Scores/Duels/Ranks in dezelfde store; cloudindex voor `v2ArcadeDuels` staat in `firestore.indexes.json`, nog niet live uitgerold.
- **Bewijs:**673 tests, TypeScript en webexport groen; browserdetails en beperkingen in `tester.md`. Nog geen nieuwe APK/livecloud- of fysiekeGPS-proef. Animatie/VFX/audio en native 3D zijn geen bewezen complete levering.

---

## Historische prototypebeschrijving — 3 november

Het onderstaande beschrijft uitsluitend de eerste v1-Tikduelkring. Gebruik dit niet als actuele bouwopdracht of status van de zeven originele games.

# Techniek: bestaande kring, grens en eerstvolgende uitvoering

Peildatum: 3 november 2026. Dit onderdeel sluit aan op B02/B03/B04/B09 uit het creatorpakket. Het beschrijft lokale code en gerichte controles; geen releasebesluit.

## Wat daadwerkelijk bestaat

De eerste kring is **Arcade openen → eigen team → Speel → 3–2–1 → Tikduel → serveruitslag → volgende ronde/kaart**. De andere zes spellen, gewogen dagrotatie, nieuwe actieduelregels, vrienduitdagingen, scoreboek en medailleboek zijn hiermee niet gebouwd.

| Onderdeel | Huidige uitvoering en bewijs |
|---|---|
| Regels | `game/arcade/tapDuel.ts`: 50 logische ticks/s, 45 seconden, veld 360×640, vaste gehele doelposities, maximaal vier doelen; minimum 100 ms tussen inputs en maximaal 450 inputs. Geen netwerkverzoek per tik. |
| Eigen squad | Server leest 1–3 eigen verschillende soorten, CP-klasse en gymuitsluiting. `stats()` neemt echte level/IV/held-itembonussen mee; ticket bewaart berekende aanval/verdediging/HP, snelle move, soort/types/shiny/CP. Eigen exemplaren verliezen geen HP. |
| Snapshot | Een latere wijziging van een collectie-exemplaar verandert het uitgegeven ticket niet. Het ticket bevat nog geen afzonderlijke level/IV/itemvelden, snapshotHash of contentHash. Dat is ontbrekende auditmetadata, geen clientbron voor stats. |
| Replay | Dezelfde regels draaien lokaal en bij `arcadeSubmit`. Clientscore beslist niets. Bounds, tickvolgorde, invoertempo, eigendom, actieve run, verloopdatum en minimale echte verstreken tijd worden gecontroleerd. Een offline invoerlog bewijst geen menselijke bediening. |
| Aanvaarding | Ticket, speler, score-entry en commandreceipt zitten in dezelfde bestaande storetransactie. Run-ID voorkomt dubbele beloning, ook bij een nieuw command-ID voor een reeds geaccepteerde run. |
| Revisies | Alleen submit mag een oudere of gelijke `expectedRevision` gebruiken; een toekomstige revisie blijft ongeldig. Start/abandon houden de bestaande revisiecontrole. De opslagtransactie leest de actuele speler voordat budget en beloning worden toegepast. |
| API-omvang | Alleen `/api/game/v2/command` kan maximaal 65.536 bytes ontvangen. Na JSON-parsing blijft 8.192 bytes de grens voor alle typen behalve `arcadeSubmit`. Een volledige Tikduel-log past binnen de grotere envelop. Andere API-routes houden 8.192 bytes. |
| Opslag | Bestaande `v2Players` plus additieve `v2ArcadeRuns:<uid>-<run>` en `v2ArcadeScores:<sha256(challenge:uid)>`. Firestore gebruikt de bestaande payloadcodec; SQLite gebruikt de bestaande generieke records-tabel. Geen nieuwe database, reset of wijziging van account-/specimen-ID's. De bestandsnaam V3 verandert `schemaVersion:2` niet. |
| Asynchroon doel | Een servergevonden eerdere score van exact dezelfde UTC-dag/klasse/regels, anders eigen record, anders Veldwachter als computerdoel. Doelscore staat vast in het ticket. De query bekijkt maximaal 50 resultaten; dit is geen volledige wereldranglijst of vriendenfilter. |
| Rewards | Eerste drie geldige rondes per UTC-dag: 75 stof en 20 XP per ronde; eerste geldige ronde +100 stof; winst op een eerdere menselijke score +25 stof. Dagplafonds 400 stof/60 XP. Vierde geldige ronde telt wel voor completion/record. Ongeldig/afgebroken geeft geen reward. |
| Geldig afronden | Simulator minstens 400 ticks, score boven nul, minstens drie verschillende invoercoördinaten en invoerspan minstens 100 ticks. Dit is de huidige kwalificatie; het is geen bewijs dat iedere tik raak was. |
| Herstel | Afgeronde invoerlog wordt lokaal onder een UID-gebonden sleutel bewaard. De bestaande commandlaag bewaart een onzekere command met dezelfde command-ID; resultaatknop kan dezelfde run opnieuw indienen. Ontvangst binnen 24 uur na uitgifte. Een onafgemaakte run wordt bij een volgende start expliciet opgegeven, niet stil hervat. |

## Gerichte correcties in deze overdracht

Deze wijzigingen zijn beperkt tot de eerste kring; score-, schade- en rewardregels blijven gelijk.

1. Effectevents bewaren hun werkelijke logische impactpositie. De renderer hoeft na verdwijnen van een doel geen `born=id*90` te reconstrueren. Onder het huidige spawnritme viel die terugval doorgaans samen; de fix maakt het event ook bij een ander werkelijk spawnmoment correct.
2. Schietlijnen beginnen bij de werkelijke squadverdeling. Eén bug: x180; twee bugs: x90/x270; drie bugs: x60/x180/x300. Voorheen gebruikte de lijn altijd de drie vaste posities.
3. Elke startpoging heeft een token en controleert actief scherm/app na asynchrone asset- en opslagstappen. Achtergrond tijdens voorbereiden/wachten/aftellen/spelen trekt de poging in. Een later terugkomend ticket kan daardoor geen nieuwe aftelling starten; abandon wordt na de centrale command-lock verwerkt.
4. Zichtbare terugknop, native Modal-back en Escape lopen door dezelfde stopcallback. Tijdens een ronde gaat die terug naar Arcade-home en geeft de ronde op; daarna kan de speler naar de kaart. Een opgeslagen eindresultaat blijft UID-gebonden. Een later afgeronde opslagcallback stuurt na sluiten geen submit onder een ander account.

Gewijzigde bestanden voor deze correcties: `game/arcade/tapDuel.ts`, `src/arcade/ArcadeFieldV3.tsx`, `src/arcade/ArcadeScreenV3.tsx`, kleine integratie in `src/GameV2.tsx`, één regressie in `tests/arcadeV3.test.ts`.

## Bewijs en open grenzen

- In deze technische ronde opnieuw uitgevoerd: `npx tsx --test tests/arcadeV3.test.ts` **7/7 groen**, inclusief werkelijke impactpositie na een defeat en latere tick; `npm run typecheck` groen na de lifecycle-integratie.
- De zes eerdere tests bewijzen replaygelijkheid bij anders gegroepeerde ticks, basisvalidatie, oude revisie bij submit, eenmalige rewards, drie-dagbudget en eigenaarsafwijzing. De testnaam met “earlier human score” gebruikt feitelijk één speler en controleert een eigen record; een echte tweede speler en diens +25 bonus zijn nog niet door die test bewezen. De testnaam met IV/item bevat geen afzonderlijke boost-aan/uitvergelijking.
- De bestaande lokale in-memory browserproef op `127.0.0.1:3773` leverde een ronde met score10,175stof en20XP zonder consolefouten. Dat is bewijs van de eerste kring vóór bovenstaande laatste UI-correcties. Finale browsercontrole na één nieuwe build wordt door de integrator geregistreerd; deze tekst claimt die uitkomst niet vooraf.
- Geen actuele native telefoonproef, echte achtergrond-/force-stopproef, grote-tekst-/landscapeproef of lage-GPU-meting voor dit nieuwe veld. Webexport of een geslaagde unitreplay vervangt dit bewijs niet.
- Verloren ACK heeft een idempotente serverroute en bestaande clientopslag; een werkelijk afgebroken HTTP-response plus herstart is hier niet opnieuw end-to-end bewezen. Afgewezen/verlopen opgeslagen uitslagen hebben nog geen afzonderlijke “Oefenen”-route.
- Geaccepteerde runrecords bewaren ticket en receipt, maar nog geen begrensde replay/inputDigest/completionReason voor latere audit. Niet doen alsof dat al bestaat.
- `completed` is één blijvende teller. De tekst “Medailles” maakt daar nog geen zeven bronzen/zilveren/gouden emblemen van. Weekstempels en weekclaim ontbreken.
- Het huidige pad is integer/hash-gebaseerd en deterministisch. De gedeelde xorshift-/actieadapter uit B02 bestaat nog niet. Er zijn alleen tikinputs, nog geen swipe/hold/net/keyboard-contracten voor de volgende spellen.
- De renderer werkt lokaal op maximaal30fps en HUD10Hz. Hij tekent met React-state per frame; de ambitie van de definitieve renderer zonder volledige React-rerender per frame is nog niet uitgevoerd of op een telefoon bewezen. Visuele animatie mag de logische tick of collisionpositie nooit terugschrijven.

## Eigenaarschap bij de volgende blokken

**Sol6.1, redeneerniveau zeer hoog:** deterministische spelregels, inputvalidatie, tickets/replay, transacties, budgetten, versiecompatibiliteit en gerichte integratie. **Claude Opus5.5:** 3D/animaties, beeldmateriaal, clips, materialen en presentatie. Codex' previews/TO/FO blijven het gezamenlijke contract.

Tijdens een technisch blok heeft Sol alleen de expliciet hieronder genoemde bestanden. Claude verandert die bestanden dan niet. Claude's bestaande `assets/3d/**`, `public/models/**`, portret-/type-/propbestanden, render-/materialscripts en gedeelde `src/PogoUiV2.tsx` blijven buiten de Sol-taak. `src/GameV2.tsx`, `game/typesV2.ts` en `server/goServiceV2.ts` zijn gedeelde integratiepunten: één integrator maakt uitsluitend de noodzakelijke regels na de afgesproken overdracht. Geen twee schrijvers aan hetzelfde bestand en geen volledig bestand terugzetten uit Git.

### SOL-T1 — eerste kring en ontvangstherstel afbakenen

**Resultaat:** dezelfde geldige run levert na weggevallen ontvangstbevestiging precies één receipt/reward; bekende ontbrekende contracttakken hebben concrete dekking.

**Bestanden:** `tests/arcadeV3.test.ts`, een bestaande gerichte HTTP-test en alleen bij een aangetoonde fout `server/arcadeServiceV3.ts`/`server/http.ts`. `src/GameV2.tsx` uitsluitend als de bestaande retry daadwerkelijk de oorzaak blijkt.

**Werk:** vul de gerichte bestaande tests aan met twee synthetische spelers op dezelfde challenge, mens-winbonus, UTC-daggrens, verlopen/verkeerde regelversie en gewijzigd collectie-exemplaar na ticketuitgifte. Simuleer een gecommitteerde submit waarvan de response wegvalt; herhaal de bewaarde command en vervolgens de run-ID. Gebruik de huidige lokale store/API, geen live accounts. Bewaar de 8KiB/64KiB-grens per type.

**Klaar:** actuele balances, completion en best-score één keer veranderd; identieke receipt; vreemde owner/toekomstige revisie afgewezen; legacy actie boven8KiB afgewezen. Bestaande gerichte tests en typecheck, plus één herstelproef in het gewijzigde scherm. Geen nieuw testplatform.

### SOL-T2 — klein versiecontract vóór spel twee

**Resultaat:** Tikduel blijft afspeelbaar terwijl een volgende simulator kan worden toegevoegd; één run heeft één vast spel en rewardcontract.

**Bestanden:** `game/arcade/tapDuel.ts`, één klein gedeeld type/dispatchbestand onder `game/arcade/`, `server/arcadeServiceV3.ts`; integrator past zo nodig `server/goServiceV2.ts`/`game/typesV2.ts` gericht aan. Geen renderer-/assetwijzigingen.

**Werk:** voeg additief game-ID/regelversie en begrensde auditvelden toe; ontbrekend game-ID op oude tickets betekent bestaand Tikduel. Bewaar de overeengekomen invoerlog/digest en completionReason in het runrecord, geen groeiende log in de speler. Laat uitgegeven oude tickets gedurende hun bestaande24uur via hun eigen replayregels eindigen. Nieuwe scorevergelijking gebruikt het volledige challengecontract. De bestaande v2-stores en sleutels blijven behouden; geen extra database/migratie. Bouw alleen de dispatch die de twee concrete spellen nodig hebben.

**Klaar:** een oud Tikduel-ticket behoudt score/reward en maximale ontvangstdatum; nieuwe input van het verkeerde spel wordt afgewezen; aanvaarding en replay-opslag blijven atomair. Gerichte bestaande tests/typecheck.

### SOL-T3 — Nestwachtregels; Claude doet de beweging

**Resultaat:** tweede complete kring volgens B05: drie banen, drie nestharten, eigen snelle moves/types en vaste ticks. Geen winkel of nieuw squadstatmodel.

**Bestanden Sol:** nieuwe `game/arcade/nestGuard.ts`, relevante dispatch en een gerichte simulatietest. **Bestanden Claude:** nieuw presentatiebestand voor Nestwacht en benodigde animatie-/assetbestanden; bestaande Tikduel-presentatie wordt niet tegelijk bewerkt. Integrator verbindt de kandidaat met de huidige Speel-ingang.

**Grens:** Sol levert inputacties, entity-ID's en events met logische posities/ticks; Claude leest die events voor uitval, hit, trails en nestschade. Animatieafronding bepaalt nooit schade, punten of sterfte. Echte CP/stats blijven via server-squad gelden.

**Klaar:** dezelfde seed en inputs geven op beide rendergroeperingen en server dezelfde harten/score; verlies/einde/inputgrenzen gecontroleerd; één echte lokale ronde en receipt. Pas daarna volgende spel.

### SOL-T4 — rotatie en completion wanneer er twee spellen zijn

**Resultaat:** één Speel kiest een bij het account vastgelegde volgende kandidaat, heropenen rolt die niet opnieuw; per spel blijvende3/10/30completion met één rewardbudget.

**Bestanden:** de Arcade-service/types en één kleine rotatiemodule; integrator verbindt `arcadeNext`/home alleen waar nodig. Claude ontvangt de zichtbare kandidaat en voortgang voor de hub/medaillepresentatie. Nog niet beschikbare spellen worden niet aangeboden.

**Werk:** behoud alle bestaande `completed`/best/receipts en voeg per-spelvelden additief toe. Vanaf de eerste beschikbare spellen de afgesproken introductie/rotatieregels toepassen; alleen werkelijk beschikbare variatie aanbieden. Spellenboek, vrienden en Plaagbende pas toevoegen in hun eigen B09/B11-blok; ze mogen geen tweede Arcade-dagbudget of stille seedreroll creëren.

**Klaar:** heropenen geeft dezelfde kandidaat; een geldige afronding schuift eenmaal door; stoppen houdt dezelfde kandidaat om rerollen te voorkomen; dubbel submit geeft geen extra completion; nieuwe UTC-dag wist geen lifetime-medaille. Gerichte tests/typecheck en één hubcontrole.

### Afzonderlijk B10 — nieuwe combat is geen uitbreiding van Tikduel

Sol krijgt pas een afgebakend combatblok met eigen capability/rulesVersion, echte-stat-snapshots, richtbonus, charge/ontwijken en eerlijke tegenstanderklok. Claude bouwt de visuele combat-HUD/animaties uit het overeengekomen eventcontract. Bestaande live gevechten, oude Echo-verdedigingen, Elo, historie en reeds uitgegeven tickets blijven via hun opgeslagen versie werken. Oude genormaliseerde Echo wordt niet als nieuwe echte-statstrijd gepresenteerd. De eerste Arcade-kring is geen bewijs dat B10 al is uitgevoerd.
