# BugBaas 3D-assets — overzicht en voortgang

Leidend beeld: Codex' concept `docs/concepts/combat-20261102/` (HD natuur: bemost gesteente, schors, goud, warm boslicht) plus de eenvoudige PoGO-schermen `docs/design/simpel-*.png`.
Taakverdeling: **Codex** maakt 2D (imagegen: achtergronden, gevechtsscènes, iconen, eventueel HD-bugportretten). **Claude** maakt 3D (Blender: modellen, 3D-renders).
Eerst alle assets opbouwen en beschrijven; inbouw in de app gebeurt daarna per scherm.

## Codex-keuring 4 november 2026 — inbouw vrijgegeven

**Ingebouwd door Codex (releasekandidaat 0.1.31):**153 materiaalmodellen en306 portretten actief. De20 uitzonderingen opnieuw gerenderd met alpha-framing en bekeken; alle portretten zijn echte768px-renders, zonder opschalen naar1024, plus256px-thumbnails. Betere bestaande illustraties blijven voorgaan. Bron/licentie en oorspronkelijke hashes behouden; runtime-hashes in `material-upgrade-20261104.json`. Negen natuurmodellen worden begrensd geïnstantieerd; de post is96.672bytes en gebruikt een lichte fallback tijdens laden/op lage kwaliteit. Dit maakt nog niet elke evolutietopologie uniek. De onderstaande keuring is het historische vertrekpunt.

- Materiaalpass:153/153 stagingmodellen in `.local/bug-upgrade/` hebben dezelfde geometrie, skins, clips, textures, body-/alphakleuren als de actieve bronnen; bij twee modellen uitsluitend matrixafronding binnen 0,00001. Vrij voor gerichte inbouw door Claude; vervang geen authoring of geometrie. Snapshot/hashes: `.local/asset-approval-20261104/materials.json`.
- HD-batch:`.local/portraits-hd/full-a/` bevat 306 decodeerbare 768×768 PNG’s met transparantie en verschillende normaal/shinybeelden;15 paren beeldmatig bekeken, beide afgeknipte vormen ook volledig.286 beelden vrij voor gerichte inbouw,20 eerst corrigeren. Machineleesbare selectie/hashes: `.local/asset-approval-20261104/portrait-approval.json`. Bewaar bestaande betere geschilderde illustraties; maak WebP/thumbnails, ruwePNGbatch niet in APK.
- Te klein (beide varianten):`ant_elite, spider_1, wasp_1, wasp_3, firefly_1, mosquito_1, snail_1, snail_2`. Vleugels afgesneden (beide varianten):`butterfly_ultimate, dragonfly_3`. Alleen deze 20 opnieuw kaderen/renderen, niet de hele batch. Bestaande beelden blijven voor die IDs bruikbaar.
- Dit is geen aftekening van alle 3D-anatomie, nieuwe rigs of Androidprestaties. Na inbouw gericht in kaart/collectie bekijken. Er is geen algemene wacht-op-Codex-blokkade meer voor de goedgekeurde assets.

## Waar staat wat
| Soort | Plek | Beschrijving |
|---|---|---|
| 3D-renders voor de UI (PNG/webp) | `assets/v2/<categorie>/` (zelfde plek als Codex' beelden) | `source.json` in die map: bestand, maat, gebruik, variant, sha256 |
| Kaart-/spelmodellen (GLB) | `public/models/<set>/` | `assets/3d/<set>/source.json`: gebruik, materiaal dat de app hertint, bytes |
| Bronscripts | `assets/3d/<set>/authoring/` | Opnieuw te bouwen met één Blender-commando (zie `source.json` → `rebuild`) |
| Gedeelde HD-look | `assets/3d/world-props/authoring/hd_lib.py` | Cycles, bos-HDRI, warm/koel licht, fotomaterialen, takken, bladeren, export |
| CC0-materialen/HDRI | `.local/polyhaven/` (niet in Git) | Poly Haven: forest_slope, mossy_rock, bark_willow_02, forest_ground_04 |

Renderen altijd op lage prioriteit en één tegelijk (`.local/props/run.ps1`), zodat de pc bruikbaar blijft.

## Status
Legenda: ✅ klaar · 🟡 deels/test · ⬜ nog te doen · ➡️ Codex

### A. Kaartwereld
| # | Asset | Status | Bestanden | Opmerking |
|---|---|---|---|---|
| A1 | Gymtoren (4 ploegkleuren) | ✅ render + GLB | `assets/v2/props/gym-*.png`, `public/models/props/Gym.glb` | inbouw: vervangt SVG `GymArtV2` + kaartmarker; GLB nog verkleinen |
| A2 | Raidcocon (★1/3/4/5) | ✅ render + GLB | `assets/v2/props/raid-egg-*.png`, `RaidEgg.glb` | vervangt 🥚; gebruiker koos cocon i.p.v. ei |
| A3 | Post (klaar/gebruikt) | ✅ render + GLB | `assets/v2/props/post-*.png`, `Post.glb` | vervangt procedurele post in `WalkingSceneV2` |
| A4 | Natuur: loofboom, den, struik, bloemenpol, graspol, riet, rots, paddenstoel, boomstam | ✅ GLB + proefrender | `public/models/nature/*.glb` (beschrijving `assets/3d/nature/source.json`), script `assets/3d/nature/authoring/build_nature.py` | vervangt blokjes in `natureMapV2.ts`; laag-poly, vertexkleur, instancing |
| A5 | Lokaasbloem op post | ⬜ | | actief lokaas zichtbaar op de kaart |
| A6 | Routevlag/markering | ⬜ | | routes op de kaart |
| A7 | Plaagbende-ballon 3D | ⬜ | | 2D-crew is van Codex |

### B. Bugs
| # | Asset | Status | Opmerking |
|---|---|---|---|
| B1 | Materiaal-upgrade 153 modellen (glanzend schild, parelmoervleugels) | ✅ keuring vrijgegeven4 november; nog gericht inbouwen | `scripts/upgrade-bug-materials.mjs` → proefmap `.local/bug-upgrade/`; bij inbouw uitvoeren naar `public/models/` (animaties/grootte gelijk) | batch in Blender, zelfde GLB-namen; geldt voor kaart, gevecht en portret |
| B2 | HD-portretten 306 (normaal + shiny) | 🟡306 aanwezig:286 vrijgegeven,20 herkaderen (variant A,768px) | `scripts/render-bug-portraits-hd.py`; volledige run na B1; Codex-imagegen-portretten (➡️) gaan voor als die er komen |
| B3 | Detailmodellen topbugs (3 starters, 3 Oerbugs, raidbazen) | ⬜ | meer vormdetail in eigen authoring |

### C. Personages
| # | Asset | Status | Opmerking |
|---|---|---|---|
| C1 | Trainers (Ranger + 12 Kenney mini): HD-portretten in hetzelfde licht | ✅ `assets/v2/trainers/hd/*.webp` + `source.json` (Ranger-portretten blijven de HD-schilderingen) | huidige mini-portretten zijn eenvoudige renders |
| C2 | Accessoires: rugzak met net, verkennershoed, buddy-draagzak | ⬜ | los op het skelet, hertintbaar |

### D. Gevecht (Codex-actieduel)
| # | Asset | Status | Opmerking |
|---|---|---|---|
| D1 | Type-emblemen ×11 (medaillon met blad, vleugel, vlam, druppel, steen, schild, maan, gif, kever, ster, berg) | ✅ `assets/v2/types/*.png` + `source.json` | voor typebadges en de ronde aanvalsknoppen |
| D2 | Arenaplatform onder de bugs | ✅ `assets/v2/props/arena-platform.png`, `public/models/props/ArenaPlatform.glb` | mossige stenen schijf; achtergrond ➡️ Codex |
| D3 | Gevechtsachtergronden, treffereffecten | ➡️ Codex | imagegen |

### E. Voorwerpen en beloningen
| # | Asset | Status | Opmerking |
|---|---|---|---|
| E1 | Net, stof, nectar, lokaas, wierook, cocons 2/5/7/10 km | ➡️ Codex (2D bestaat) | 3D-versie alleen op verzoek |
| E2 | Medailles brons/zilver/goud | ✅ `assets/v2/props/medal-{brons,zilver,goud}.png` | 3D-render, past bij Codex' uitslagscherm |

## Logboek
- 2026-11-03: natuur, emblemen (gras/vliegend opnieuw), arena, medailles en personageportretten klaar en beschreven. 306 bugportretten renderen (hervatbaar: `.local/props/run-bugs.ps1`).
- 2026-11-02 (avond): gebruiker koos: alles wat 3D is maken. Portretten met variant A (subdivisie + fijne chitinekorrel, alleen in de render; GLB's blijven licht). Alle renders in één reeks op lage prioriteit (`.local/props/run-all.ps1`). Echte anatomische detailmodellen (B3) volgen per familie, eerst een startbug ter keuring.
- 2026-11-02: A1–A3 gebouwd (Cycles, fotomaterialen, bos-HDRI). Raid-ei vervangen door cocon op verzoek. B2-pipeline getest op 4 soorten (shiny-mapping gelijk aan de app); effect beperkt door eenvoudige modellen → B1 eerst.

## 6 november 2026 — gerichte eindcontrole

153 actieve modellen technisch gelezen; alle evolutie-overgangen hebben verschillende POSITION-geometrie. Alle 306 normale/shiny portretten als vier actuele overzichten bekeken. Geen ontbrekende GLB of kleurloze standaardvariant. Vergelijkbare verwante soorten blijven mogelijk; dit is geen bewijs van 153 unieke bewegende anatomieën op een telefoon. De Beenslak (snail_3) viel als onleesbare, drukke schelp uit de toon. Alleen die vervangen door de bestaande BugBaas-authoring: volledig lijf, schelp, voelsprieten en vijf clips (idle/walk/attack/hit/dead), plus twee opnieuw gerenderde 768px-portretten en 256px-thumbnails. bron/rebuild in evolution-150/source.json; bestaande ID, naam, CP, stats en evolutiekosten behouden.
