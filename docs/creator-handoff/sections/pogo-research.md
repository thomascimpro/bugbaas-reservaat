# Pokémon GO-mechanieken naast het BugBaas-plan

Gecontroleerd: **3 november 2026**. Alleen officiële Pokémon GO-help en officiële nieuwsberichten gebruikt. Vergeleken met het actuele creatorplan, `games.json`, `docs/creator-handoff/PLAN.md`, `CLAUDE_SCHERMINDELING.md` en de hieronder genoemde broncode. Dit is mechaniekonderzoek voor het plan; geen runtimewijziging, databasehandeling of nieuwe featurelijst. Codex bewaakt mechanieken en acceptatie; Claude bepaalt schermcompositie, beeld, animatie en 3D binnen de gebruikerskeuzes, inclusief zichtbare zoom/2D/3D-knoppen.

**Bewijsgrens:** de bronnen bewijzen beschreven spelregels, geen retentiewinst, optimale sessieduur of geschiktheid voor tienjarigen. De uitleg “waarom” hieronder is een ontwerpafleiding. Minder dan vijf beschikbare spelers is onze ontwerpvoorwaarde, geen hier gemeten spelersaantal. Bewoordingen als “werkt” of “verslavend” in een beeldplan gelden niet als bewezen gedragsresultaat.

## 1. De wereld is het vertrekpunt; extra informatie heeft een context

**Bron:** [What is the Map View?](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/84-what-is-the-map-view/) beschrijft kaartpositie, trainer, Nearby, hoofdmenu, onderzoek en buddy als afzonderlijke ingangen. Actieve itembonussen verschijnen alleen wanneer ze actief zijn. De huidige officiële kaartbeschrijving bevat veel meer dan drie elementen; “PoGO toont alleen drie knoppen” is geen correcte bronclaim.

**Waarom feedback/progressie:** de wereldactie blijft zichtbaar, terwijl menu en detail de volledige inhoud ontsluiten. Dat kan een duidelijker eerste handeling ondersteunen; deze bron meet die uitkomst niet.

**Onze toepassing:** behoud de afgesproken lus **vinden → vangen → eigen bug → sterker → spelen** en contextuele status/badges. Het kind hoeft geen nieuwe subsystemen te leren voordat het één bug kan vangen of één ronde starten. Claude bepaalt de plaatsing en minimale HUD; dit onderzoek schrijft geen nieuwe knoppenindeling voor.

**Bestaat/mist:** kaart, objectselectie, vangst, collectie en detail bestaan. De vier vaste tabs en gedeelde visuele compositie zijn nog integratiewerk volgens het huidige plan; een losse ArcadeEntry is geen voltooide toepassing van deze lus.

## 2. Buddy: kleine handeling, zichtbaar hart, blijvende band

**Bron:** [Buddy Adventure](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/2155-buddy-adventure/) onderscheidt dagelijkse activiteiten/harten, tijdelijke stemming en een Buddy Level dat niet daalt. Hogere niveaus geven concrete hulp. Een hart verandert zichtbaar van leeg naar gevuld.

**Waarom feedback/progressie:** dezelfde eigen partner koppelt een korte handeling aan een blijvende teller en een herkenbaar voordeel. Een permanent niveau is een andere soort voortgang dan een dagelijks beschikbaar hart.

**Onze toepassing:** toon de bestaande buddy, afstand tot nectar en werkelijk verdiende harten/volgend bestaand voordeel begrijpelijk. Behoud de eigen simpele regels; neem geen extra stemming-, honger-, AR- of verzorgingsverplichting over.

**Bestaat/mist:** `game/buddyV2.ts` heeft niveaus bij 0/10/30/70/150 harten; 3× aaien, 3× voeren en maximaal 10 wandelharten per dag. Iedere goedgekeurde kilometer geeft 1 familie-nectar; het beste maatje 2. Goed maatje geeft 50 stof/km, Super 100; Geweldig geeft bij het eerste aaien van de dag een bestaand cadeau. Dat cadeau is dus geen universele dagbeloning vanaf de start. Harten/perks bestaan als logica; nieuwe animatie en uniforme presentatie blijven Claude's werk en zijn hier niet getest.

## 3. Adventure Sync en uitkomen: afstand wordt een bewaard resultaat

**Bron:** [Adventure Sync](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/3265-adventure-sync/) beschrijft optionele afstandsregistratie wanneer de app gesloten is, voor buddy-candy, eieren en weekvoortgang. [Incubators & Hatching Pokémon Eggs](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/2358-incubators-hatching-pokemon-eggs/) koppelt een zichtbare kilometervereiste aan uitkomen, met bekijkbare mogelijke inhoud en een versnellenbare onthulling.

**Waarom feedback/progressie:** de afstandsbalk verklaart waarvoor wandelen telt; de onthulling maakt het behaalde eindpunt herkenbaar. Optioneel meten voorkomt dat dezelfde lus uitsluitend met het scherm aan hoeft te worden uitgevoerd.

**Onze toepassing:** gebruik de bestaande afstand, buddy en cocons; toon bevestigde voortgang en echte toestemmingsstatus. Laat een reveal alleen het bevestigde resultaat tonen. Een ingeschakelde instelling bewijst nog geen ontvangen afstand; foreground GPS, Health Connect en achtergrondautovangst blijven onderscheiden.

**Bestaat/mist:** `game/adventureSyncV2.ts` verwerkt Health Connect-dagtotalen met een eerste baseline en combineert GPS/health via een maximum in plaats van beide op te tellen. `game/goCocoonsV2.ts` heeft 2/5/7/10-km-cocons, machines, pools en hatchrewards. Dit is broncodebewijs; fysieke wandeling, native synchronisatie en nieuwe reveal zijn hier niet uitgevoerd. De officiële verwijzing naar Apple Health/Google Fit verleent BugBaas geen onbewezen iOS-ondersteuning.

## 4. Eerste vangst: korte terugkeeractie; een reeks is een apart contract

**Bron:** [Daily Bonuses](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/105-daily-bonuses/) beschrijft eerste vangst/post per dag en een grotere zevendedagbonus, met lokale daggrens. Exacte Pokémon GO-XP-bedragen zijn hier geen balansbasis: deze helptekst en het officiële [GO Beyond-bericht, bijgewerkt 7 december 2020](https://pokemongo.com/news/gobeyond-level40) noemen verschillende bedragen. De structurele lus is wel in beide herkenbaar.

**Waarom feedback/progressie:** één geslaagde actie kan direct een afgerond dagmoment geven; een reeks voegt een langere teller toe. Dat maakt een reeks nog niet noodzakelijk of bewezen beter voor retentie.

**Onze toepassing:** laat de bestaande eerste-vangstbeloning herkenbaar zien en houd de uitleg over reeksen precies. Voor een tienjarige is “eerste vangst klaar” voldoende voor het korte moment; geen extra inlogclaim of taak nodig.

**Bestaat/mist:** `game/trainerV2.ts::catchXP` geeft 100 basis-XP, +500 voor een nieuwe soort, +500 bij de eerste vangst van een **UTC-dag**, plus bestaande worpbonussen. De zevende opeenvolgende vangstdag geeft nog 500 stof en 2000 XP. Een gemiste dag herstart deze vangstreeks; verzamelde bugs, XP, nectar, buddyharten en onderzoeksstempels worden daarbij niet gewist. Dit verschilt van de brede planzin “geen verlies bij een gemiste dag”: benoem in het plan welke teller herstart en welke voortgang permanent blijft. Dit onderzoek verandert die regel niet.

## 5. Onderzoek: een gewone spelhandeling vult meerdere bestaande doelen

**Bron:** [Types of Research](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/45-types-of-research/) koppelt concrete taken zoals vangen/lopen/vechten aan claimbare beloningen en zeven stempels aan een doorbraak. Voortgang en taken zijn via één onderzoeksingang te bekijken; niet iedere taak wordt een aparte kaartknop.

**Waarom feedback/progressie:** de actie die de speler al uitvoert kan een kort doel afronden én langetermijnvoortgang vullen. Een zichtbare claim markeert het resultaat; de bron bewijst niet dat meer dagelijkse taken beter zijn.

**Onze toepassing:** presenteer de bestaande drie doelen en het stempelboek samen onder Doelen, met hoogstens één volgende aanwijzing op de kaart. Geen extra dagtaken of aparte Arcade-questlaag toevoegen vanuit dit onderzoek.

**Bestaat/mist:** `game/dailyResearchV2.ts` heeft Vang 3 bugs (100 stof/300 XP), Loop 500 m (150/300), Mooie zwaai (200/300), plus de bestaande items. Samen is dat 450 stof/900 XP. De eerste geldige claim van een serverdag geeft maximaal één stempel; zeven stempels geven 500 stof, 10 netten, 2 lokmiddelen en 1 snelle TM. Gemiste dagen wissen deze stempels niet. Nieuwe week-Arcadestempels zijn een andere geplande teller en mogen niet als dit al werkende boek worden gepresenteerd.

## 6. Power-up en evolutie maken een eigen vangst bruikbaar

**Bron:** [Powering Up Pokémon](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/2372-powering-up-pokemon/) beschrijft algemene Stardust plus familiegebonden Candy, zichtbare kosten en hogere CP/HP. [Evolving your Pokémon](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/100-evolving-your-pokemon/) beschrijft een blijvende verandering van het gekozen exemplaar; het aantal verzamelde exemplaren blijft gelijk.

**Waarom feedback/progressie:** dezelfde gevonden soort levert zowel een verzamelobject als een doel voor de volgende vangst/wandeling. Voor/na CP/HP maakt het effect van uitgeven controleerbaar.

**Onze toepassing:** behoud algemene stof én familie-nectar, dezelfde exemplaar-ID, level/IV/shiny en concrete voor/na-kosten. Toon geen nieuwe munt of universele nectar om een scherm eenvoudiger te maken. Een upgrade moet aantoonbaar doorwerken in de beloofde nieuwe speelmodi, niet alleen een teller laten bewegen.

**Bestaat/mist:** `game/goV2.ts::stats`, `powerCost`, `powerUp`, `evolveGo` en `goCatchRewards` bestaan. Een vangst geeft per evolutiestadium 100/300/500 stof en 3/5/10 nectar vóór bestaande aasbonussen. Power-up verhoogt level met 0,5: level 1→1,5 kost 200 stof/1 nectar; 8→8,5 kost 800/1; 20→20,5 kost 2500/2. Deze drie waarden zijn rechtstreeks met de huidige functie uitgelezen. `evolveGo` controleert de vereiste soortnectar en verbruikt netto `evo.candy - 1`; het bestaande exemplaar verandert van soort. Bewaar deze huidige semantiek bij presentatie en controleer echte voor/na-totalen. De nieuwe volledige gevechtslus is nog niet aanwezig.

## 7. GO Battle League is live; onze asynchrone vormen moeten eerlijk benoemd zijn

**Bron:** [GO Battle League](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/2312-go-battle-league/) zegt expliciet dat je wordt gekoppeld aan een andere trainer die op dat moment een gevecht zoekt; de tegenstander kan bij jouw verbindingsverlies doorvechten. Dit is geen opgeslagen team of eerdere score. [Battling Other Trainers](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/2308-battling-other-trainers/) beschrijft teams van drie, CP-klassen en apart oefenen tegen teamleiders.

**Waarom feedback/progressie:** CP-klassen begrenzen toelating en teamkeuze; live matchmaking vraagt gelijktijdige beschikbaarheid. Bij minder dan vijf spelers kan die beschikbaarheid geen voorwaarde zijn voor de belangrijkste speelknop.

**Onze toepassing:** behoud de gekozen BugBaas-vormen met precieze labels: **Eerdere score** voor Arcade, **Opgeslagen team** voor computerbestuurde verdediging en **Veldwachter** voor NPC. Geen bots als echte wachtende spelers tonen. Bestaande live Ranked blijft een afzonderlijke bestaande modus; noem die niet asynchroon. CP is een klassegrens, geen extra scorevermenigvuldiger.

**Bestaat/mist:** `game/echoArenaV2.ts` kan opgeslagen teams en herkenbare NPC-teams kiezen zonder aanwezige eigenaar. Maar `normalizeCompetitionFighter` zet nu level op 20/30/40 en IV op 10/10/10; eigen level/IV-upgrades werken daar dus niet volledig door. Het creatorplan eist juist echte stats binnen 1500/2500/onbegrensd. Dat is een expliciet nog uit te voeren gedragsverschil, geen reeds bewezen eigenschap van de huidige Echo-modus. De nieuwe Tikduel-squad gebruikt wel de eigen stats; de overige zes nieuwe Arcadegames zijn nog ongebouwd.

## 8. Arcade: korte completion met bescheiden buit, geen vervanging van wandelen

**Bron:** [Battling Other Trainers](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/2308-battling-other-trainers/) maakt een expliciet onderscheid tussen onbeperkt kunnen spelen en een beperkt aantal materiaalbeloonde vriendschaps-/buurtgevechten. Dat ondersteunt het onderscheid spelen versus verdienen; het bewijst niet dat drie rondes de optimale BugBaas-limiet zijn.

**Waarom feedback/progressie:** een einde, bevestigde buit en een concrete volgende ronde sluiten de korte sessie af. De grondstoflimiet voorkomt hier dat eindeloos tikken de hele wandel-/collectie-economie vervangt. Meer herhalingen of rondes op zichzelf bewijzen geen betrokkenheid.

**Onze toepassing:** behoud de vastgelegde budgetten, één Speel en de eigen squad. Volgende blijft beschikbaar na een niet-beloonde ronde, met correcte beloningsstatus. Claude verbeeldt bevestigde receipts met beperkte gegroepeerde feedback; een animatie verleent geen beloning. Geen zeven-keuzedashboard, extra energie of betaalde herkansing.

**Bestaat/mist:** creator-`games.json` en `server/arcadeServiceV3.ts` stemmen voor Tikduel overeen: eerste drie geldige rondes per UTC-dag ieder 75 stof/20 XP; eerste ronde +100 stof; alleen een werkelijk verslagen eerdere **andere speler** +25 per beloonde ronde. Dat is **325 stof/60 XP zonder menselijke scorebonus**, maximaal **400/60** met drie zulke bonussen. Drie Tikduels duren samen 135 seconden aan speeltijd, exclusief laden/overgangen. Een computerdoel of eigen record mag de spelersbonus niet leveren.

Vanaf nul vraagt alleen de stofcomponent van een level-8-power-up daardoor minimaal twee maximale 400-dagen, of drie 325-dagen; level 20 vraagt respectievelijk zeven of acht. Nectar blijft daarnaast vereist en komt niet uit deze basis-Arcadebeloning. Dit is rekenkundige vergelijking, geen voorspelde speelduur: vangsten, doelen en buddy geven andere bestaande bronnen. Het bevestigt dat Arcade een aanvulling is. Het ontwerp bevat ook 3/10/30-completionmedailles en 500 stof/5 buddyfamilie-nectar na vijf verschillende dagen; volledige medailles, weekclaim, rotatie en zes overige games zijn nog geen voltooide runtime. De eerste Tikduel-replay/receipt-keten is lokaal toegevoegd; hier zijn geen nieuwe spel-/UI-tests uitgevoerd.

## Controlegrens

De officiële pagina's zijn op de controledatum gelezen; oude nieuwsberichten zijn als historische bron benoemd. De lokale vergelijking gebruikt broncode en de huidige `powerCost`-uitvoer, niet een nieuwe productie-/telefoonproef. `game/goV2.ts::goCatchRewards` is de bestaande vangstrewardbron; er is geen apart `rewardsgoV2.ts` aangetroffen. Geen rewardbalans, spelerdata, Claude-bestanden of schermcompositie gewijzigd.
