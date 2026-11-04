# Gameplayregie — waarom terugkomen, wat testen

Onderzocht op 3 november 2026. Dit zijn onderbouwde ontwerpkeuzes en toetsbare hypotheses voor BugBaas; geen garantie op succes of retentie. Codex beheert dit hoofdstuk en de samenhang. Claude vertaalt het naar schermen/animaties; Sol bouwt en test de technische contracten. De taak verandert niet in zeven losse apps of een nieuw platform.

## Wat we uit bronnen meenemen

Onderzoek naar game-engagement beschrijft competentie, autonomie en verbondenheid als belangrijke behoeften. Begrijpelijke bediening, passende uitdaging en bruikbare feedback ondersteunen het gevoel dat je beter wordt. Dat is een ontwerpkader, geen formule die deze game automatisch leuk maakt. [Przybylski, Rigby & Ryan, 2010](https://selfdeterminationtheory.org/SDT/documents/2010_PrzybylskiRigbyRyan_ROGP.pdf).

Voor BugBaas betekent dit: je moet zien welke bug schoot, waarom een type hielp, waarom je verloor en wat een upgrade veranderde. Eén goede volgende actie geeft rust; teamkeuze en doelvolgorde geven echte keuze. Met minder dan vijf spelers leveren herkenbare vriendenscores en opgeslagen teams sociaal contact zonder wachtrij. Dit zijn onze ontwerpafleidingen, niet rechtstreeks gemeten effecten in BugBaas.

In een officieel Nintendo-interview beschrijft Vampire Survivors-maker Luca Galante eenvoudige besturing, een natuurlijke eindgrens en nieuwe mogelijkheden na een run. Hij presenteert de speelduur niet als gegarandeerd verslavingsrecept. [Nintendo, interview met de maker, 25 januari 2024](https://www.nintendo.com/jp/topics/article/3f3d9c44-6cc5-4197-a31b-1397f229c03b).

Onze toepassing: één gebaar per game, 45–60 seconden, snel naar een duidelijke uitkomst en Volgende ronde. Variatie zit in de ronde en het team, niet in meer menu's. Animaties maken treffers/beloningen voelbaar maar houden de speler niet drie seconden na iedere tik tegen.

Supergiant beschrijft voor Hades verschillende builds, herhaalbare uitdagingen en blijvende progressie. Die combinatie is bruikbaar als voorbeeld; de precieze inhoud en moeilijkheid passen niet één-op-één bij onze korte insectengames. [Supergiant, Hades FAQ](https://www.supergiantgames.com/blog/hades-faq/).

Onze toepassing: dezelfde gevangen bugs blijven waarde houden in kaart, Arcade en Strijd; ook een geldige verloren ronde kan iets opleveren. Geen aparte Arcade-bugs of zeven nieuwe progressiesystemen. Een andere move/typecombinatie moet merkbaar anders spelen, niet alleen een hoger CP-getal tonen.

De concrete Pokémon GO-bronnen en de vergelijking met de huidige code staan in [pogo-research.md](pogo-research.md). Daar staat expliciet dat GO Battle League live is; onze eerdere scores en opgeslagen verdediging zijn asynchroon. Dat verschil houden we duidelijk in de interface.

## De ene samenhangende kring

1. **Open:** kaart met eigen trainer en bereik; terugkomst alleen wanneer er echte nieuwe opbrengst is. Zonder goede GPS blijft de laatste kaart rustig zichtbaar; geen verzonnen vangrecht.
2. **Buiten:** lopen/fietsen levert geverifieerde afstand voor bestaande cocons/buddy/weekprogressie; posts vullen de tas en bugs vullen dex/team aan. Actief goed vegen vangt efficiënter dan autovangst.
3. **Thuis:** Arcade heeft één Speel met volgende korte ronde. Strijd gebruikt je eigen squad voor een echte strategische matchup. Geen verplichte live tegenstander.
4. **Uitkomst:** score en oorzaak meteen zichtbaar; alleen bevestigde grondstoffen vliegen kort naar hun teller. Hoogstens één gecombineerd record-/medaillemoment.
5. **Verbeteren:** één squad of ontbrekende dex/evolutie is een volgend doel. Een betaalbare upgrade toont werkelijke kosten en CP-voor/na; een volgende ronde laat het effect zien.

De drie tijdschalen vullen elkaar aan: direct beter mikken/beslissen; over meerdere sessies sterker team en complete families; over dagen lopen, buddy, dex en medailles. Dag-/weekdoelen zijn aanwijzingen, geen extra hoofddashboard. Gemiste dagen nemen geen bugs, stof, upgrades of medailles af. Een bestaande vangstreeks kan wel opnieuw beginnen; onderzoeksstempels en verdiende collectie blijven behouden.

## Waar de strategie werkelijk zit

**Tikduel:** kies doelvolgorde, raak bewegende doelen, schakel bedreigingen vóór hun !-aanval uit. Het systeem kiest de beste gereedstaande eigen fast move. Aanval/verdediging/HP/moves/typen/held item zijn echt; CP wordt niet nogmaals als schadebonus vermenigvuldigd. Geen chargeknoppen of extra minispel.

**Nestwacht:** kies de juiste baan en timing; je eigen schutters/moves bepalen schade. **Bubbelzwerm:** richten, één kaats, kleur/verbinding en komende bubbel; squad geeft richtsteun. **Webrenner/Windvlucht/Vlinderjacht/Bladtoren:** één begrijpelijk motorisch probleem; beperkte relevante hulp uit je squad, maximaal de overeengekomen circa14%. Geen verborgen volledige scoremultiplier voor een hoge CP.

**Squadcombat:** één actieve bug, echte type-/move-/itemkeuze, handmatig kiezen tussen twee charges en beperkt ontwijken/wisselen. Beide partijen volgen dezelfde energie-/cooldownregels. De chargewaarschuwing duurt één gezamenlijke seconde; geen vier lichtjes en geen onverklaarde NPC-voorsprong. Een beginner ziet twee duidelijke meters en een waarschuwing, geen statistiekendashboard.

**Progressie:** vroeg leer je vangen en een klein team maken; midden kies je typeafdekking, held item, TM en tweede charge; later optimaliseer je binnen een CP-klasse of speel je hoger. Gewone bugs moeten nuttig blijven door moves/typen; shiny is uiterlijk, geen extra kracht. Een zeldzame bug is geen automatische winnaar van iedere matchup.

## Eerlijk met weinig spelers

- Scorevergelijking alleen bij hetzelfde spel/challenge, seed, klasse en regelversie. Het doel staat vast bij start. Geen verse tegenstandersscore halverwege de poging en geen vergelijking tussen verschillende dagpuzzels.
- Een eerdere echte speler heet Eerdere score. Anders eigen record of herkenbare Veldwachter. Geen nep-online-naam. Gelijke score is geen overwinning en geeft geen mens-winbonus.
- Teampower mag helpen: dat is het verzameldoel. Voor een eerlijke wedstrijd blijven CP-klassen en rating bestaan. Een nieuwe echte-statflow wordt niet gemengd met oude genormaliseerde Echo-snapshots.
- Server berekent bezit, snapshot, invoeruitkomst en beloning. Replay/receipts verhinderen gemanipuleerde schade en dubbel uitbetalen; ze bewijzen niet dat iedere invoer door een mens kwam. Browser-GPS blijft vervalsbaar. Geen claim ‘niet te cheaten’.

## Beloningen doorrekenen vóór ze mooier tekenen

Huidig Arcadecontract: drie geldige rondes per UTC-dag, elk75 stof/20XP; eerste+100stof. Computer/eigen record geeft geen mens-winbonus: totaal325stof. Drie echte scorewinsten kunnen het totaal400 maken. Na het dagbudget blijven score en completion mogelijk; de interface belooft dan geen extra stof.

`powerCost(12)` vraagt1300stof en2familienectar voor een halve levelstap. Alleen325stof/dag uit Arcade is een kwart van die stofprijs: vier dagen voor die ene stap, los van vangsten/wandelen/andere rewards. De eerste ronde175stof is ongeveer13,5% daarvan. Dit is een concrete kans op een zwak upgradegevoel. Het is nog geen bewijs dat de totale economie te langzaam is; kaartvangsten zijn bewust de hoofdbron en ook nectar is nodig.

**Besluit voor de eerste iteratie:** geen globale beloningsinflatie terwijl de UI nog uit elkaar valt. Toon eerst één echt volgend teamdoel en receiptgebonden voortgang; zorg dat damage/typefeedback en het effect van een bestaande upgrade zichtbaar zijn. Test daarna de volledige beginnersroute, inclusief lopen/vangen en bestaande level-/dagbeloningen. Doel voor die proef: een beginner kan in de eerste5–10 actieve minuten één nuttige upgrade bereiken of precies herkennen wat nog nodig is. Dit is een testdoel, nog geen behaalde waarde.

Als die route dat doel niet haalt, blijft de correctie klein: één bestaande introductie-/voortgangsbeloning aanpassen of één vroege kostband herzien. Geen nieuwe munt, dagelijkse claimboom of hogere hele endgame-uitbetaling als eerste oplossing. Concrete bedragen pas uit de echte gecombineerde opbrengst berekenen, servermatig eenmalig toepassen en apart laten controleren.

**AF-01 — actueel gebruikersbesluit, bevestigd 4 november:** normaal één bug per 200 meter (5/km), workouttempo≥ 1,75 m/s geeft dubbel tegoed (10/km), maximaal 120/dag. meer dan 7 m/s telt niet. Beide foreground-/Health Connect-routes gebruiken `WALK_CATCH` en hetzelfde looptegoed. Gratis bevestigde wandelvangsten zonder netverbruik, wilde soort-/variantkansen; iedere tiende vangst gebruikt de bestaande jackpotselectie. Tegoed wacht zo nodig op een verse bruikbare GPS-fix; verstreken tijd alleen geeft geen bugs. Mijn eerdere250meter/20perdag-regel is ingetrokken. Op 4 november de overgebleven250meter-poort aan `WALK_CATCH.step` gekoppeld: precies 200 meter opgespaard tegoed wordt bij terugkomst verwerkt.20 gerichte AFK-/achtergrondtests groen. Dit is nog geen fysieke telefoon-/Health Connect-proef of bewijs dat een echte workoutactiviteit als zodanig wordt gevalideerd.

## Wat ik als tester laat bewijzen

| Proef | Goede uitkomst | Als het misgaat |
| --- | --- | --- |
| Eerste gebruik zonder PoGO-kennis | Tester vindt Kaart, Speel, Bugs en terug zonder uitleg; één primaire actie per scherm | Eerst indeling/woorden repareren, geen nieuwe tutorialpagina's |
| Eén ronde | Tik/veeg heeft direct herkenbare feedback; verlies/score is uit te leggen | Input, hitbox, shooter-/typefeedback en wachttijd controleren |
| Build A tegenover B | Zelfde seed/invoer; relevante move/typekeuze heeft uitlegbaar effect; geen dubbeltelling CP/item | Regelformule en snapshots controleren, geen fakebonuslabel |
| Upgrade | Zelfde exemplaar en IV/shiny/historie blijven; kosten kloppen; echte verandering zichtbaar | Server-/presentatiepad controleren |
| Weinig spelers | Zonder wachtende speler altijd een gelabeld doel; scorebron en klasse kloppen | Matchselectie/fallback repareren |
| Netwerk of dubbele tik | Spel bevriest niet per input; dezelfde run geeft precies één reward | Receipt/lifecycle herstellen vóór decor toevoegen |
| Low/reduced | Zelfde score, timing en hitboxes; waarschuwing blijft leesbaar | Decor verminderen, regels niet aanpassen |
| Terugkomen | Alleen werkelijke nieuwe km/vangsten/rewards, compacte figuren, claimed duidelijk | GPS-/Health-/receipt-/voorraadpad controleren |

Met minder dan vijf testers doen we geen alsof-statistiek over succespercentages of bewezen retention. Noteer per korte proef wat de speler begreep, waarom die nog een ronde wilde, wat een upgrade veranderde en waar die vastliep. Geen nieuwe analyticsdienst nodig. Bestaande oude gebruiksaantallen zijn aanwijzingen voor favoriete games, geen bewijs waarom mensen terugkwamen.

## Prioriteit en bewijs

Eerst IN-01/VS-01: één geheel. Dan GM-01 compleet op beeld, bediening en resultaat; vervolgens GM-02/03 en de rest. Tegelijk kan Claude bestaande veilige 3D-renders afmaken. Nieuwe games krijgen geen aparte navigatie of rewardimplementatie. Alle gameresultaten eindigen in dezelfde kring.

De actuele gerichte fout-/contracttests staan in [tester.md](tester.md). Een groene servertest bewijst geen fijne touchbediening, mooie animatie of native achtergrondwerking. Die afzonderlijke grenzen blijven zichtbaar in de taakstatus.
