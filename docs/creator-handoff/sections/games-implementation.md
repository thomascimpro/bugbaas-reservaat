# Arcade — uitvoering van de zes overige games

3 november 2026. Bestanden: `game/arcade/games.ts`, `src/arcade/ArcadeFieldV3.tsx`, `tests/arcadeGamesV3.test.ts`. Geen server-, navigatie-, account-, collectie- of assetbestanden door deze taak aangepast.

Alle zeven games gebruiken dezelfde lokale 20ms-simulatie en serverreplay-dispatcher. Ontbrekende `ticket.game` blijft het bestaande strikte `tap-1`-pad; expliciete Tikduel-tickets mogen ook `action: down` aanbieden, met dezelfde 450-invoer-/100ms-grenzen. Nieuwe regels zijn `<game-id>-1`.

| Game | Werkende regels en presentatie |
| --- | --- |
| Webrenner | Drie banen, vaste nectar/webpatronen, één baan per veeg/pijl, 160ms-stuurcooldown, drie harten, 800ms-onkwetsbaarheid, begrensde pickup-/stuurmarge. |
| Nestwacht | Drie nestharten, echte roterende squadschutters/moves/type-schade/cooldowns, zaadgebonden vijanden en 420px/s-projectielen naar uitsluitend hun eigen doel. |
| Windvlucht | Vasthouden stijgt; loslaten daalt. Vaste brede bladpoorten, begrensde poortverschuiving, nectar, harten en terugplaatsing na een botsing. |
| Vlinderjacht | Sleepnet met 900px/s-limiet, sinusbeweging uit seed, 100ms onafgebroken overlap, zichtbare wespenwaarschuwing, drie harten en geen wesppunten. |
| Bladtoren | Automatische fysische sprongen, haalbare bladposities, camera, drie harten, laatste veilige blad en uitsluitend nieuwe verdiepingen/eenmalige nectar als score. |
| Bubbelzwerm | Vast hex-beginbord van 40 bubbels zonder startgroep van drie, bewezen oplosbare eerste zet, één projectiel/één kaats, matches/losse groepen, vijf missers laten het bord zakken, directe `board_clear` of ondergrensverlies. Geen tweede bord. |

Niet-combathulp gebruikt de echte squadstat-sommen met de vaste deler drie en klasse-referenties; de beschreven procentbonussen zijn maximaal 14%. Nestwacht en Tikduel houden hun echte aanvallen en moves. CP wordt nergens nogmaals vermenigvuldigd. Tickets worden door spelen/replay niet gewijzigd.

Het speelveld behoudt bestaande Tikduel-art en gebruikt voor de andere games de bestaande bugfiguren, HD-vlinders/wespen, nectar-/type-iconen en bestaande kleuren. Native respondergebaren en webpijlen/Space zijn aangesloten. Drag wordt per 60ms bemonsterd; de invoerlog blijft maximaal 1200 gebeurtenissen en lokaal onder 65.000 bytes. Replay controleert ook onbekende velden, bounds, volgorde, eindtijd en de 65.536-byte-grens. Geldigheid telt werkelijke geaccepteerde acties. Een bewezen leeggespeeld bord met minimaal één geaccepteerd schot heeft de overeengekomen objective-uitzondering.

**Gecontroleerd:** 14 gerichte tests groen: alle zes lokale eindstaten gelijk aan hun serverreplay, tickets onveranderd, helperplafonds, stuur-/movecooldowns, doelgebonden projectielen, nettempo/overlap/wespen, unieke torenpunten, 200 beginbordseeds en hun eerste geldige match. Een volledige echte seed-0-replay leegt het bord na 2007 ticks (40,14s), 34 schoten en 575 punten; het bord blijft daarna leeg en late invoer wordt afgewezen. Finale TypeScriptcontrole groen op het gecontroleerde integratiemoment.

**Bewijsgrens:** dit is simulator- en compilebewijs. De geïntegreerde browsercontrole wordt door de hoofdtaak gedaan; native toestelgebaren, menselijke moeilijkheid/balans en visuele kwaliteit zijn hiermee niet op een telefoon bewezen. De gezamenlijk uitgevoerde oudere Arcade-servicetests hadden 9/10 groen; de toenmalige mislukking was `echoTeamIssue is not a function` tijdens parallelle combat-integratie, buiten deze bestanden.
