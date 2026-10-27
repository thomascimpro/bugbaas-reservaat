# BugBaas Reservaat — 3D-modellen, evoluties en Codex-import

**Laatst gecontroleerd:** 26 oktober 2026
**Doel:** één concrete ingang voor Codex om **legaal, visueel passend en zonder regressies** nieuwe 3D-bugs toe te voegen. **Dit is geen opdracht om direct 250 soorten speelbaar te maken.**

> **Eerst lezen:** `AGENTS.md` en `docs/POGO_WERKREGISTER.md`. Het project kan tegelijk door andere workers gewijzigd worden. Raak hun bestanden niet aan zonder de huidige Git-status en broncode te controleren.

## 1. Waar staat alles?

| Pad | Wat is het? | Huidige staat |
| --- | --- | --- |
| `public/models/*.glb` | **Actieve** 3D-modellen, geladen via `/models/{naam}.glb` | Bestaande game; niet overschrijven |
| `assets/3d/evolution-stages/` | Drie **al in de werkboom toegevoegde** aparte volwassen vormen, met `source.json` en licentie | `GardenAntAdult.glb`, `EmeraldMantisAdult.glb`, `MonarchButterflyAdult.glb`; NIET opnieuw integreren |
| `assets/3d/bug-kandidaten-20261026/sources/` | **14 lokaal opgeslagen gecomprimeerde** bronarchieven, 11 SHA-256-unieke GLB-modellen | Verliesloos gecontroleerd, **nog niet uitgepakt** |
| `assets/3d/bug-kandidaten-20261026/MODEL_INDEX.json` | **Machineleesbare catalogus**: exacte modelnaam, bron, maker, licentie, SHA-256, bytes, animaties, aanbevolen gebruik | Hoofdingang voor selectie |
| `assets/3d/bug-kandidaten-20261026/unpack_staged.py` | Zet de opgeslagen `.glb.gz.b64`-bestanden om naar echte `.glb`-bestanden; detecteert exacte dubbelen | Syntax en **read-only** validatie gecontroleerd |
| `assets/3d/bug-kandidaten-20261026/downloads/staged/` | Bestemming na uitpakken | Pas aangemaakt na `--extract` |
| `assets/3d/bug-kandidaten-20261026/download_models.py` | Extra gratis modelbestanden verzamelen en op licentie, volledigheid, hash en animaties controleren | **Voorbereid, nog niet uitgevoerd** |
| `assets/3d/bug-kandidaten-20261026/RESEARCH_20261026.md` | Grote externe bronnen, extra zoekresultaten en beperkingen | Onderzoek, niet automatisch gedownload |
| `assets/3d/bug-kandidaten-20261026/staged-catalog.json` | Catalogus gegenereerd bij `unpack_staged.py --extract` | Pas beschikbaar na uitpakken |
| `assets/3d/bug-kandidaten-20261026/catalog.json` en `CREDITS.md` | Manifest en credits gegenereerd bij bulkdownload | Pas beschikbaar na download |

**Geen verwarring:** 11 technisch unieke opgeslagen kandidaatmodellen zijn **niet** 11 nieuwe speelbare Dex-soorten. Sommige zijn statisch, lijken op bestaande bugs of zijn inmiddels al elders als evolutiebron gebruikt. De bestaande 3 extra volwassen modellen in `evolution-stages` tellen **niet** als 3 nieuwe Dex-IDs.

## 2. Welke 11 nieuwe kandidaten zijn lokaal aanwezig?

De onderstaande namen zijn de basenames zonder `.glb.gz.b64`; exacte details en hashes staan in `MODEL_INDEX.json`.

| Model | Type | Animatieclips | Advies |
| --- | --- | ---: | --- |
| **Armabee** | Fantasy-bij, fase 1 | 8 | **Hoog** — samen met Armabee-Evolved |
| **Armabee-Evolved** | Fantasy-bij, fase 2 | 8 | **Hoog** — **twee** verschillende vormen; geen derde gevonden |
| **Scorpion** | Schorpioen | 4 | **Hoog** — nieuwe categorie en Gobkit-stijl |
| **Geode-Centipede** | Geode-duizendpoot | 3 | **Hoog** — nieuwe categorie |
| **Bee-Enemy** | Fantasy-bij | 4 | Midden — andere bij; geen verzonnen biologisch vervolg |
| **Crab-Enemy** | Fantasy-krab | 10 | Midden — alleen als fantasy-/niet-insectsoorten gewenst |
| **Gobkit-Mantis** | Bidsprinkhaan | 3 | **Overslaan**: originele bron al gebruikt in `EmeraldMantisAdult.glb` |
| Bee | Simpele bij | 0 | Alleen statische referentie; huidige bij bestaat al |
| Mantis-Detail | Bidsprinkhaan | 0 | Alleen statische referentie |
| Poly-Beetle | Kever | 0 | Alleen statisch; **CC-BY 3.0, credits vereist** |
| Tarantula-Detail | Vogelspin | 0 | Alleen statische referentie |

**Drie exacte dubbelen:** `Gobkit-Centipede` = `Geode-Centipede`; `Mantis` = `Gobkit-Mantis`; `Poly-Bee` = `Bee`. Het uitpakscript filtert ze op SHA-256.

## 3. Nieuw gevonden: vijf direct downloadbare, geanimeerde GLB's

**Hoogste prioriteit.** Publiek CC0-project: [Insectoids](https://github.com/danielgruginski/Insectoids), auteur Daniel Gruginski/algumacoisaqq.

| Model | Werkelijke clips | Grootte | Gebruik |
| --- | ---: | ---: | --- |
| Spiderling | 7 | 1,31 MB | Spider-familie fase 1 |
| Spider | 10 | 1,71 MB | Spider-familie fase 2 |
| Broodmother | 8 | 2,04 MB | Spider-familie fase 3, eindfase |
| Wasp | 8 | 1,08 MB | Zelfstandige wespenbug |
| Centipede | 10 | 5,50 MB | Zelfstandige duizendpoot; **mobiele download optimaliseren** |

Deze vijf **zijn via hun originele GitHub-GLB-URL opgehaald en inhoudelijk gecontroleerd** op 26 oktober: geldige GLB, skins/animaties, namen van clips, geen vereiste aparte afbeeldingsbestanden of extra decoder; vertexkleuren aanwezig. **Nog niet lokaal gedownload.** Exacte URLs staan in `MODEL_INDEX.json` en zijn toegevoegd aan `download_models.py`. Voorbeeld: `https://raw.githubusercontent.com/danielgruginski/Insectoids/main/export/godot/Spiderling/Spiderling.glb`.

**De spinnen zijn een echte 3-stadia fantasy-evolutie met verschillende anatomie.** Geen re-skin of opgeblazen schaal. Oudere `README`-verwijzingen naar uitsluitend FBX zijn niet meer volledig: de actuele repo bevat ook uitgevoerde `export/godot/<Model>/<Model>.glb` bestanden.

## 4. Aanvullende externe bronnen voor een tweede importgolf

Bronnen hieronder zijn **onderzocht, maar niet als GLB in de projectmap gezet**.

| Prioriteit | Model(len) | Bron | Licentie/technische kanttekening |
| --- | --- | --- | --- |
| Hoog | 222-triangle Spider met idle/walk/attack | https://opengameart.org/content/spider-2 | CC0, `.blend`, Blender-export naar GLB nodig; heel lichte alternatief-spider |
| Hoog | Geanimeerde bidsprinkhaan met idle, aanvallen, vliegen, loopcycli | https://blendswap.com/blend/5735 | CC0, `.blend` (20 MB), export/conversie; **bestaand mantis-model al vervangen**, dus vergelijk eerst |
| Midden | Black Widow Spider met walk | https://blendswap.com/blend/5385 | CC0, `.blend`; mogelijk login vereist |
| Midden | Low Poly Firefly met bewegende vleugels | https://blendswap.com/blend/10755 | CC0, `.blend`; bijzonder nuttig als lichtgevende nachtbug |
| Midden | Grote live catalogus | https://gobkit.com/api/free en https://gobkit.com/api/community | CC0 per model controleren; **60 insecten uit de hoofdpacks zijn al in de game** |
| Midden | Extra insecten, vaak statisch | https://poly.pizza/search/Bug en https://3dassets.dev/docs/api | Per model CC0/CC-BY, animaties en kwaliteit beoordelen |
| Midden | 17 vrij verkrijgbare insectachtige modellen | https://www.sloyd.ai/free-3d-models/animals-creatures/insects-bugs | CC-BY 4.0 en credits; vooral statisch; mogelijk duplicaten |
| Laag | 72 Blender-modellen in insectencategorie | https://blendswap.com/3d/insect | Gemengde licenties, CC-BY-SA/NC uitsluiten, login en conversie kunnen nodig zijn |
| Laag | Japanse neushoornkever larve/pop/volwassen | https://sketchfab.com/3d-models/cc0-japanese-rhinoceros-beetle-larvae-53e2710bc9bd4c369549c4d9318d5178 | CC0 per bestand controleren; volwassen model mogelijk honderden k triangles, niet mobiel-klaar |
| Optioneel betaald | MeshTint Cute 3D evolution families | https://www.meshtint.com/products/monsters-ultimate-pack-07-cute-series | **Geen gratis download**; aankoop, licentie en publieke GLB-distributie vooraf beoordelen |

**Niet claimen:** dat het volledige internet is doorzocht, dat 250 GLB's zijn gedownload, dat alle nieuw gevonden modellen direct speelbaar zijn, of dat elk model dezelfde low-poly stijl heeft.

## 5. Exacte werkwijze voor Codex

### A. Eerst inventariseren — geen bestaande bugs kapot maken

1. Lees `AGENTS.md`, dit document, `MODEL_INDEX.json`, `assets/3d/evolution-stages/source.json` en de actuele `git status --short`.
2. Andere worker werkt momenteel al aan **ant_elite / mantis_elite / butterfly_elite** in `game/dexV2.ts`, `game/walkingV2.ts`, `src/bugModelV2.ts` en portretten. **Niet overschrijven of opnieuw importeren.** Wacht op een niet-conflicterende opdracht voordat je daar wijzigingen in maakt.
3. Bepaal maximale actuele Dex-ID dynamisch uit `game/dexV2.ts`. Dexnummering is append-only; hergebruik geen al gepubliceerde nummers. Bestaande individuele specimens, IV, shiny, eigendom, level, moves, held items, candyFamily, CP en voortgang blijven staan.

### B. Kandidaten uitpakken en extra downloads ophalen

Vanaf de projectroot (PowerShell):

```powershell
python assets/3d/bug-kandidaten-20261026/unpack_staged.py
python assets/3d/bug-kandidaten-20261026/unpack_staged.py --extract
python assets/3d/bug-kandidaten-20261026/download_models.py --max 250
```

Dit levert `.glb`-bestanden op in `downloads/staged/` en (voor de bulk) `downloads/`, plus `staged-catalog.json`, `catalog.json` en `CREDITS.md`. **Modelbestanden zijn na deze stap nog niet actief.** Bulkdownload is nog niet getest; inspecteer fouten, licenties en downloadomvang. Alternatief voor uitsluitend CC0: `--only-cc0`.

Controleer SHA-256, `meshes`, `skins`, `animation_clips`, glTF-embedded buffers, `extensionsRequired`, driehoekenaantal, echte materiaalweergave, bestandsgrootte en aanwezigheid van root motion. Een verschillende hash betekent niet automatisch een verschillende soort/anatomie (zie `Gobkit-Mantis` tegenover `EmeraldMantisAdult`).

### C. Importeren — één familie tegelijk

**Voorgestelde eerste familie:** `Spiderling -> Spider -> Broodmother`; na afzonderlijke beoordeling `Armabee -> Armabee-Evolved`, `Scorpion` en `Geode-Centipede`. Begin niet met 250 soorten tegelijk.

- Werk met zelfstandige `.glb`-modellen in `public/models/` als een nieuwe soort daadwerkelijk is goedgekeurd. Naam zonder streepjes/spaties, bijvoorbeeld `ArmabeeEvolved.glb`: `scripts/render-bug-portraits.mjs` serveert nu alleen `/models/[A-Za-z]+.glb`.
- Controleer `game/walkingV2.ts` voor `WALK_MODELS`, `game/fieldFamiliesV2.ts` voor nieuwe 3-stadiafamilies, `game/dexV2.ts` voor vaste nummers, `EVOLUTIONS`, `ELITE_FORMS`, `EVOLUTION_APPEARANCES`, `candyFamily` en `game/catalogV2.ts` voor spelfeatures. Hernoem/breek geen gepubliceerde ID's.
- `src/bugModelV2.ts` laadt `/models/{name}.glb`, maakt een skeleton-clone en gebruikt animatorclips; check `src/WalkingSceneV2.ts` en `src/GoCombatFighterV2.ts` voor idle, walk/fly, attack/hit/death. **Insectoids heeft met hoofdletters geschreven `Idle`, `Walk`, `Fly`, `Bite`**; Poly Pizza heeft prefixes zoals `CharacterArmature|Flying_Idle`. Maak een expliciete clip-map of hernoem tijdens import; gebruik niet blind de eerste clip (kan `Death` zijn).
- **Root motion** van Insectoids kan dubbele beweging veroorzaken naast de bestaande gamepositie. Houd locomotion visueel op zijn plek of corrigeer de `Motion`-track; de client blijft geen GPS- of servergevechtpositie bepalen.
- Render passende *echte* normal/shiny portretten met de bestaande `scripts/render-bug-portraits.mjs` en werk `assets/v2/portraits/v1/manifest.json` bij. Geen los gegenereerde illustratie gebruiken die een andere anatomie toont.
- Controleer of drie evolutiestadia echt andere topologie/silhouetten hebben; niet alleen schaal/goudmateriaal. Geen evolutie na terminale vorm; kosten/moves/serverbalans conform bestaande families. Nieuwe families pas in spawn/cocon-pools na gerichte regressietests opnemen.

### D. Licenties, kwaliteit, tests

- **CC0:** leg bron, maker, originele URL, bestand, hash en controledata vast. **CC-BY:** vermeld auteur/licentie/link zichtbaar in credits en documenteer wijzigingen. Laat NC, ND, SA en onbekende rechten buiten de automatische import. Betaalde modellen niet zonder aankoop/licentie overnemen.
- Mobiel: werk met een proef op 320/390/430 px, verschillende lichtrichtingen, shiny/normal, reduced-motion en WebGL-fallback. Bij grote `Centipede.glb` (5,50 MB) eerst optimaliseren en netwerk-/GPU-belasting meten; grootte is geen bewijs van kwaliteit.
- Gebruik de bestaande relevante tests (zie `tests/renderingModelsV2.test.ts`, `tests/dexV2.test.ts`, `tests/goFeaturesV2.test.ts`) en de bestaande TypeScript/webexportchecks. Geen reset, geen productiepublicatie en geen ongevraagde nieuwe QA-suite.
- Noteer na een **daadwerkelijk** geslaagde import: modelnaam, familie, nieuwe/bestaande Dex-ID, aantal animaties, licentie, bronhash, tests/visuele controle en of het op echte Android getest is. Alle onbewezen zaken expliciet als onbewezen laten.

## 6. Directe Codex-opdracht

> Lees `docs/BUGBAAS_3D_MODELLEN_CODEX.md`, `assets/3d/bug-kandidaten-20261026/MODEL_INDEX.json` en eerst de projectregels. Zet de 11 opgeslagen kandidaatmodellen veilig om naar GLB en vul de downloadcatalogus aan met de vijf geverifieerde Insectoids-modellen. Controleer dubbelen, licenties, animaties, stijlovereenkomst en mobiele prestaties. Selecteer de beste nieuwe 3-stadiafamilie (voorkeur: Spiderling -> Spider -> Broodmother). Implementeer uitsluitend deze familie in een niet-conflicterende werkboom inclusief normale/shiny portretten, behoud van alle bestaande IDs/progressie, relevante tests en browsercontrole. Raak de nieuwe ant/mantis/butterfly-evolutiebestanden van de andere worker niet aan. Rapporteer echte geïmporteerde modellen apart van alleen gevonden of gedownloade kandidaten.

**Stopcriterium:** één volledig werkende, getest geïmporteerde 3-stadiafamilie of een concreet aantoonbare blokkade. Geen verzonnen importstatus of ongevraagde release.
