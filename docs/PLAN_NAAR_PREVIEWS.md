> **Vervangen op 3 nov 2026** door `docs/creator-handoff/PLAN.md` (Codex, leidend) en `docs/creator-handoff/START_HIER.md`. Alleen nog historisch.

# Plan: de hele app zoals Codex' previews (met animaties)

Doel van de gebruiker (3 nov): de app (behalve de kaart) ziet er volledig uit als de beeldborden in Codex' creatorpakket
`../bugbaas-creatorpakket-20261102/previews/P00–P24.png`, inclusief animaties. De kaart blijft eigen werk: mooi, rustig, PoGO-achtig.
Leidend: `START_HIER.md`, `02_SCHERMEN.md` (schermcontracten), `03_TECHNISCH.md` (klok/input/prestatie/animatie), `04_ASSETS.md`, `build-tasks-final.json` (B01–B18).

## Het doelbeeld in één zin
Volle HD-natuurscène als achtergrond, donkere teal-glaspanelen met dunne lichte rand, cyaan pilknoppen voor de hoofdactie, foto-echte HD-insecten, vaste onderbalk **Kaart · Arcade · Bugs · Strijd**, minimale tekst (iconen + getallen), en alles beweegt: idle-bob, uitval, treffers, trails, sparkles, beloningen die naar de teller vliegen.

## Taakverdeling (voorstel, zie ook `docs/SAMENWERKING.md`)
| Blok | Wat | Wie |
|---|---|---|
| B01 | Gedeelde look + navigatie (glas-tokens, onderbalk, kop, knoppen) | Codex levert tokens/art; **Claude** zet `src/PogoUiV2.tsx` om naar de glas-look zodat al omgebouwde schermen meteen meegaan |
| B02/B03 | Arcade-klok (50 ticks/s, xorshift32), input, simulatie, tickets/score/receipts | **Claude** |
| B04–B08 | Zeven spellen: Tikduel, Nestwacht, Bubbelzwerm, Windvlucht, Webrenner, Vlinderjacht, Bladtoren — spel, beweging, effecten | **Claude** |
| B09 | Eén "Speel" + dagrotatie (Arcade-hub, P01-v2/P22/P12) | Claude (hub-UI volgens preview) |
| B10 | Nieuw actieduel: tik/richt, veeg-ontwijk, directe charge, treffers, uitslag (P00/P18) | **Claude** (gameplay + animatie); Codex levert gevechtsachtergronden |
| B13 | Kaart + vangstpresentatie (P01-v2/P03/P17) | **Claude** |
| B11 | Plaagbende-ontmoetingen (P23/P24) | Codex (schermen) + Claude (het spelletje/animatie) |
| B12 | Collectie, team, upgrades, evolutie (P04/P05/P19/P17) | Codex (schermen in glas-look); Claude zorgt dat bugdetail/multi-power-up dezelfde componenten gebruikt |
| B14–B17 | Wandelen/buddy/cocons/terugkomst, gyms/raids, vrienden/ruilen, audio/instellingen/economie | Codex (schermen); Claude levert 3D (gym, cocon, post) en animaties |
| 3D | Bug-animaties (idle/loop/vlieg/aanval/hit/dood), kaartobjecten, natuur, HD-renders | **Claude** |
| B18 | Integratie + kandidaat-APK | Samen, Claude voert uit na akkoord gebruiker |

## Animatieplan (Claude)
Regels: `requestAnimationFrame`, geen React-state per frame, HUD ≤10 updates/s, 60/30 fps met interpolatie, "minder beweging"-instelling respecteren, max. 1 impactgeluid per 80 ms (03_TECHNISCH).

1. **Kaart** — bugs lopen/vliegen met eigen clips (bestaat), plus: spawn-pop, idle-bob, schuwe sprong bij naderen; gym 3D met verdedigende bug die idle doet op het platform; raidcocon wiegt en pulseert in tierkleur, scheurt open bij uitkomen; post-schijf draait na draaien; bomen/gras wiegen in de wind (vertex-shader op de natuur-GLB's); weerdeeltjes.
2. **Vangen** — netveeg met trail, ontwijkende/springende bug, vangst-wiebel ×3 met sterren, shiny-sparkle-strip, nectar/stof vliegt naar teller.
3. **Actieduel** — tik = uitval + treffercijfer, charge = korte aanloop + FX-atlas (lucht/blad/vuur/schild, 4 frames), veeg = ontwijk-glijder, treffer = flits + squash, HP-balk met naijlend wit stuk, flauwvallen, wissel = glij in/uit, uitslag = medaille valt + XP/stof telt op.
4. **Arcade (7 spellen)** — 2.5D-lagen: idle-bob 1–2 px, uitval, squash, richttrails, effectatlas; squadsteun zichtbaar (portretje + "+12%").
5. **Beloning/progressie** — evolutie: gloed + silhouet-morph + flits; level-up burst; power-up: CP telt op, sparkles.
6. **3D-bugs** — clips controleren per soort (idle/walk/fly/attack/hit/dead), vleugelslag waar ontbreekt, betere materialen (gedaan, `scripts/upgrade-bug-materials.mjs`), HD-portretten (render loopt).

## Volgorde (Claude), steeds één blok tegelijk en per blok screenshot naast de preview
1. `PogoUiV2` → glas-look (B01-kern), zodat kaartmenu en bugdetail direct op de previews lijken; tekstronde (minimale tekst).
2. B13 kaart: 3D gym/cocon/post/natuur inbouwen + kaartanimaties.
3. B10 actieduel visueel + animatie met Codex' assets (`arena-forest.png`, `fx-atlas.png`, cutouts).
4. B02/B03/B04: Arcade-kern + Tikduel als eerste speelbare kring, dan de andere zes.
5. 3D-bugkwaliteit en animatieclips; daarna B18 met Codex.

## Wat niet meer geldt
De lichte witte PoGO-vellen (`docs/design/simpel-*.png`) waren een tussenstap. De indeling (één hoofdknop, extra's achter ☰/ⓘ, minimale tekst) blijft; de kleuren/oppervlakken worden de glas-look van de previews.
