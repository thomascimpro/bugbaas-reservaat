# CR-01 — vaste bende-uitdagingen

3 november 2026. Technische kring aangesloten: bestaande echte post/balon → servervastgelegde ontmoeting → eigen squad → lokaal Arcade-spel → serverreplay → één bevestigde rescue. Geen locatiebron of verzonnen post toegevoegd.

`game/arcade/crew.ts` bewaart `crew-1`-metadata bij de eerste serververschijning: Baretbende/Olijfgarde, vaste gewogen game/leider, trainerlevel-tier, doelscore, basisvorm, shiny-rol 1/512 en afloop. Heropenen, verliezen of sterker maken verandert die metadata niet. `plaagTarget` is de bestaande post-/afstand-/ballonautoriteit, nu ook hergebruikt voor `plaagArcadeStart(target, ids, league)`.

Het ticket bevat een onveranderlijke crew-context; submit accepteert alleen run-ID en invoer. De lokale simulator en serverreplay eindigen direct bij de doelscore (`target_score`). Nieuwe leiders gebruiken de bestaande `plaagFight`-route, vaste CP-doelen 450/900/1400, twee spelerontwijkingen en één voor de leider. Oude opgeslagen Plaag-gevechten zonder crew-context blijven via hun oude settlement werken.

Eerste winst van een ontmoeting geeft exact 250 stof, 100 XP, één level-10-rescue met gratis IV-rol en drie familie-nectar. Geen vangststof, extra vangst-XP, itemroll of netverbruik. Maximaal drie materiaalbeloonde crew-wins per UTC-dag; daarna expliciet oefenen. Dubbele submits en andere tickets voor dezelfde ontmoeting betalen niet opnieuw. Crew verandert geen Arcade-dagbudget, rotatie, medailles, weekstempel of records.

`PlaagbendeV2` toont voor gewone ontmoetingen één vast spel/doel, eigen squad en Speel. `ArcadeScreenV3` neemt alleen het door de server uitgegeven crew-ticket over, laadt beelden, telt af en bewaart een afgeronde invoerlog met retrycontext bij een onzekere bevestiging. Verlies biedt dezelfde ontmoeting opnieuw. Bestaande achtergrond-/Stop-/late-startguards blijven actief. De door browsercontrole gevonden ImageBackground-overflow is begrensd met expliciete afbeeldingsafmetingen en een verborgen overflow. De gewone Arcade-lobby toont de daadwerkelijk berekende squadhulp en Info licht de effecten toe.

**Bewijs:** 40/40 gerichte tests groen (`crewArcadeV3`, `arcadeV3`, `arcadeGamesV3`, `arcadeProgressV3`, `plaagbendeV2`). Inclusief een echte lokale doelrun met identieke serverreplay, te vroege submit geweigerd, exact één reward/rescue, herhaalde ontvangst, verlies/herkans-seed, vierde winst oefenen, vaste bron/afstand, nieuw leidercontract en oud opgeslagen rewardcontract. Eigen bestanden hebben geen TypeScriptfout; de laatste gezamenlijke controle meldde uitsluitend twee parallel veranderende combat-narrowingfouten in `goBattleV2.ts:130/146`.

**Grens:** geïntegreerde browserbediening/resultaatbevestiging en native telefooncontrole liggen bij de hoofdtaak. De kaart/sheet hergebruikt het bestaande Baret-groepsbeeld; afzonderlijke Olijfgarde-/leiderportretten en nieuwe animatiepolish zijn niet in deze technische taak geïmporteerd. Er is geen release uitgevoerd.
