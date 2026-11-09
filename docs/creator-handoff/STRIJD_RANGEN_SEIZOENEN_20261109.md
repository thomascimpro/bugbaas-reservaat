# Strijd: rangen en seizoenen

Ontwerpvoorstel v1 — 9 november 2026. Niet geïmplementeerd. Bedragen, tegenstanders en puntengrenzen zijn startwaarden voor een speeltest; de rekencontrole hieronder is geen bewijs van definitieve spelbalans.

Dit sluit aan op de voorgestelde onderbalk **Kaart · Bugs · Arcade · Tas**. Strijd wordt een optie binnen de bestaande Arcade. De zeven bestaande minigames blijven behouden; hun scores en ranglijst blijven apart van Strijd.

## 1. Eén begrijpelijke Arena

De speler ziet één Arena-score, één huidige rang en één ranglijst. Eigen bugs, CP, types, aanvallen en held items bepalen het team. Een getal van een oude live-, Echo- of seizoentelling komt niet naast deze score te staan.

**Wijziging ten opzichte van het eerdere voorstel:** vaste computertrainers mogen ook Arena-punten geven. Met minder dan vijf spelers zou de klim anders afhangen van het niveau en de activiteit van een paar anderen. Dit is een Arena-seizoensladder tegen verdedigingsteams en vaste uitdagingen; geen zuivere meting van live PvP-vaardigheid. De app toont dat eerlijk.

- Een echte tegenstander verschijnt als `Bram · opgeslagen team`. De computer bestuurt diens werkelijk opgeslagen bugs; Bram hoeft niet online te zijn. Dit is geen opname van zijn eerdere bewegingen of aangeleerde kopie van zijn speelstijl.
- Een computer verschijnt als `Veldwachter Roos · computertrainer`.
- In de ranglijst staan uitsluitend echte accounts, ook als dat er maar één of vier zijn. Geen opvulling met nepaccounts.
- Er is altijd een direct speelbare computertrainer. Er komt geen wachtrij voor de gewone Vecht-knop.
- De verdediger verliest geen punten, spullen of bugs doordat iemand hem verslaat terwijl hij afwezig is. Alleen de actieve speler krijgt een uitslag voor zijn Arena-score.

## 2. Acht rangen, 22 stappen

Iedereen begint het eerste nieuwe Arena-seizoen op **1.000 punten, Brons I**. De ondergrens is 1.000. Iedere hoofdrang behalve Master heeft drie stappen: **I → II → III**. Iedere stap is 50 punten. Na III volgt de volgende hoofdrang. Master heeft geen onderverdeling; daar blijf je punten verzamelen.

| Rang | Punten | I / II / III beginnen op | Beeldtaal |
|---|---:|---|---|
| Brons | 1.000–1.149 | 1.000 / 1.050 / 1.100 | Koper/brons, eenvoudige medaille |
| Zilver | 1.150–1.299 | 1.150 / 1.200 / 1.250 | Zilver, koel licht |
| Goud | 1.300–1.449 | 1.300 / 1.350 / 1.400 | Goud, bredere rand |
| Platina | 1.450–1.599 | 1.450 / 1.500 / 1.550 | Cyaan/platina |
| Diamant | 1.600–1.749 | 1.600 / 1.650 / 1.700 | Blauw kristal |
| Elite | 1.750–1.899 | 1.750 / 1.800 / 1.850 | Paars, gevleugelde medaille |
| Kampioen | 1.900–2.049 | 1.900 / 1.950 / 2.000 | Rood/goud, kroonaccent |
| Master | 2.050+ | Geen stappen | Wit/goud met rustige glinstering |

Voorbeeld: **Goud II · 1.370 punten**. De balk toont `Nog 30 naar Goud III`; de volgende hoofdrang is Platina bij 1.450. Stapnummers worden als tekst boven dezelfde medaille getekend; geen 22 aparte illustraties nodig.

Je actuele rang kan zakken na verliezen. Je hoogste behaalde seizoensrang blijft vaststaan voor de seizoensbeloning. Afwezigheid veroorzaakt geen dagelijkse puntenaftrek.

## 3. Punten en tegenstanders

Voor een geteld duel gebruiken we dezelfde formule tegen een opgeslagen spelersteam en een vaste computertrainer:

`verwachte winst = 1 / (1 + 10 ^ ((tegenstanderscore - eigen score) / 400))`

`wijziging = afronden(40 × (uitslag - verwachte winst))`

Uitslag is 1 bij winst, 0,5 bij gelijkspel en 0 bij verlies. De score daalt nooit onder 1.000. Bij een gelijkspel tegen een gelijke tegenstander verandert niets; tegen een veel sterkere of zwakkere kan een kleine correctie optreden.

| Tegenstander | Winst | Verlies |
|---|---:|---:|
| 200 punten lager | +10 | −30 |
| Ongeveer gelijk | +20 | −20 |
| 200 punten hoger | +30 | −10 |

Dit is een Elo-achtige berekening voor de actieve speler; door vaste computerijkpunten en afwezige verdedigers is de totale spelersscore niet nul-som. Daarom noemt de app dit **Arena-punten**, niet live-Elo.

### Eerlijke selectie

- Voor de eerste uitvoering is er één competitieve CP-klasse: **maximaal 1.500 CP per bug**. Zo verdelen vijf spelers zich niet ook nog over drie ladders. De andere bestaande CP-klassen kunnen voor oefenen/vriendenduels blijven bestaan. Master is een rang, geen CP-klasse.
- Drie verschillende eigen soorten. Geen gratis vervanging van IV's, aanvallen of held items door perfecte stats. Uitgeruste items tellen mee in de geldige CP en moeten werkelijk in bezit zijn.
- Het systeem zoekt eerst een geldig spelersteam binnen ongeveer 200 Arena-punten en 25% verschil in totale team-CP. Anders wordt een passende vaste computertrainer gebruikt.
- De server kiest; geen knop om dezelfde aangeboden tegenstander steeds opnieuw te rollen. Het aanbod blijft bewaard tot je speelt of het vastgelegde aanbod verloopt.
- Teamkeuze en tegenstandergegevens worden bij de gevechtsstart vastgezet. Latere upgrades veranderen een begonnen gevecht niet.

### Begrenzing zonder extra muntsoort

- De eerste **vijf getelde Arena-duels per UTC-dag** geven punten en de gewone duelbeloning. De app toont alleen `3/5 gespeeld`; er zijn geen koopbare rangtickets.
- Dezelfde tegenstander telt die dag één keer. Opnieuw opslaan of van team wisselen maakt van hetzelfde account geen nieuwe tegenstander. Bij computertrainers geldt dit per vaste traineruitvoering.
- Er staan voldoende verschillende computertrainers klaar om ook zonder andere spelers vijf geldige duels te kunnen spelen.
- Daarna kan de speler onbeperkt oefenen. Oefenen verandert geen Arena-punten en geeft geen herhaalde dueluitbetaling.
- Een rechtstreeks vriendenduel is vriendschappelijk. Het kan geen punten tussen twee afgesproken accounts verplaatsen.
- Bewust opgeven telt als verlies. Bij een verloren netwerkantwoord wordt dezelfde serveruitslag hersteld; de client rekent niet zelf winst, punten of loot af.

## 4. Vaste computertrainers: ook solo een echte klim

We starten met vijf herkenbare teamstijlen per hoofdrang: snel opladen, verdediging, zware aanvallen, types combineren en een gebalanceerd team. Dat zijn **40 teamtemplates**, opgebouwd uit bestaande bugs, moves en items. De speler krijgt één tegenstander aangeboden, geen extra keuzemenu met 40 trainers.

Beginwaarden voor de teamsterkte per bug: Brons ongeveer 350 CP, Zilver 650, Goud 950, Platina 1.200, Diamant 1.400, Elite 1.450, Kampioen 1.490 en Master maximaal 1.500. De uiteindelijke CP volgt de echte stats van het gekozen exemplaar. Dit zijn ontwerpranges, geen opgeplakte CP-getallen.

De referentiescore van een trainer ligt rond het midden van zijn rang; Mastertrainers kunnen bijvoorbeeld 2.200 hebben. Die score wordt vóór het seizoen vastgelegd en verandert niet ongemerkt op basis van jouw recente uitslagen.

- Een trainerteam groeit niet automatisch mee zodra jij een bug verbetert. Je merkt dus dat je een eerder moeilijke trainer makkelijker verslaat.
- Bij de hoge rangen komt de uitdaging uit betere typekeuzes, held items, energiegebruik en wisselmomenten. Gewone verkrijgbare bugs moeten een werkend antwoord kunnen vormen; een Oerbug is niet verplicht.
- De computer gebruikt dezelfde energieopbouw, aanvalswachttijden en aantallen ontwijkingen als de speler. Geen gratis opgeladen aanvallen of verborgen HP-bonus voor gewone Arena-trainers.
- De AI gebruikt zichtbare gevechtsinformatie, geen verborgen invoer van de speler. Reacties op een waarschuwing zijn niet onmiddellijk; voorstel minimaal 250 ms.
- Een zwakke trainer farmen geeft bij een groot puntenverschil vrijwel geen punten. Hogere rangen vragen uiteindelijk sterkere tegenstanders.

De precieze referentiescores en AI-keuzes moeten met gespeelde duels worden gekalibreerd. De huidige vijf Echo-NPC's allemaal een andere rangnaam geven is onvoldoende.

## 5. Seizoen: één kalendermaand

- Een seizoen loopt van de eerste dag 00:00 UTC tot de eerste dag van de volgende maand. De app toont dit als lokale tijd en vooral als `Eindigt over 12 dagen`.
- Voor een seizoenpakket: minstens **vijf getelde duels en één winst**. Computertrainers tellen mee; er is geen minimumaantal andere spelers nodig.
- Het pakket hoort bij de **hoogste behaalde hoofdrang** van dat seizoen, niet bij je plek in de kleine spelersranglijst.
- Je ontvangt één pakket van die rang. De pakketten van lagere rangen worden niet opgeteld.
- Je bewaart je medaille, seizoenhistorie, bugs, IV's, shiny's, upgrades, items, trainerlevel en alle andere voortgang.
- Een nieuw seizoen trekt alleen de Arena-score gedeeltelijk terug: `1.000 + vloer((eindscore − 1.000) / 2)`, met een nieuwe startscore tussen 1.000 en 1.600. Voorbeeld: 2.050 wordt 1.525. Sterke spelers behouden een voorsprong, maar beginnen niet meteen opnieuw in Master.
- De nieuwe actuele rang volgt de teruggezette score. De oude seizoensmedaille blijft beschikbaar om te tonen.

## 6. Concrete seizoenspakketten

| Hoogste rang | Stof | Bosnetten | Gewone TMs |
|---|---:|---:|---:|
| Brons | 500 | 5 | 0 |
| Zilver | 1.000 | 8 | 1 |
| Goud | 2.000 | 12 | 1 |
| Platina | 3.000 | 15 | 2 |
| Diamant | 4.500 | 20 | 2 |
| Elite | 6.000 | 25 | 3 |
| Kampioen | 8.000 | 30 | 3 |
| Master | 10.000 | 40 | 4 |

Aanvullingen bij het pakket:

- **Alle rangen:** een blijvende medaille met seizoen en hoogste rang, plus een bijpassende profielrand. Eén gekozen medaille kan bij je avatar worden getoond.
- **Goud en hoger:** één gewone 5 km-cocon uit de bestaande pool. Je moet hem zelf uitlopen. Bij een volle coconvoorraad wordt hij automatisch vervangen door 1.000 stof, zoals de bestaande beloningsafhandeling al ondersteunt.
- **Platina en hoger:** één vooraf aangekondigd held item uit de bestaande collectie. Bijvoorbeeld dit seizoen een Doorn; het item is voor alle geschikte spelers hetzelfde en blijft ook buiten seizoenen verkrijgbaar.
- **Master:** een subtiele geanimeerde uitvoering van de seizoensmedaille/profielrand. Met weinig beweging aan wordt dezelfde art statisch getoond.

TMs hebben de bestaande werking. Ieder paar bevat één snelle en één opgeladen TM. Een overblijvende TM is 50/50 snel of opgeladen, met een vaste serverkeuze per account en seizoen; heropenen verandert de uitkomst niet. Er komen geen nieuwe Elite-TMs of lootboxmunten bij.

Er zitten geen exclusieve bugsoorten, gegarandeerde perfecte IV's, gegarandeerde shiny's of extra gevechtsstats achter Master. Collectievoltooiing blijft mogelijk voor iemand die lager eindigt.

### Kleine beloningen onderweg

- Een tussenstap, bijvoorbeeld Goud I→II: korte medaillereactie en de puntentoename in de uitslag; geen losse popup of extra lootdoos.
- De eerste keer dat je in het seizoen een hogere hoofdrang bereikt: 100 stof extra. Terugzakken en opnieuw stijgen betaalt dit niet opnieuw. De startpositie na een seizoensreset geeft geen automatische promotiebeloningen.
- De bestaande directe Echo-duelbedragen blijven het uitgangspunt: een beloonde winst 150 stof/100 XP; verlies 50 stof. Een gelijkspel gebruikt de bestaande niet-gewonnen vergoeding. De daglimiet blijft vijf geldige unieke tegenstanders. Oude losse beloningspaden mogen niet ongemerkt op hetzelfde nieuwe duel dubbel uitbetalen.

Master levert daardoor hoogstens 11.700 stof uit dit seizoensontwerp op: 10.000 pakket, maximaal 700 promotiestof en eventueel 1.000 voor een volle coconvoorraad. Gewone duel-, vang- en andere bestaande spelbeloningen staan daar los van.

## 7. Waarom deze startbedragen

In de huidige economie kost de goedkoopste tweede opgeladen aanval 10.000 stof plus 25 soortnectar; sterkere families kosten meer. Een gewone basisvangst geeft 100 stof zonder extra bonussen. Het Masterpakket is daarmee ongeveer de stof voor één goedkoop tweede-aanvalslot of 100 basisvangsten, niet een compleet maximaal team.

Rekenvoorbeeld bij 100 duels tegen steeds ongeveer gelijke scores, zonder de Brons-ondergrens of veranderingen in tegenstand mee te rekenen:

| Winstpercentage | Netto verandering |
|---|---:|
| 50% | 0 punten |
| 60% | +400 punten |
| 70% | +800 punten |
| 80% | +1.200 punten |

Van 1.000 naar Master 2.050 is bij +20/−20 minstens 53 meer overwinningen dan verliezen. Met alleen zwakke trainers wordt de winst per duel kleiner; de tabel is dus geen voorspelling dat een speler na een vast aantal games Master krijgt. Teamontwikkeling, echte matchups en gespeelde proeven moeten de bereikbaarheid bepalen.

## 8. Eén rustig Strijd-scherm

De inhoud blijft op één pagina binnen Arcade:

1. Eigen medaille, bijvoorbeeld `Goud II · 1.370`, balk naar de volgende stap en seizoenseindteller.
2. Acht medailles in twee rijen van vier. Tik op een medaille voor puntengrenzen en de iconen/bedragen van dat seizoenpakket. Eigen rang en hoogste bereikte rang zijn herkenbaar.
3. Jouw drie bugs met CP en type; Team kiezen opent de voorgestelde Bugs→Team-tab.
4. Eén duidelijke **Vecht**-knop en de dagteller, bijvoorbeeld `3/5 gespeeld`.
5. De echte spelersranglijst: top vijf, plus je eigen rij wanneer je erbuiten valt. Met vier spelers staan alle vier zichtbaar; gelijke scores krijgen een gedeelde plek. Computernamen komen hier niet in.
6. Een kleine knop **Seizoen** voor je verdiende pakket, geschiedenis en hoeveel geldige duels nog ontbreken voor deelname.

De Vecht-knop blijft op kleine schermen bereikbaar boven de algemene onderbalk; de inhoud mag kort scrollen wanneer nodig. Geen tekst of plaatjes half achter de navigatie. Een compleet rangoverzicht hoeft geen tweede hoofdtab te worden.

Een seizoenswisseling geeft bij de eerstvolgende geschikte terugkeer één compact overzicht: oude seizoenmedaille, hoogste rang, ontvangen iconen/bedragen, nieuwe startscore en **Verder**. Niet midden in vangen, een raid of Arcade. De server keert één keer uit; de popup toont de al bevestigde ontvangst. Afwezigheid gedurende meerdere lege seizoenen maakt geen extra pakketten aan.

## 9. Bestaande app veilig aansluiten

- Dit vervangt de verschillende zichtbare Strijd-puntentellingen; de Arcade-minigameranglijst blijft zelfstandig.
- Bij invoering aan het begin van een nieuw seizoen starten alle deelnemers op 1.000. Oude rangrecords en verdiende badges worden als historie behouden. Er wordt geen account, collectie of database gereset.
- De geldige verdediging wordt automatisch bijgewerkt wanneer een speler zijn team, moves, item of upgrades verandert. Per account/CP-klasse is er één actieve verdediging. Een offline eigenaar hoeft niet elke dag opnieuw een team te publiceren.
- De server bewaart de aangeboden tegenstander, beide puntenscores bij aanvang, teamkopieën, uitslag, promoties en beloningsontvangst. Herhalen of herverbinden maakt geen tweede afrekening.
- Een seizoenseindafrekening heeft een vaste sleutel per account/seizoen. Grenzen, daglimieten en tijd komen van de server.
- Oude clients moeten via de bestaande updatevoorziening worden tegengehouden als ze de nieuwe rang-/beloningsregels niet veilig kunnen gebruiken.
- Beoordeel daarvoor ook de nog actieve oudere API-deployments: bestaande APK's bevatten een eigen backend-URL. Alleen een minimumversie op de nieuwste backend instellen voorkomt geen oude beloningsafrekening via een oudere URL. De vrijgave moet dit oplossen voordat twee verschillende afrekeningen op dezelfde accounts kunnen werken.

## 10. Bouwonderdelen en noodzakelijke controles

| Onderdeel | Werk |
|---|---|
| Rangregels | Centrale acht-rangentabel, stapberekening, puntencorrectie, hoogste rang en gedeeltelijke reset; bestaande `pvpV2`/Echo-regels samenbrengen |
| Server | Eén Arena-afrekening, tegenstanderkeuze, vijf-daglimiet, herhaalbescherming en seizoensontvangst; geen nieuwe backenddienst |
| Tegenstanders | 40 legale teamtemplates en controle van energie, cooldowns, typegebruik en reactietijden |
| Schermen | Huidig rangkaartje, medailles en spelerslijst aanpassen; Strijd onder de voorgestelde Arcade-ingang |
| Beelden | Acht medailleontwerpen; bestaande Brons/Zilver/Goud/Platina/Kampioen-art beoordelen/hergebruiken, Diamant/Elite/Master toevoegen; één seizoenrand, rustige Master-glinstering en grijze vergrendelde weergaven |
| Integratie | Bestaande beloningsiconen, coconlimiet, itemvoorraad, bewegingsinstelling en updatepoort gebruiken |

Voor vrijgave gericht bewijzen:

1. Alle rang- en stapgrenzen, waaronder 1.149→1.150 en 2.049→2.050, geven dezelfde naam in server, uitslag en profiel.
2. De drie voorbeeldpuntenberekeningen kloppen; computer en opgeslagen team gebruiken dezelfde formule en legale gevechtsregels.
3. Met één account en zonder andere spelers starten vijf verschillende tellende duels; de zesde is duidelijk oefenen. Met vier accounts worden geen fictieve spelers aan de ranglijst toegevoegd.
4. Een hogere rang behalen, zakken en herhalen betaalt de promotie niet dubbel; hoogste rang blijft het juiste seizoenpakket bepalen.
5. Een verloren antwoord, herhaald claimverzoek, appherstart en maandgrens betalen elk seizoen maximaal één keer uit. Geen beloning voor seizoenen zonder deelname.
6. Volle coconvoorraad, even/oneven aantallen TMs, maanditem en de maximale stofbedragen worden juist verwerkt.
7. Achterlaten en later opnieuw openen verandert geen IV's, CP, bugs, held items, legacybadge of oude ranghistorie.
8. 320×568 en 430×932: medailles en echte spelersnamen leesbaar, Vecht bereikbaar, geen overlap met de onderbalk, resultaat/seizoenoverzicht kort en sluitbaar.

Daarna moet een echte speelproef uitwijzen of de vaste trainerteams en dagelijkse klim goed voelen. Pas dan zijn de voorgestelde grenswaarden en beloningen afgetekend als spelbalans.

## Bronnen en eigen keuzes

[Pokémon GO's officiële uitleg](https://scopelyexplore.helpshift.com/hc/en/5-pokemon-go/faq/1156-go-battle-league/?hl=en) onderbouwt het patroon van herhaalbare duelbeloningen, seizoenen, rangvoortgang en betere seizoensbeloningen bij hogere rangen. Daar tellen computertraining en vriendenduels niet voor de GO Battle League-rang; onze vaste computerijkpunten zijn dus een bewuste eigen aanpassing voor de kleine spelersgroep, geen letterlijke kopie van dat rankingsysteem.

[Riot's officiële uitleg van ranked-beloningen](https://support.riotgames.com/en-us/league-of-legends/rewards/ranked-years-seasons-and-end-of-season-rewards) laat zien hoe rangmedailles en profiel-/laadschermranden spelers hun rang laten tonen. Het kalendermaandritme, de hoogste-ranggarantie en alle cijfers in dit voorstel zijn eigen BugBaas-keuzes, niet bedragen of regels die we uit League of Legends overnemen.

De huidige BugBaas-code is de bron voor de stofkosten, bestaande vijf-rangentabel, Echo-beloningen, items, CP-klassen en behoud van spelergegevens. Dit document wijzigt die spelcode nog niet.
