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
