## Actueel bewijs 4 november — originele ports

- 673/673 bestaande/gerichte tests groen; TypeScript exit0, webexport exit0. Logs `.local/arcade-v3-proof/original-complete-tests.log`, `original-final-typecheck.log`, `original-web-build.log`.
- Browser: alle zeven originele games gestart/bediend/gestopt; Tikduel echt uitgespeeld (score4,175stof,20XP); Nest bouwen/spray, Runner swipen/springen, Glide tikken, Tower drukken/loslaten, Bubble richten/schieten en Butterfly rondkijken/netslag. Geen consoleerrors. Alleen Tikduel volledig als browserronde uitgespeeld; overige volledige uitkomsten via gedeelde simulator/gerichte checks, niet zeven volledige handmatige browserruns.
- Spelen/Ranked/Spellen-Oefen/ranglijst en retourbediening bekeken. Home390×844 en320×568; geen horizontale overflow, hoofdknop62pxhoog op320. Bewijsbeelden `original-home-390.png`, `original-home-320.png`, `original-tap-action.png`, `original-nest-controls.png`, `original-{runner,glide,tower,bubble,butterfly,ranked}-390.png`.
- Echte twee-gebruiker servercommando’s: wachten→match→beide Elo’s, alleen winstbonus eenmaal, resourcecap400stof/60XP, oefenenzonderresources, late retry met behoud nieuwere collectie/actieve ronde. Expiry/forfeit/races apart bewezen. Oude v1-inputreplays blijven groen.
- Nog NIET bewezen: nieuwe APK/native sensoren, fysieke wandeling, live cloudindex/matchmaking, volledige visuele gelijkheid aan TO/FO. Geen nieuwe release gepubliceerd. Browser gebruikte alleen eigen tijdelijke testdatabase.

# Gerichte testercheck: eerste Arcadekring

3 november 2026. Sol6.1, zeer hoog. Alleen server/replay/rewardcontracten en de bestaande lifecyclegrens beoordeeld; geen brede appaudit.

**Uitkomst: geen nieuwe runtimefout aangetoond in de gecontroleerde takken.** Alleen `tests/arcadeV3.test.ts` en `tests/arcadeHttpV3.test.ts` aangepast. Spelregels/service, accounts, database, visuele bestanden en Claude's werk zijn niet gewijzigd.

## Uitgevoerde controle

`npx tsx --test tests/arcadeV3.test.ts tests/arcadeHttpV3.test.ts`: **11/11 groen**. `npm run typecheck`: **groen**.

| Gevraagde tak | Exact bewezen resultaat |
|---|---|
| Twee spelers, zelfde challenge | Een eerste synthetische speler slaat geldig score10 op. De tweede krijgt dezelfde challenge/seed en een echt bewaard spelersrecord als doel, geen NPC of geïnjecteerde score-entry. Bij een hogere replay-score: **200 stof = 75 basis +100 eerste geldige ronde +25 spelerswinst**,20XP; het saldo stijgt precies200. |
| Vast doel | De eerste speler verbetert zijn score terwijl de tweede run al is uitgegeven. Het tweede ticket blijft doel10 houden; submit gebruikt dat vastgelegde doel. |
| UTC-daggrens | Na drie geldige rondes: **325 stof/60XP**, drie beloonde rondes. Een ticket van23:59:50 wordt na middernacht aanvaard en ontvangt175stof/20XP uit het nieuwe dagbudget. Een volgende nieuwe-dagrun ontvangt75stof/20XP. Oude en nieuwe challengerecords blijven bestaan; lifetime completion groeit van3 naar5. |
| Verloren ACK | Een echte lokale HTTP-submit met meer dan8KiB input wordt gecommit. De test vernietigt de response-socket bij `res.end`, zodat de client een netwerkfout krijgt. Het runrecord is aantoonbaar `accepted` vóór de retry. |
| Zelfde command-ID opnieuw | Dezelfde opgeslagen command na verloren ACK retourneert dezelfde receipt. Een volgende identieke retry verandert stof/XP/completion niet opnieuw. |
| Zelfde run, nieuw command-ID | Daarna dezelfde run opnieuw indienen met een nieuw command-ID en lege inputs retourneert de bestaande receipt. Stof, trainer-XP, dailyXP20, rewarded1 en completed1 blijven gelijk. De al aanvaarde run wordt niet opnieuw beloond. |
| Stats veranderen na ticket | Echte `goPower` naar level10,5 en `goEquip(thorn)` verhogen actuele aanval na ticketuitgifte. Het opgeslagen squad blijft identiek aan de historische snapshot. Submit met de oudere revisie berekent dezelfde score als de oorspronkelijke replay, geeft175stof en bewaart de nieuwe collectielevel/item en reeds betaalde upgradekosten. |
| IV/item werkelijk relevant | De bestaande stattest vergelijkt nu ook expliciet IV0 tegenover IV15 en daarna hetzelfde exemplaar met Doorn. Hogere IV verhoogt aanval/verdediging/HP; het item verhoogt aanval. Het bronexemplaar wordt door snapshotberekening niet gewijzigd. |
| Bestaande grenzen behouden | Replaygelijkheid bij gegroepeerde ticks, invoerbounds/tempo/max450, missers, werkelijke impactpositie, vreemde owner, vroege submit, één actieve run, vierde ronde zonder reward en opgeven blijven groen. HTTP: gewone actie boven8KiB afgewezen; Arcade boven64KiB afgewezen. |

De oudere testnaam met “earlier human score” is behouden omdat nu daadwerkelijke afzonderlijke spelersrecord-/bonusdekking is toegevoegd. Het nieuwe tweespelertestgeval is het bewijs daarvoor; de oudere budgettest zelf gebruikt nog steeds één speler. Alle spelers en inputs in deze controles zijn synthetisch. Een `player`-doel bewijst een opgeslagen ander accountrecord, geen menselijke herkomst van de input.

## Korte mechanicsbevindingen

- De **eerste drie geldige** rondes geven grondstoffen. Zonder winst op een ander spelersrecord is dat175+75+75=325stof en60XP. Met drie zulke overwinningen maximaal200+100+100=400stof en60XP. Verdere geldige rondes geven completion/records. Het budget wordt bij **acceptatie** aan een UTC-dag toegerekend, ook als de run de dag ervoor begon.
- Een hogere doelscore maakt vijanden niet sterker en geeft geen extra scorevermenigvuldiger. Zij bepaalt alleen of `won` waar is en, voor een ander spelersrecord, de +25stof. Gelijkspel voldoet niet aan de strikte `score > doelscore`-voorwaarde; deze conclusie volgt uit de code, niet uit een apart gelijkspeltestgeval.
- Eigen stats en typen bepalen schade, HP en de beste beschikbare schutter. CP-klassen begrenzen de invoer maar normaliseren de squad niet. Sterkere/matching bugs binnen dezelfde klasse hebben daardoor bewust voordeel. De controles bewijzen rekenregels en snapshotbehoud, geen uitgewerkte balans tussen alle soorten/moves.
- Punten komen uit verslagen doelen:10/20/30/20 in een cyclus van24 doelen; de theoretische bovengrens van de huidige ronde is480punten. Typen of hogere CP geven alleen via het verslaan van doelen meer punten, geen afzonderlijke CP-scorebonus.
- Een ronde kwalificeert nu bij score>0, minimaal400simulatieticks, minstens drie verschillende inputcoördinaten en100ticks inputspan. Missers kunnen aan die laatste twee eisen bijdragen. Een volledig offline geleverde replay kan worden gevalideerd maar bewijst geen menselijke bediening; de automatische testspeler toont dit ook praktisch. Geen claim van volledige cheatbestendigheid.

## Bewijsgrenzen

- Geen browser, webbuild, native uitvoering of deploy in deze testercheck. Lifecycle/backguards zijn eerder gebouwd en in bron aanwezig; achtergrond, force-stop, accountwissel en inputvertraging op een echte telefoon zijn hiermee niet opnieuw uitgevoerd.
- Verloren ACK en herstel zijn nu echt op de lokale HTTP-/storegrens bewezen. Herstart van de volledige app met AsyncStorage, offline toestelherstel en cloud-Firestoreconcurrentie zijn niet in deze test uitgevoerd.
- SnapshotHash/contentHash, bewaarde volledige replay/inputDigest/completionReason, aparte zeven-medailleprogressie, rotatie, zes overige spellen en nieuwe combat zijn nog geen resultaat van deze controles.
- Deze notitie vult de oudere bewijsgrenzen in `technical.md` aan: de daar nog ontbrekend genoemde tweespelerbonus, expliciete IV/itemvergelijking en verloren HTTP-ACK zijn met deze lokale tests afgedekt. Native/appherstart en volledige auditmetadata blijven open.
