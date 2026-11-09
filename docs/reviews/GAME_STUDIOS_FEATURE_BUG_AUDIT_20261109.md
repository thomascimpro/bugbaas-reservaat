# BugBaas — Game Studios featureaudit / bugs (9 november 2026)

**Type:** read-only code- en bewijsreview. **Scope:** nieuwe functies tussen GitHub-tags \`v0.1.35\` en \`v0.1.38\`; hoofdbranch op commit [5d23a0c](https://github.com/thomascimpro/bugbaas-reservaat/commit/5d23a0cafb39153a0de8bd63cd52e0f214086edf). **Status:** reviewvoorstel; niets gerepareerd of nieuw getest. Deze PR bevat uitsluitend deze audit, geen gameplay- of productiemutaties.

**Norm:** bestaande mechanieken/accountdata behouden, code is server-authoritative voor score en rewards, GitHub als gedeelde waarheid, gericht regressiebewijs en zichtbare/native QA waar geclaimd. Externe referentie [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios): brownfield adopt, balance-check, UX review, security-audit, test-evidence en gate-check. Dit is een handmatige gerichte bronreview, **niet** een voltooide geautomatiseerde uitvoering van die skills of een volledige runtime-/visuals-scan.

## A. Code-bevindingen

### GS-01 — P1 — Bestaande Strijd-rangen en seizoenbeloningen gewijzigd door Arcade-ladder

**Status: bevestigd codeverschil; ongewenst effect t.o.v. de vorige Strijd-regels. Ontwerpbesluit/migratie nog te bevestigen.**

- In [0.1.37 \`game/pvpV2.ts\`](https://github.com/thomascimpro/bugbaas-reservaat/blob/v0.1.37/game/pvpV2.ts#L17-L40) heeft Strijd vijf hoofdrangen: Brons vanaf 0, Zilver 1.100, Goud 1.250, Platina 1.400 en Kampioen 1.600. Voor Platina/Kampioen staat \`bug:true\` in de seizoensbeloning.
- In [0.1.38 \`game/pvpV2.ts\`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/pvpV2.ts#L17-L22) importeert **Strijd** \`RANKS\`, \`SEASON_REWARDS\` en \`softReset\` rechtstreeks uit [\`game/ranksV3.ts\`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/ranksV3.ts). Daardoor zijn er nu acht rangen, ligt Kampioen op 1.900 en bevat **geen** van de acht pakketten \`bug:true\`.
- De nieuwe seizoentabellen worden ook gebruikt bij [\`ensurePvp()\`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/pvpV2.ts#L59-L65). Daarmee verandert niet alleen de presentatie maar ook de echte Strijd-uitbetaling en deels de reset. Voorbeeld: oude Kampioen bij 1.600 punten is nu Diamant.
- Bestaande [\`SeasonResult.rank\`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/pvpV2.ts#L47-L49) wordt als **numerieke index** opgeslagen. [\`SeasonNewsV2\`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/src/PvpRankV2.tsx#L27-L31) kijkt voor historie opnieuw in de nieuwe \`RANKS[n.rank]\`. Een historische \`rank:4\` (Kampioen in 0.1.37) wordt dan **Diamant** getoond in 0.1.38. Historische medailletekst en afbeelding kunnen daardoor afwijken van de daadwerkelijk verdiende rang.
- Het [0.1.38-releaseverslag](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/docs/releases/0.1.38.md) beschrijft de nieuwe **Arcade**-ladder en zegt dat Strijd afzonderlijke scores behoudt. Het aparte [Strijd-ontwerp](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/docs/creator-handoff/STRIJD_RANGEN_SEIZOENEN_20261109.md) is als voorstel/niet volledig geïmplementeerd aangeduid. Het wijzigen van bestaande Strijd-beloningen is daarom niet als expliciet goedgekeurde migratie onderbouwd.

**Impact:** onverwachte rangdegradatie, afwijkende seizoensbeloningen (waaronder verdwijnen van zeldzame bugs), onjuiste historische rangpresentatie. **Vereiste test:** laad een 0.1.37-speler met \`pvp.points=1600\`, \`pvp.best=1600\`, \`lastSeason.rank=4\`; vergelijk 0.1.37 en 0.1.38: UI, beloofde reward, volgende maand, bestaande medailles. **Beslissing:** oude Strijd-regels loskoppelen van Arcade, of expliciete migratie goedkeuren met historische IDs/namen i.p.v. alleen numerieke indexen. Geen bestaande seizoensbeloningen stil terugdraaien zonder eerst deze keuze te maken.

### GS-02 — P2 — Bot-forfeit verhoogt seizoendeelname en kan seizoenpakket versnellen

**Status: bevestigd codepad; of dit ongewenst is hangt af van de definitie 'geteld duel'.**

- [\`completeRanked()\`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/server/arcadeRankedV3.ts#L89-L106) maakt bij opgeven een \`terminalReceipt\` met score 0; bij \`duel.bot\` volgt een \`record(..., 'loss')\`.
- [\`record()\`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/server/arcadeRankedV3.ts#L77-L83) verhoogt altijd \`season.played\`, dus ook bij een botronde met \`ticket.status='abandoned'\`. [\`ensureArcadeSeason()\`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/server/arcadeRankedV3.ts#L36-L43) vereist \`played>=5\` en \`wins>0\` voor het maandpakket.
- Daardoor is volgens het codepad **één echte botwinst + vier direct opgegeven botrondes** voldoende om de vijf seizoendeelnames te halen. De bestaande vijf-botstarts-per-dag blijven gelden, maar voorkomen dit specifieke scenario niet.

**Impact:** mogelijke deelname-/beloningsfarm zonder vijf uitgespeelde rondes. **Vereiste test:** nieuwe fixture voor één botwinst + vier bot-forfeits, daarna maandwissel en uitbetaling; ook menselijke forfeits, verlies en netwerkbreuk testen. **Beslissing:** hoort bewust opgeven bij de vijf 'afgeronde/getelde' duels? Als nee: tel uitsluitend uitgespeelde ronden mee voor \`played\`, behoud wel forfeit als competitief verlies. Als ja: documenteer dit expliciet en accepteer het farmgedrag bewust.

### GS-03 — P2 — Arcade-top 50 kan verkeerde spelers tonen na seizoensreset

**Status: logisch bevestigd op broncode; reproduceerbare DB-/integration-fixture nog niet uitgevoerd.**

- [\`GoServiceV2.command('arcadeScores')\`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/server/goServiceV2.ts#L324-L330) leest eerst de hoogste **50 ruwe opgeslagen** ratings uit \`v2ArcadeRanks\`; daarna pas worden oud-seizoen-ratings met \`softReset()\` omgezet en die **beperkte 50** opnieuw gesorteerd.
- Voorbeeld: 50 inactieve oude-seizoensspelers met opgeslagen 2.050 punten (nu circa 1.525 na reset) verdringen een actuele speler met 1.800 punten uit de database-top-50. Na sorteren in het geheugen ontbreekt de speler van 1.800 alsnog.
- De eigen speler wordt alleen aangeduid via \`me:r.uid===uid\`; buiten de ruwe top-50 wordt de eigen rangregel evenmin toegevoegd.

**Impact:** onjuiste/missende ranglijstplaatsen, vooral bij een grotere spelerpopulatie na een maandwissel. **Vereiste test:** minstens 51 opgeslagen rangen verdeeld over twee seizoenen. **Fixrichting:** persisteer de reset-/genormaliseerde score met correcte season-index, of selecteer/filter de juiste seizoenpopulatie vóór de top-N. Voeg de eigen positie afzonderlijk toe. Vermijd een onbeperkte full scan.

### GS-04 — P3 — Acht nieuwe rangnamen, maar vijf verschillende medaille-afbeeldingen

**Status: bewezen assetmapping; daadwerkelijke visuele kwaliteitsproef niet uitgevoerd.**

[\`RANK_ART\`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/src/PvpRankV2.tsx#L12-L13) bevat acht posities maar hergebruikt hetzelfde \`platinum.webp\` voor Platina/Diamant en \`champion.webp\` voor Elite/Kampioen/Master. De gekleurde rand maakt ze enigszins onderscheidbaar, maar het zijn geen acht unieke medailletekeningen.

**Impact:** visuele rangherkenning en prestige kunnen onderdoen voor het acht-rangenontwerp. **Acceptatie:** vergelijk de acht medailles in de echte Arcade-/Strijd-UI bij 320/390/430px; bepaal of acht unieke assets echt gewenst zijn. Geen artistieke wijziging zonder ontwerpkeuze.

## B. Onvoldoende onderbouwde kwaliteits- en procespunten (niet als werkende bug labelen)

| ID | Prioriteit | Status / bron | Nog te doen |
| --- | --- | --- | --- |
| GS-05 | P1 release-QA | [0.1.37](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/docs/releases/0.1.37.md) meldt dat de eerder gerapporteerde Android-appafsluiting bij raid/gevechtsovergang op een toestel **niet** opnieuw is getest. Ook [0.1.38](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/docs/releases/0.1.38.md) heeft uitsluitend APK-/bundel- en browserbewijs. | Echte APK updaten, crashlog, raid → gevecht → resultaat → terugkomst met twee accounts. Geen 'crash opgelost' claim zonder toestelbewijs. |
| GS-06 | P2 native | [0.1.36](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/docs/releases/0.1.36.md) en de 9 november-checkpoint documenteren Health Connect, background GPS en autovangst met synthetische tests, maar geen echte 10–20 minuten Android-wandeling, slaap-/force-stop-/accuproef. | Toestel/OS, Health Connect-providers, 30 dagen/UTC-grens, GPS-overlap, opt-in/revoke, notificatie en batterij meten. |
| GS-07 | P2 balans | [\`rankedBots.ts\`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/arcade/rankedBots.ts) gebruikt vaste doelen per game/rang (geen getrainde spelerstijl). Tests controleren stijgende getallen en limieten, niet de haalbare winpercentages met echte legale teams/acties. | Herhaal vaste seeds met meerdere geldige squads en invoerstrategieën; vergelijk werkelijke scoreverdeling en botdrempels per game/rang. Geen bot-nerf uit aannames. |
| GS-08 | P2 proces | [\`progress.json\`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/docs/creator-handoff/progress.json) noemt nog 0.1.35/7 november; [README](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/README.md) start bij 0.1.36. Het volledige Game Studios-reviewplan staat op een [aparte branch](https://github.com/thomascimpro/bugbaas-reservaat/tree/docs/game-studio-integrale-review-20261107), niet op main; \`CLAUDE.md\` en \`.claude/agents\` ontbreken op main. | Bestaande tracker, README en plan safe synchroniseren na review; geen tweede taakregister en geen automatische merge. |
| GS-09 | P2 visuals | [0.1.38](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/docs/releases/0.1.38.md) heeft tests en browsercontrole op 320/430px; een complete acht-rangen-mobile-animatie-/accessibilityreview of alle zeven nieuwe ranked-uitkomsten is niet bewezen. | Bestaande schermen echt bedienen bij 320/390/430px; screenshots versus TO/FO, tab-/backnavigation, screenreader, win/loss/forfeit, audio en reduced motion. |

## C. Prioriteit en uitvoerbare acceptatie

1. **GS-01 eerst:** maak een **rode Strijd-compatibiliteitstest** voor oude rangdrempels, \`lastSeason.rank=4\` en zeldzame buguitbetaling. Besluit eerst of de nieuwe Strijd-regels überhaupt bewust goedgekeurd zijn. Vermijd het terugdraaien van de nieuwe **Arcade**-rangen.
2. **GS-02/03:** gerichte serverfixtures voor forfeitdeelname en echte top-N na reset. Geen extra netwerkverzoeken of clientberekende beloningen. Nieuwe tests moeten aantonen welk gedrag verandert.
3. **GS-05/06:** toestel-QA is een afzonderlijke blokkade, geen reden om code blind te herschrijven. Eventueel testen met een vervangbare QA-account; geen productie- of privé-GPS-log in Git.
4. **GS-04/07/09:** gamefeel, schaal en art vergelijken met het reeds goedgekeurde ontwerp. Visueel 'PASS' pas met daadwerkelijk bekeken UI; balansoordeel pas met gemeten scores.
5. **GS-08:** documentatie koppelen aan actuele release. Houd het bestaande \`PLAN.md\`, \`progress.json\`, \`POGO_WERKREGISTER.md\` en \`POGO_TESTMATRIX.md\` als enige bronnen; geen extra tracker naast dit **reviewdocument**.

## D. Bewijsmatrix en beperkingen

- **Wel gedaan in deze review:** actuele GitHub-head/verschil vanaf 0.1.35 lezen; releasenotities en bestaande tests verifiëren als aanwezig; gerichte broncodepaden in \`pvpV2\`, \`ranksV3\`, \`server/arcadeRankedV3\`, \`GoServiceV2\`, \`PvpRankV2\`, Health Connect-bridge, GameV2 en UI controleren; 0.1.37 → 0.1.38 diff voor Strijd verifiëren.
- **Niet gedaan:** nieuwe testuitvoering, compile, native APK-installatie, echte Android-sensor-/accumeting, gehele 153-modellen-/bewegingenscan, volledige Playwright-interactie op alle schermen of live cloudsecurity-penetratietest. Historische 731/731 groen in 0.1.38 zijn **releaseclaims** en gelden niet als vers uitgevoerde tests van deze PR.
- **Niet aannemen:** een ontbrekende test is geen bewezen bug; een logisch codepad is pas een runtimebevinding wanneer met fixture/herhaling bevestigd; of een gedrag ongewenst is, wordt bij onduidelijke ontwerpkeuze expliciet voorgelegd.
- **Scope van deze PR:** alleen reviewdocument, geen wijzigingen aan game, tests, accounts, database, GitHub-main, APK of productie. Correcties horen in afzonderlijke kleine implementatie-PR's, liefst met vooraf falende regressietest en bewezen fix.

## E. Vervolgonderzoek — aanvullende bugs en balancing (9 november 2026)

**Reviewbasis:** `main` op 5d23a0c, dezelfde 0.1.38-spelregels. Dit zijn **GS-10 t/m GS-16**, aanvullend op GS-01 t/m GS-09. Er is geen nieuwe repository-test, build of Android-proef uitgevoerd. Waar cijfers staan, zijn die nagerekend uit de bronformules en expliciet als theoretische grenzen/steekproeven aangeduid.

### GS-10 — P1 balans — Tikduel-botdrempels overschrijden de theoretische score van vrijwel iedere onderzochte seed

**Status: exacte bronformules nagerekend; sterke wiskundige balansaanwijzing, niet interactief gespeeld.**

- [`game/arcade/rankedBots.ts`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/arcade/rankedBots.ts) heeft Tikduel-botdoelen **55 / 80 / 110 / 145 / 180 / 215 / 250 / 290** per hoofdrang, met deterministische variatie van **−5% tot +5%**.
- [`originalPickBugIds()`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/arcade/original/tapDuel.ts) kiest **56 van 1.000 catalogusbugs**. [`hit()`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/arcade/original/tapDuel.ts) geeft per gevangen bug **1/2/4/6/9** punten naar zeldzaamheid, plus **maximaal 1 punt per vijf vangsten** via combo. In de huidige `create()` is `comboBonusEvery=5`. Helperaanvallen en invoer geven geen andere directe scorebron.
- Voor seeds **1 t/m 1.000** is de **bovengrens** berekend als *alle 56 doelbugs gevangen, zonder enige misser en met maximale 11 combopunten*. Uitkomst: minimum **101**, mediaan **140**, gemiddelde **139,7**, maximum **184**. Omdat tijd, spawn, benodigde meerdere tikken en missen buiten beschouwing zijn gelaten, zijn echte haalbare scores **niet hoger** dan deze seed-specifieke bovengrenzen.
- Bij vergelijking met de **werkelijke botscore inclusief seedafhankelijke ±5%** kan een speler zelfs onder deze perfecte-bovengrens niet winnen in: **8/1.000** Goud-seeds, **657/1.000** Platina, **999/1.000** Diamant en **1.000/1.000** bij Elite/Kampioen/Master. Andere seeds dan deze steekproef zijn niet uitgesloten; geen claim dat alle mogelijke seeds absoluut onwinbaar zijn.

**Impact:** vanaf Platina wordt de uitkomst sterk afhankelijk van een onhaalbare botscore, zelfs bij perfecte spelersinvoer. Eén gedeelde Elo over alle zeven spellen kan daardoor afhankelijk worden van welk spel de speler krijgt.

**Acceptatie:** eerst een geautomatiseerde scoreverdelingsscan over representatieve **werkelijke ranked seeds**, vervolgens simuleerbare legale invoer met zwakke/sterke squads, inclusief botvariatie. Kalibreer drempels per game en rang op beoogde winpercentages. Geen wijzigingen aan de oorspronkelijke Tikduel-mechanics om onrealistische botscores mogelijk te maken.

### GS-11 — P1 replay/anti-cheat — afgewezen handelingen tellen mee om Arcade-rewards te kwalificeren

**Status: bevestigd codepad; nog geen uitgevoerde API-/end-to-end-reproductie.**

- Bij originele rules verwerkt [`applyArcadeInput()`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/arcade/games.ts#L104-L106) de returnwaarde `originalPort(ticket).input(...)`, maar voegt de input **ongeacht `accepted=false`** toe aan `s.acceptedInputs`.
- [`replayArcade()`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/arcade/games.ts#L247-L250) telt distinct via `[x,y,action,control,tick]`; daarmee tellen drie volstrekt identieke ruimtelijke/no-op-handlingen op verschillende ticks als drie afzonderlijke inputs. `qualified` vereist ten minste 8 s speeltijd, score groter dan nul, drie distinct inputs en een span van minstens 2 s.
- Bijvoorbeeld [Webrenner](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/arcade/original/webRunner.ts): de spelkern kan een niet-passende `up`-handeling afwijzen, maar het spel genereert ook een **passieve overlevingstijdscore van 9 punten per seconde** (minus daadwerkelijke botsingen). Daarmee kan de activiteitsvoorwaarde voldoen zonder drie echte acties.
- [`submitArcade()`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/server/arcadeServiceV3.ts#L62-L106) gebruikt die `qualified` om dagelijkse stof/XP, progressie en ranked-kwalificatie te bepalen. De server controleert wél verstreken werkelijke tijd; dit is **geen** directe tijdversnellingsbug.

**Impact:** passieve of ongeldige input kan meetellen voor serverbeloningen en competitieve scorekwalificatie; originele gameplay mag niet door nepactiviteit worden vervangen.

**Reproductietest:** replay op echte `web_runner-2`-ticket met drie tijdgespreide, door de port afgewezen acties; leg `port.input=false`, `acceptedInputs.length=3`, score en `qualified` vast. Vergelijk met dezelfde input zonder ongeldige handelingen. **Fixrichting:** activiteit/kwalificatie baseren op *daadwerkelijk geaccepteerde, betekenisvolle gameplayhandelingen*, niet op ingezonden events of enkel tijdverschil; behoud correcte replay van vrij bewegende bediening.

### GS-12 — P1 anti-cheat/economie — Health Connect-herkomst is niet te bewijzen uit serveraanvraag

**Status: protocol- en validatiegat aantoonbaar; misbruik niet op een live account uitgevoerd.**

- [`GoServiceV2.command('adventureSync')`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/server/goServiceV2.ts#L381-L382) accepteert een JSON-`snapshot` vanuit de ingelogde client. [`validSnapshot()`/`syncAdventure()`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/adventureSyncV2.ts) controleren schema, timestamps, stappen, afstand en plausibele snelheid, maar de bron wordt geïdentificeerd via de door de client opgegeven string `source:'health-connect'`. Er is in dit codepad **geen cryptografisch of extern gecontroleerd bewijs** dat de waarden uit de Health Connect-provider komen.
- Rekenkundig voorbeeld ter **threat-modeling**, niet als uitgevoerde aanval: een eerder vastgelegde 0-baseline; na één werkelijk verstreken uur een zelfopgegeven toename van **12.000 stappen en 12.000 meter**. Die data blijft binnen de bronchecks: stappen/dag maximaal 100.000, afstand maximaal 1,15 m per stap en snelheid maximaal `3,5×3600+30=12.630 m` per uur. De server kan herkomst niet onderscheiden van echte metingen.
- Bij ingeschakelde wandelvangst rekent [`awayCatch()`/`creditWalk()`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/server/goServiceV2.ts#L304-L311) in dit voorbeeld 3,33 m/s als workout en **verdubbelt 12 km tot 24 km vangtegoed**, begrensd tot maximaal **120 bugs per UTC-dag**. Uitreiking van concrete bugs vereist daarnaast een **verse toegestane GPS-fix met seed**; tot die tijd blijft krediet bestaan. Een normale basisvangst levert **100 stof** plus andere beloningen op; maximaal 120 basisvangsten vertegenwoordigen dus ten minste **12.000 stof**. Dit is een scenario onder geldige invoerformules, geen gemeten productie-uitbetaling.
- De Android-bridge [`BugBaasAdventureSyncModule.kt`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/plugins/adventure-sync/BugBaasAdventureSyncModule.kt) leest de echte provider voor **eerlijke clients** en sluit handmatige records uit, maar een server ziet die lokale bewijsbron niet via het HTTP-commando.

**Impact:** Health Sync is economisch gevoelig voor gemanipuleerde clients ondanks bestaande plausibiliteitsgates; belangrijk voor cocons, autovangst en balans. **Test:** synthetische serverfixture (geen productie), opt-in/permissiongedrag, twee tijdstippen en maximale toekenning, dubbele claims en GPS-overlap. **Fixrichting:** threat model en limieten voor Health-credits met onafhankelijker device-/integriteitsbewijs waar haalbaar; expliciete trustgrenzen. Claim niet dat GPS of Health Connect cryptografisch onspoofbaar is.

### GS-13 — P2 balans — Workoutbonus wordt onmiddellijk geactiveerd, zonder bewijs van 'sustained' activiteit

**Status: codeformule bevestigd; gewenste duur van sportactiviteit nog te bepalen.**

[`WALK_CATCH`/`creditWalk()`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/walkCatchV2.ts) hebben `workoutPace=1.75`, `maxPace=7`, `w.pace=w.pace===undefined?speed:0.7×oud+0.3×nieuw`, en `w.workout=(w.pace>=1.75)`. De eerste geldige meting met **5 m/s** (18 km/u) activeert dus **onmiddellijk** dubbele credit: 200 m wordt 400 m vangtegoed en kan **twee bugs** opleveren, niet één. Het maximale geaccepteerde tempo is 7 m/s = **25,2 km/u**; het algoritme kan lopen, hardlopen en fietsen niet onderscheiden. Dit botst met de beschrijving 'sustained brisk walking or running'.

**Impact:** mogelijk disproportionele progressie door korte hoge snelheden of fietsen, met tot 10 bugs/km en iedere tiende een jackpot. **Test:** vaste-seed trajecten met langdurig wandelen, korte snelheidsuitschieter, fietsen en GPS-ruis; toets overgang/hysterese, opt-in en snelheidscaps. **Beslissing:** hoe lang moet een echte workout aantoonbaar duren voordat dubbel krediet start? Behoud legitieme hardloopbeloningen.

### GS-14 — P2 balans — Eén ranked-Elo voor rondes van 30 seconden tot 10 minuten zonder speelduurnormalisatie

**Status: ontwerp-/balansrisico, niet als functiefout bewezen.**

[`ARCADE_GAMES`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/arcade/games.ts#L11-L18) gebruikt **30 s Tikduel**, **60 s Vlinderjacht**, **150 s Nestwacht** en **600 s Webrenner, Windvlucht, Bladtoren, Bubbelzwerm**. [`arcadeRankedRatingChange()`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/arcade/ranked.ts) gebruikt voor alle games dezelfde vaste Elo-K=40 en `rankedBot()` vaste targets per spel. Dat is **20× verschil in nominale speelduur** voor potentieel dezelfde ratingwinst; survivalgames kunnen eerder eindigen bij verlies. Webrenner geeft zonder pickups al **9 punten/seconde overleving** (minus hits), wat niet vergelijkbaar is met Tikduels beperkte 56-bugscore. De geplande selectie is willekeurig; de speler kiest ranked-game niet zelf.

**Impact:** ongelijke kans en tijdsinvestering afhankelijk van spelkeuze. **Test:** per game/rang mediane rondeverlopen, geaccepteerde scoreverdeling, bot-winrate, Elo per minuut en afhakers met legale squads. Geen Elo per minuut invoeren zonder ontwerpbesluit: beter is gelijkwaardig speelplezier/haalbaarheid en duidelijke tijdsverwachting.

### GS-15 — P2 performance/abuse — nieuw Arcade-scorereadpad omzeilt de spelactie-rate-limit

**Status: ontbrekende limiter in de applicatielaag bevestigd; eventuele externe Vercel/WAF-limiet niet beoordeeld.**

[`GoServiceV2.command()`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/server/goServiceV2.ts#L324-L330) behandelt `arcadeScores` **vóór** de normale `v2GoRate`-transactie en `<=600 acties/minuut` controle ([zelfde bestand rond regel 362](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/server/goServiceV2.ts#L360-L364)). De read voert op iedere geldige aanroep een nieuwe Firestore-query uit (ranked top50 of game-scorequery). [`server/http.ts`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/server/http.ts) valideert wel bearer-auth/bodygrootte maar bevat geen equivalente route-throttle. Resultaat is **geen aantoonbare applicatie-rate-limit voor dit nieuwe readpad**.

**Impact:** bij veel herhaalde aangemelde scoreverzoeken onnodige databasekosten/latentie; upstream-rate-limits kunnen dit beperken maar zijn niet gecontroleerd. **Test:** mock-store tellers plus beperkte loadtest in testomgeving, geen productiebelasting. **Fixrichting:** bounded TTL-cache/serverrate-limit en UI request-dedup, zonder verouderde rankings of het read-only ontwerp te breken.

### GS-16 — P2 economie/ontwerp — historische gesloten-appkilometers worden als vangsten van de huidige dag en plek uitgekeerd

**Status: codegedrag en bestaande test wijzen op een bewuste keuze; markeer als balancing-vraag, niet bewezen defect.**

[`syncAdventure()`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/game/adventureSyncV2.ts) telt niet eerder gecrediteerde meters uit maximaal 30 dagen bij; [`awayCatch()`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/server/goServiceV2.ts#L304-L313) zet de **geaggregeerde afstand** om naar `walkDay(p,now)` (vandaag). [`walkCatch()`](https://github.com/thomascimpro/bugbaas-reservaat/blob/main/server/goServiceV2.ts#L272-L287) genereert vangsten/jackpots op de **huidige GPS-plek** en past het **huidige** dagmaximum 120 toe. De test `autoAwayV2.test.ts` accepteert expliciet een 2 km wandeling over middernacht met tien bugs bij terugkomst.

**Balansrisico:** oudere meters kunnen in één sessie het dagbudget en het biome-/jackpotsysteem beïnvloeden; bij meer dan 24 km vangtegoed raakt de 120/dag-grens de uitkering. **Beslissing:** wil BugBaas offline historie volledig later uitkeren, per oorspronkelijke UTC-dag begrenzen of over meerdere dagen verdelen? Test 2/10/30-dagen terugkomst, daggrens, afwijkend biome en voorraad-/transactiegrootte. Eerst de bestaande productafspraak bevestigen; geen stilzwijgende afwaardering van verdiende wandelafstand.

## F. Aanbevolen volgorde voor separate herstel-PR's

1. **GS-11 (P1):** rode regressietest voor drie door de spelkern geweigerde inputs; pas daarna de validatie van betekenisvolle handelingen aan. Bescherm server-replay en normale snelle aanraakbediening.
2. **GS-10 (P1):** statistische botscore-/winratebenchmark op echte ranked-seeds voor alle zeven games. Aanpassing alleen aan balanstabellen, niet de zeven originele spelkernen om kunstmatig meer punten te maken.
3. **GS-12 (P1):** afgesproken anti-cheat-threatmodel, gerichte testfixtures voor gemanipuleerde Health-snapshots en minimale veilige mitigatie. Behoud Health Connect-bestaande gebruikers en aantoonbaar eerlijke kilometers.
4. **GS-01 en GS-02/03:** bestaande Strijd-data/migratie en seizoens-/ranglijstlogica testen zoals boven beschreven; geen retrospectieve accountreset of dubbele seizoenreward.
5. **GS-13/14/16 (P2 balans):** numerieke game-economietabel en echte speelduurmetingen vóór wijziging van workouts, bots, jackpots en andere beloningen.
6. **GS-15 (P2):** eenvoudige limiter/cache + API-test zonder productiebelasting.

**Nieuw testbewijs van deze review:** geen toolgebouwde projecttests; de 1.000-seed-berekening voor Tikduel is een **losse formele bovengrensberekening rechtstreeks uit de GitHub-formules**, geen op toestel behaalde score of npm-test. De Health-/walkvoorbeelden zijn **scenario-rekenchecks** op codevoorwaarden, geen live exploit-/uitbetalingstest. Deze PR blijft alleen documentatie.
