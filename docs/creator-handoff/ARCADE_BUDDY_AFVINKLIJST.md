# Arcade, kaart en buddy — afvinklijst 5 november 2026

Opdracht na0.1.31, opgenomen in0.1.32 op gebruikersverzoek. Bestaande accounts, vangsten, levels, spelphysics, tickets en beloningslimieten behouden.

## Onderzoek en keuzes

- [x] Huidige oorspronkelijke games en helpers gelezen; geen nieuwe remakes.
- [x] Buddy-activiteiten bij Pokémon GO nagezocht: daghartjes voor lopen, voeren, enkele seconden aaien en samen spelen/vechten. Herhalen van een volle categorie geeft geen extra hartjes.
- [x] Motivatieonderzoek gelezen: begrijpelijke besturing, merkbaar beter worden en keuzevrijheid ondersteunen plezier. Dit bewijst geen toekomstige retentie van BugBaas.
- [x] Spelen: swipe links/rechts door zeven kaarten, één Speel-knop; ook pijlen voor toetsenbord/toegankelijkheid. De gekozen game geeft de bestaande dagbeloning. Spellen/Oefen-keuzescherm verwijderen. Ranked blijft willekeurig met identieke game/seed/regels voor beide spelers.
- [x] Scores horen bij de gekozen game; bestaande start- en replaytickets blijven geldig.
- [x] Echte bronzen/zilveren/gouden medailleafbeeldingen, met zichtbare voortgang naar3/10/30 gespeelde rondes.
- [x] Terug/info volledig binnen de knoppen, vaste44–48px-tikvlakken en geen overlappende HUD.
- [x] Kaartinhoud krijgt werkelijk ruimte boven de onderste navigatie; kaartbediening verdwijnt achter een geopend menu.2D-knop verwijderen.
- [x] Buddy: één aaihart per dag via een korte echte aai-gesture; voeren met een wachttijd; hartjes voor geverifieerde loopafstand en een geldige samen gespeelde game/gevecht. Per dag begrensd; buddy wisselen reset de daglimieten niet.
- [x] Per game de bestaande echte squadbonus tonen via één klein hulpmoment/infoknop. Geen gratis scoremultiplier.
- [x] Mobiele achtergronden: beeldverhouding behouden en lege zij-/bovenstroken passend vullen, zonder physics of raakvlakken uit te rekken.
- [x] Gerichte bestaande tests, TypeScript en browsercontrole op klein/groot mobiel formaat; afvinken na bewijs.

## Wat de huidige games draagt en welke hulp blijft

| Game | Vaardigheid en feedback die behouden blijven | Bestaande squadsteun |
|---|---|---|
| Tikduel | Bewegende zeldzame doelen met meerdere tikken, korte combos en helpers | Helpers met eigen type; begrensd ruimere doelen en meer richttijd |
| Nestwacht | Torenplaatsing/keuze, upgrades, golven, spray/web en handmatige combo’s | Iets meer bouwgeld/nestleven, torenschade en herlaadhulp |
| Webrenner | Baan kiezen, springen, combo’s, schilden/magneet/boost | Botsmarge, langere magneet, startschil bij voldoende verdediging |
| Windvlucht | Ritmisch sturen, pickups verzamelen en obstakels ontwijken | Kleine lifthulp, pickupmarge, langer schild en eventueel één extra hart |
| Vlinderjacht |360° volgen, focus vullen en netslag timen | Vangzone maximaal14% groter |
| Bladtoren | Sprong opladen, landen/salto-combo, coins/veren/raket | Landingsmarge maximaal14%, maximaal60ms extra springmarge |
| Bubbelzwerm | Richten/banken, kleurcombinaties en hele groepen laten vallen | Langere richtlijn, iets tragere druk en langere Freeze |

Beloningen blijven serverbevestigd: eerste drie geldige rondes/dag, record, medaillevoortgang en weekdoel. Swipen of alleen op Speel drukken geeft geen grondstoffen.

Bronnen: [Pokémon GO Buddy Adventure](https://scopelyexplore.helpshift.com/hc/en/5-pokemon-go/faq/1131-buddy-adventure/), [officiële buddy-uitleg](https://www.pokemon.com/us/features/tips-to-make-the-most-of-buddy-adventure-in-pokemon-go), [Ryan/Rigby/Przybylski2006](https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf).


## Afgerond en gecontroleerd — 5 november

- Alle zeven spellen handmatig kiesbaar met swipe/sleep en pijlen. Speel blijft boven de navigatie staan; Spellen/Oefen heeft geen nieuwe ingang meer. Oud uitgegeven oefentickets blijven geldig. Scores worden pas bij openen opgehaald voor het gekozen spel; swipen maakt geen serververzoek.
- Alle16 bedieningspictogrammen uit de bestaande atlas hebben een transparant afgemeten, gecentreerde uitsnede; de importer bewaart dit bij herimport. Echt bronzen/zilveren/gouden beeld bij de bestaande3/10/30-medaillegrenzen.
- Twee mobiele fouten hersteld: spelkaarten hadden op web geen vaste hoogte; browserfocus kon bovendien de verborgen Arcade-laag verschuiven. De kaart houdt nu zijn formaat, de spelcanvas schaalt zonder vervorming en de buitenlaag kan op web niet meer onzichtbaar scrollen. Timer/score/terug blijven binnen het scherm.
- De kaart eindigt72px boven de navigatie. Menu open: GPS-, zoom-, vang- en kaartmarkerbediening zijn verborgen/geblokkeerd, ook voor toegankelijkheid. De2D-knop is weg.
- Buddy: twee seconden heen en weer aaien voor1hart/dag; voer kost1bosframboos, maximaal3/dag met3uur tussen voedingen. Gevalideerde kilometers blijven nectar/stof geven met maximaal10loophartjes/dag. Een gekwalificeerde Arcade-ronde of afgerond actief gevecht met je buddy in de bevroren squad geeft1samenhart/dag. Ook een geldig gespeelde nederlaag telt. Oefenen/afbreken/alleen wachten geeft geen samenhart; wisselen of herhalen reset geen daglimiet. Volle categorie wordt grijs; de voerknop toont de resterende tijd.
- De zeven echte bestaande squadbonussen zijn zichtbaar; oorspronkelijke physics, combos, power-ups, CP-klassen en serverreplay zijn behouden. Geen scoremultiplier of extra grondstoffenbron toegevoegd.

**Bewijs:**682/682 tests groen, TypeScript zonder fouten, API-bundel en definitieve webexport geslaagd. Gerichte tests bewijzen gekozen spel/score/reward, oude rotatie, willekeurige ranked, eenmalige reward/hartjes, voerwachttijd over middernacht en bescherming tegen buddywissel. Browser met eigen tijdelijke geheugen-database: swipe in beide richtingen, alle zeven kaarten plus rondlopende pijlen; zeven games gestart/gestopt op320×568 en430×932; schermgrenzen gemeten, medailles bekeken, kaartmenu bediend, aaihart1/1 en voer1/3 + wachttijd bevestigd. Stilstaande ongekwalificeerde rondes geven geen samenhart. Bewijsbeelden in `.local/arcade-buddy-20261105/`, logs `.local/arcade-buddy-*.log`.

**Release0.1.32:** zichtbare naam bugbaas, code33; definitieve APK als update in de Android15-emulator getest. Bestaande vijf bugs/level21 behouden, swipen in beide richtingen, gekozen Webrenner en uitslag, medailles, kaartmenu, collectie, aaien1/1 en voeren1/3 met180min wachttijd bevestigd. Achtergrond/terug bedienbaar, geen nieuwe crashlogregels. Details en checksum: `../releases/0.1.32.md`. Geen fysieke buitenwandel-/Health Connect-/accuproef; synthetische locatie is geen bewijs daarvan. Niet alle games zijn in deze ronde volledig door een mens uitgespeeld.
