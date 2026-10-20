# Start hier — BugBaas PoGo UI / Bugdex / FO / TO

**VERPLICHT BIJ ELKE NIEUWE PROJECTCHAT: lees [../AGENTS.md](../AGENTS.md), daarna de [actuele checkpoint in het werkregister](POGO_WERKREGISTER.md).** Sla afgeronde stappen over; voer geen Git-commando's op de bovenliggende gebruikersrepository uit.

Onderzoek en klikbare schetsen van 19 oktober 2026. Uitvoering gestart op 20 oktober: [historische uitvoering en testbewijs](POGO_UITVOERING.md). De onderstaande ontwerpen zijn geen bewijs dat een functie al gebouwd of uitgebracht is.

**Vanaf 20 oktober: [CENTRAAL WERKREGISTER](POGO_WERKREGISTER.md)** (wat gebouwd, door wie, welke test, wat nog open), [optionele testmatrix](POGO_TESTMATRIX.md) (wanneer resultaten hergebruiken) en [eenvoudig werkplan](superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md). **Begin bij het werkregister, niet bij het oorspronkelijke FO/TO alsof de app nog niet gebouwd is.**

1. [Visuele audit per scherm](POGO_VISUELE_AUDIT_20261019.md) — bevindingen en schermnummers 01–28, met werkelijke QA-screenshots.
2. [Functioneel Ontwerp](POGO_FO_20261019.md) — 18 schermen, navigatie, Bugdex #001–#021, evoluties en acceptatiecriteria.
3. [Technisch Ontwerp + 3D/sprite-pijplijn](POGO_TO_ASSETS_20261019.md) — codearchitectuur, native GPS, MapLibre, data/POI/route, testen, bron en licenties.
4. [Interactieve visuele wireframes](POGO_SCHERMSCHETSEN_20261019.html) — openen in Chrome/Edge vanuit deze map. Links schermkeuze, midden ontwerp, rechts de *echte* huidige BugBaas-screenshot.

## Screenshotbewijs
QA screenshots + rapport in **`../../bugbaas-pogo-design-audit/`** (relatief t.o.v. deze docs-map):
- `report.json`: 28 screen-checkpoints/screenshotopnames, geen pageerrors, geen asset 404, geen horizontale overflow (lokale QA).
- `wireframe-report.json`: 17 wireframe-schermen, 21 genummerde Dex-items, alle afbeeldingen geladen en responsive.
- `wireframe-map.png`, `wireframe-dex.png`, `wireframe-evolution.png` en overige conceptschermen om snel te vergelijken.
- De testscript-bronnen: `../.local/pogo-design-browser-audit.py` en `../.local/pogo-design-wireframe-check.py`.

## Oorspronkelijke beslissingen vóór bouwen (19 oktober)
1. **Behoud de 21 gevangen soorten en eigendomsdata.**
2. **Corrigeer rups → mot visueel:** rups gebruikt nu een *keverlarve* GLB; onjuiste metamorfosebeeld.
3. **Bugdex tonen als #001–021, Seen/Caught/Shiny gescheiden, 1 bestaande evolutie.**
4. **Gebruik lokaal Gobkit CC0 Vol.1:** 30 GLB, 21 actief, 9 nog niet; eerst 9 toevoegen met 18 extra WebP-portretten uit exact dezelfde pipeline, daarna pas andere stijlbronnen.
5. **Begin met native GPS-kaart en kaartinteracties** (P0/P1). Nieuwe locaties/routebeloningen vereisen servervalidatie, veilige POI-data en licentiecheck.
6. **Herinricht lege profiel/onderzoek/vrienden/menu-schermen** met bestaande gegevens, niet met verzonnen content.

## Beperking
Pokémon GO referenties betreffen publieke screenshots/documentatie, niet een live audit van de op 19-10-2026 geïnstalleerde Pokémon GO-app. BugBaas webbrowser is wel live lokaal getest; echte Android GPS/accu/FPS niet.

### Oorspronkelijke oplevering (19 oktober)
Deze ontwerpoplevering wijzigde nog geen gameplay. De uitvoering van 20 oktober en actueel testbewijs staan in [POGO_UITVOERING.md](POGO_UITVOERING.md). Er is geen productie/Firestore/GitHub/Vercel release of reset van bestaande spelerdata uitgevoerd.
