# Arcade-service — technisch bewijs, 3 november 2026

Geïmplementeerd in `server/arcadeServiceV3.ts`, de gerichte commandkoppelingen in `server/goServiceV2.ts` en additieve types in `game/typesV2.ts`/`game/arcade/tapDuel.ts`.

- Eén opgeslagen volgende game: introductie Tikduel → Nestwacht → Bubbelzwerm, daarna gewichten25/25/15/15/10/5/5 met de laatste twee geldige games uitgesloten. Alleen een geldige, serverbevestigde ronde schuift eenmaal door. Stop, lege invoer, heropenen en dagwisseling rollen de kandidaat niet opnieuw. Historische Tikduel-spelers behouden hun totals/records/receipts en krijgen Nestwacht als volgende introductie.
- Tickets leggen game, regels, seed, klasse, eigen stats en het eerdere scoredoel vast. Oude tickets zonder game blijven `tap-1`; bestaande acceptatie- en verloopregels blijven gelden. Aanvaarding bewaart één receipt plus SHA-256-invoerdigest, invoeraantal, eindreden en snapshot-hash. Geen groeiende invoerlog in het account.
- Scores vergelijken game/seed/regels/klasse binnen dezelfde challenge. Maximaal10 zichtbare rijen; echte eerdere speler, eigen record en computerdoel hebben verschillende labels. Geen Arcade-Elo-mutaties.
- Eén dagbudget: eerste drie geldige rondes75stof/20XP, eerste+100stof, echte spelersscore verslaan+25; maximaal400stof/60XP. Latere geldige rondes tellen wel voor lifetime completion en per-game3/10/30-medailles.
- Vijf verschillende ontvangstdagen in een maandag–zondag-UTC-week geven één afzonderlijke weekreceipt:500stof plus5nectar voor de familie van een werkelijk aanwezig buddy-exemplaar. Zonder echte buddy is de nectar0. Herhaling van ticket/commando kan de reward niet opnieuw geven; een gemiste dag wist geen lifetime voortgang.
- Naar de client: `arcadeNext`, begrensde `arcadeScores`, `arcadeProgress`; receipts hebben optionele feedback, nieuw behaalde medailles en afzonderlijke `weekly`. `receipt.dust` blijft de dagreward; `receipt.weekly.dust` is daar aanvullend op.
- AF-01 bijgewerkt4 november naar het latere gebruikersbesluit: `WALK_CATCH` bepaalt beide afstandsroutes.5 bugs/km normaal,10/km bij workouttempo, maximaal 120/dag; gratis zonder netverbruik. Een verse bruikbare GPS-fix blijft vereist. De legacy `AWAY_STEP`/`AWAY_PER_DAY` exports verwijzen nu naar 200/120, zodat exact200meter tegoed niet op de oude 250 meter-poort blijft steken.20 gerichte AFK-/achtergrondtests groen.

Gerichte verificatie: `npx tsx --test tests/arcadeV3.test.ts tests/arcadeProgressV3.test.ts` — **18/18 groen**; `npm run typecheck` — **groen**. Dit omvat echte SQLite-servicecommando's voor eerste introducties, Stop/heropenen, dagwisseling, dubbele aanvaarding, reeds bestaande stale-revision-/snapshotgevallen en een eerdere echte spelersscore. Aanvullend directe serverregeltests voor weekreward, medailledrempels, exacte scorecontractfilters, audit en verlopen/te grote logs. De oudere Tikduel-rewardtests houden hun fixture bewust op Tikduel; selectie heeft afzonderlijke dekking.

Geen browser-/APK-, productie-/Firestore- of nieuwe AF-01-toestelclaim vanuit deze servicecheck. Visuele/native integratie en AF-01-integratietests liggen bij de integrator; `progress.json` is niet door deze agent gewijzigd.

## Echo: echte opgeslagen stats met versiegrens

`game/echoArenaV2.ts`: nieuwe saves krijgen `policy:'owned-1'` en bewaren echte levels, IV, moves, items, CP en afgeleide stats van de eigen drie bugs binnen de gekozen CP-klasse. Werkelijke groei verandert de volgende snapshot; bestaande snapshots en eigenaar worden niet door een duel gewijzigd. Ongeldige afwijkingen tussen opgeslagen stats en de bijbehorende build worden geweigerd.

Nieuwe matchmaking kiest alleen `owned-1`-spelerteams of een expliciet gelabelde NPC. Een ontbrekende policy blijft oude genormaliseerde data: die records worden bewaard tot een natuurlijke ownersave, zonder oude levels/IV te raden. Een expliciet opgebouwde legacywedstrijd behoudt `flow:2`, `policy:'normalized-1'` en `normalized:true`; nieuwe echte-statwedstrijden hebben `normalized:false`. Reeds opgeslagen actieve wedstrijden worden niet opnieuw opgebouwd of gepromoveerd. De bestaande genormaliseerde helpers voor Dagstrijd zijn behouden.

Nieuwe helper `echoTeamIssue` is aan de integrator doorgegeven voor de automatische server-saveguard en aan de UI-agent voor teamvalidatie/CP-presentatie. Dag-/paarlimieten, afzonderlijke Echo-rating, NPC-ratinguitsluiting en eenmalige settlement zijn ongewijzigd.

Gerichte UI-koppeling in `src/GoEchoArenaV2.tsx`: werkelijke CP via `fighterGo`, teamvalidatie via `echoTeamIssue`, hulp over behouden levels/IV/items binnen CP-klassen en zichtbare versieaanduiding voor oude opgeslagen duels/verdedigingen. Bestaande compositie en navigatie zijn behouden. De integrator voert de browsercheck uit.

Verificatie: `npx tsx --test tests/echoArenaV2.test.ts tests/dailyChallengeV2.test.ts` — **21/21 groen** (13 Echo,8 Dagstrijd). Echte stats/snapshotonafhankelijkheid, CP-weigering, items/IV/level-fingerprint, legacyuitsluiting/flowbehoud, rewards en anti-farm gecontroleerd. Geen nieuwe visuele/native-claim uit deze modulecheck.
