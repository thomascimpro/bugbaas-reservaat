# BugBaas 150 3D-bugs — actueel productie- en bronplan
**Gecontroleerd op 26 oktober 2026.**

## Resultaat vs. doel

| Maatstaf | In game | Buiten game | Doel |
|---|---:|---:|---:|
| Dex-vermeldingen | 92 | 0 nieuwe gekoppeld | 150 |
| Unieke huidige bugmodellen | 65 | 85 **procedurele concept-GLB's in apart ZIP-artifact** | 150, **na kunst- en gameplaykeuring** |
| Huidige evolutiefamilies | 40 | Concept: 28 derde stadia + 10 nieuwe families | 50 families, ieder 3 stadia |
| Huidige normale/shiny-portretvarianten | 184 | 0 voor 85 nieuwe concepts | 300 |
| PNG+WebP portretbestanden | 368 | 0 voor concepts | 600 |
| Bronarchieven nieuw | 11 SHA-unieke (7 geanimeerd) buiten game | 5 extra externe geanimeerde GLB's gecontroleerd | Bronmateriaal zoveel mogelijk hergebruiken |
| Onderzoeksbronmap `.local/evolution-research` | 11 andere unieke GLB's (3 geanimeerd) | Niet versiebeheerbestendig en deels overlap anatomie | Eerst licentie + herkomst vastleggen |

**BELANGRIJK:** de 85 gegenereerde GLB's zijn echte, zelfstandig geopende en geanimeerde **conceptmodellen**, maar tonen visueel soms te veel onderlinge overeenkomst. Niet als definitieve soorten toevoegen; voorlopig géén andere spelerdata of gamebestanden vervangen. Er zijn **geen** nieuwe Dex-nummers live of portretten voor de concepts gecreëerd.

## Volledige 85-assetbundel

In de chat van 26 oktober 2026 is de download gegenereerd:
`BugBaas_85_procedural_3D_concepts.zip`

- ZIP-SHA-256: `9c1406e37f87d816398d76afbcb86f5309c86afc8522eeeb2c4729377c0781e0`
- ZIP: 1.099.482 bytes, 85 eigen lage-polygoon GLB's (samen circa 4,3 MB zonder zip), 5–6 benoemde clips (`idle`, `walk`, `attack`, `hit`, `dead` en bij vleugelsoorten `fly`)
- `generate_bug_models.py`: volledige Python-only geometriegenerator (geen Blender nodig), plus `validate_generated.py`, `MODEL_MAP_150.json` en contact sheet in ZIP.
- `assets/3d/bug-kandidaten-20261026/PROCEDURAL_85_ASSET_MAP.json`: **85 precieze koppelingen** aan bestaande of toekomstige Dex-ID's, zonder wijzigingen aan de Dex zelf.
- Een bron- en geometriecheck bewijst 85 SHA- en geometrisch verschillende bestanden; dat is geen bewijs voor 85 herkenbare, mooie bugontwerpen.

**Overdracht naar de Windows-projectschijf gelukt (26-10):** in `assets/3d/bug-kandidaten-20261026/` staan nu twee volledig geverifieerde base64/XZ-tekstdelen van de **originele complete generator** uit het ZIP, plus `restore_and_generate_85.py`. De generator is gecontroleerd en produceerde in de aparte broncontainer alle 85 GLB's **byte-identiek** aan de oorspronkelijke ZIP. De 85 binaire bestanden zijn **nog niet** op Windows gegenereerd, omdat de connector shellschrijfacties niet ondersteunt.

### Nu lokaal uitvoeren door Codex — geen ZIP-download nodig

```powershell
python assets/3d/bug-kandidaten-20261026/restore_and_generate_85.py
python assets/3d/bug-kandidaten-20261026/restore_and_generate_85.py --generate
```

Codex vindt daarna de 85 geverifieerde kandidaatbestanden in `assets/3d/bug-kandidaten-20261026/procedural-drafts/models/`. Het script controleert alle 85 models tegen de originele modelhash en overschrijft geen vreemde bestanden. Voor details: `assets/3d/bug-kandidaten-20261026/CODEX_START_HIER.md`. Het optionele `stage_procedural_zip.py` blijft bruikbaar als iemand de oorspronkelijke ZIP alsnog handmatig naar Windows kopieert.

Dit wijzigt **geen** `public/models`, `game/`, spelerprofielen of serverdata.

## Blender: status en bewezen workflow

- Blender MCP-connectie: op drie pogingen `HTTP 429`, **niet functioneel in deze sessie**. Niet claimen dat Blender MCP een model heeft gegenereerd.
- **Blender 5.1.2 wel lokaal geïnstalleerd** op `C:\Program Files\Blender Foundation\Blender 5.1\blender.exe`.
- Blender CLI-test zonder bestandswijzigingen is geslaagd op `public/models/EmeraldMantisAdult.glb`: één rig, vier animation actions (`attack`, `idle`, `move`, `walk`), 7 materialen, mesh geladen en geometrische maten gemeten.
- Script `assets/3d/bug-kandidaten-20261026/blender_model_qa.py`: in **leesmodus** importeren/inspecteren. Optioneel, met expliciete `--preview`, alleen een PNG render binnen de geïsoleerde kandidatenmap.

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" --background --python assets/3d/bug-kandidaten-20261026/blender_model_qa.py -- --model public/models/EmeraldMantisAdult.glb
```

Na stagen kun je ieder prototype bijvoorbeeld testen met:
```powershell
& "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" --background --python assets/3d/bug-kandidaten-20261026/blender_model_qa.py -- --model assets/3d/bug-kandidaten-20261026/procedural-drafts/models/SpiderStage3.glb --allow-unskinned
```

## Uitgebreide licentiecheck en 3D-bronnen

Selecteer **beste echte art vóór** je een procedureel concept naar productie haalt.

| Bron | Potentieel | Status | Licentie |
| --- | --- | --- | --- |
| [Insectoids](https://github.com/danielgruginski/Insectoids) | Spiderling → Spider → Broodmother, plus Giant Wasp en Giant Centipede (7/10/8/8/10 clips) | 5 directe zelf-contained `.glb` URL's technisch geverifieerd, **nog niet lokaal gedownload** | CC0, zeer interessant; Centipede 5,5MB |
| [Quaternius Easy Animated Enemies](https://quaternius.com/packs/easyenemy.html) | O.a. spider en wasp, verschillende clips, FBX/Blend-conversie | Nieuw aangemerkte bron; nog niet gedownload | Ouder CC0-pakket; bronkopie/datum vastleggen; nieuwe QAL bestaat sinds 28-08-2026 |
| [Low-Poly Realistic Spider Pack](https://raulleonvalero.itch.io/low-poly-realistic-animated-spider-pack-wolf-spider-black-widow) | Wolf Spider en Black Widow, rigged + animated met Blender-bronnen | Handmatig `name your price`, nog niet verworven | Gratis gamegebruik, **losse herdistributie verboden**; niet in vrij redistribueerbaar ZIP opnemen |
| [Gobkit](https://gobkit.com/api/free) en [community](https://gobkit.com/api/community) | Scorpion, Geode Centipede, Mantis, Glass Snail, Vent/Scarlet Crab | Scorpion/Geode opgeslagen, Mantis inmiddels actief; community verdere scan mogelijk | Publieke geverifieerde CC0-assets; 60 hoofdinsecten al actief |
| [Gaitkit Mantis](https://gaitkit.com/asset/praying-mantis) | 2630 tris, walk clip, game-ready low-poly | Beschikbaar bij bron, niet gedownload | Eigen commerciële game-use licentie, geen losse redistributie |
| [BlendSwap insecten](https://blendswap.com/3d/insect) | Gratis CC0 bidsprinkhaan, spin, vuurvlieg, anderen; rigs wisselen | Blender-conversie + per-file broncontrole nodig | Mix CC0/CC-BY/CC-BY-SA; niet blind importeren |
| [3DAssets.dev](https://3dassets.dev/assets/reptiles-amphibians-and-minibeasts-praying-mantis-f56ddbfd) | Bidsprinkhaan, lieveheersbeest, sprinkhaan, tarantula, duizendpoot, schorpioen | 10 modellen al in `.local` en/of staged, vaak **statisch** | CC0, statische meshes pas na rigging geschikt |
| [Sloyd insecten](https://www.sloyd.ai/free-3d-models/animals-creatures/insects-bugs) | 17 catalogusvermeldingen, mix insect/niet-insect | Eerst handmatig echte soort en kwaliteit controleren | CC BY 4.0, credits verplicht |

**Licentie-voorbehoud:** Quaternius' huidige [QAL](https://quaternius.com/license.html) staat commerciële opname toe, maar **verbiedt losse asset-redistributie**. Oude CC0-modellicenties kunnen voor eerder verkregen bestanden gelden. Bewaar per download echte licentietekst/datum; niet afgaan op een algemene licentieclaim.

## Werkplan naar daadwerkelijk voltooide 150

1. **Bron-first, niet 85 procedurale modellen klakkeloos publiceren.** Koppel de hoogste kwaliteit eerst als losse importkandidaat. Bewaar licentie + maker + SHA + animaties. Dedup zowel SHA als herkenbaar silhouet.
2. **Eén complete nieuwe familie als kwaliteitspoort:** Insectoids Spiderling → Spider → Broodmother. Importeer alle drie, controleer GLB/animaties, maak 6 portretten (normaal+shiny) elk PNG+WebP, test op 320/390/430px plus echte Android-profielen.
3. **Voltooi tien nieuwe families** met 3D-architectuur, eigen vormen, geldige clips en 2D-varianten. Geef voorkeur aan taxonomisch diverse insecten boven nog meer kevers. Procedurele modellen zijn alleen startmateriaal om in Blender verder te modelleren.
4. **Breid 28 bestaande tweestadiafamilies uit** naar drie stadia, nummers 93–120 append-only. **Wijzig nummers 1–92 niet.**
5. **Vervang 27 gedeelde Elite-anatomieën** door echt eigen 3D; maak bestaande portretten opnieuw. Hier levert een Blender-variant op bestaande rig vaak meer consistentie op dan een volledig nieuw procedureel model.
6. **Laatste releasepoort:** 150 Dex-IDs, 150 echt onderscheidende modellen, 50 evolutiefamilies van drie, 300 normaal/shiny portretvarianten als PNG én WebP (600 files), consistente animaties/materialen, mobiele performances en volledige regressietests.

### Wat Codex niet mag doen

- Niet zeggen `150 afgerond` puur omdat er 85 conceptbestanden zijn.
- Geen `public/models`, `game/dexV2.ts`, `game/walkingV2.ts`, `assets/v2/portraits/v1` of serverdata veranderen zonder coördinatie met andere Codex-worker.
- Geen identiek model met andere kleur/schaal als volledig unieke evolutionaire vorm kwalificeren.
- Geen niet-geverifieerde licentie of onbekend auteurschap stilzwijgend accepteren.
- Geen update naar productie of bestaande spelers automatisch migreren.

## Opdracht voor Codex (eerstvolgende concrete actie)

> Lees `AGENTS.md`, `docs/BUGBAAS_150_3D_PRODUCTIE.md`, `docs/BUGBAAS_DEX_150_AUDIT_EN_PLAN.md` en `assets/3d/bug-kandidaten-20261026/CODEX_START_HIER.md`. Genereer eerst via `restore_and_generate_85.py --generate` de 85 geverifieerde concept-GLB's in de aparte importmap en voer GLB-QA uit. Download afzonderlijk de vijf geverifieerde Insectoids CC0-GLB's. Implementeer als eerste alleen de kwalitatief betere Spiderling → Spider → Broodmother-lijn, met eigen 3D/animaties en normaal/shiny 2D-portretten, zonder bestaande 92 IDs te wijzigen of andermans wijzigingen te overschrijven. Beoordeel de 85 procedurale modellen in Blender en houd afgekeurde vormen buiten de game. Rapporteer aantallen als `gevonden`, `concept`, `getest` of `daadwerkelijk speelbaar`.
