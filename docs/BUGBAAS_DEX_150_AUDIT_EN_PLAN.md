# BugBaas Reservaat — ACTUELE 3D/2D-inventaris en route naar 150 Dex-soorten

**Controle:** 26 oktober 2026, actuele **lokale werkmap** (niet live productie). Bronbestand voor machinelezing: `assets/3d/bug-kandidaten-20261026/DEX_150_TARGET.json`. Reproduceer de bestandscontrole met `python -B assets/3d/bug-kandidaten-20261026/audit_assets.py`. **Visuele controle van alle bestaande normale/shiny-portretten en de toekomstige evolutiefamilies:** open `assets/3d/bug-kandidaten-20261026/DEX_GALERIJ_92_150.html` lokaal in de browser.

## 1. Status: wat hebben we daadwerkelijk?

| Onderdeel | Actueel | Uitleg |
| --- | ---: | --- |
| Dex-IDs | **92** | 32 originele soorten + 30 Elite-vormen + 30 vormen uit 10 veldfamilies |
| Evolutiefamilies | **40** | 28 lijnen met 2 stadia, 12 lijnen met 3 stadia |
| Werkelijk afzonderlijke actieve bug-GLB's | **65** | Elke Dex-ID heeft een eigen modelverwijzing; **27 Elite-IDs delen geometrie** met hun voorganger |
| Actieve 3D-bestanden in `public/models` | **66** | 65 bugs + `Ranger.glb` (trainer) |
| Model-Runtime | **66/66 animatieclips aanwezig** | Technische aanwezigheid; visuele kwaliteit niet voor elk opnieuw beoordeeld; circa **24,41 MB** |
| Normal/shiny-Dex-portretten | **184** | **92×2**, allemaal aanwezig (ook voor 3 onlangs gewijzigde Elite-vormen) |
| PNG + WebP | **184 + 184 = 368** | PNG 1024×1024; WebP aanwezig; PNG ca. 38,1 MB, WebP ca. 9,6 MB |
| Ontbrekende model-/portretkoppelingen | **0** | `manifest.json` is voor alle 92 IDs consistent met bestaande bestanden |
| Nieuwe bronarchieven `sources/*.glb.gz.b64` | **14 bestanden, 11 verschillende** | 7 geanimeerd, 4 statisch; gecomprimeerd, **niet uitgepakt** |
| Extra onderzoeks-GLB's in `.local/evolution-research/` | **15 bestanden** | 5 geanimeerd, 10 statisch; **11 extra SHA-unieke** naast actieve modellen + bronarchieven |
| Extra lokale kandidaatbestanden (SHA-uniek) | **22** | 11 + 11; **10 geanimeerd, 12 statisch**; exacte bestandsverschillen zijn géén garantie voor nieuwe anatomie |
| Losse 2D onderzoeksbeelden | **39** | 35 PNG, 4 JPG; previews/contact sheets, **geen** 1024 normale/shiny Dex-productieportretten |
| Insectoids GLB's bij externe bron | **5** | Spiderling, Spider, Broodmother, Wasp, Centipede; animaties geverifieerd maar **niet lokaal gedownload** |

**Niet dubbel tellen:** `dist/models/` is een kopie van `public/models`; `assets/3d/gobkit-insects/` bevat 30 bronmodellen waarvan de actieve game al gebruikmaakt; de drie bestanden in `assets/3d/evolution-stages/` zijn al opgenomen in de 65 actieve bugmodellen.

**Extra waarschuwing:** `.local/evolution-research/` is een lokale onderzoeksmap. Kopieën daar zijn niet vanzelfsprekend versiebeheerde assets. De `FieldAnt` en `WoodlandButterfly` zijn bron-/conversievoorgangers van reeds gebruikte Elite-modellen; de opgeslagen `Gobkit-Mantis` hoort anatomisch ook bij de actieve `EmeraldMantisAdult`. Daarom zijn de **22 SHA-unieke kandidaten niet gelijk aan 22 bruikbare nieuwe soorten**.

## 2. Exacte lijst van 40 bestaande evolutiefamilies

### 2A. 28 bestaande tweestadiafamilies: allemaal naar drie vormen

De evolutie `basis → elite` blijft bestaan, zonder hernummering. **Nieuwe stap na Elite:** `elite → [familie]_ultimate`. Een `_ultimate`-naam is een **tijdelijke technische werknaam**, geen goedgekeurde creatieve soortnaam.

| Familie | Bestaande evolutie | Huidig unieke 3D-vormen? | Gepland nieuw eindstadium |
| --- | --- | --- | --- |
| `beetle` | `beetle` → `beetle_elite` | ⚠️ gedeelde anatomie | `beetle_ultimate` (nr. 93) |
| `ant` | `ant` → `ant_elite` | ✅ ander model | `ant_ultimate` (nr. 94) |
| `aphid` | `aphid` → `aphid_elite` | ⚠️ gedeelde anatomie | `aphid_ultimate` (nr. 95) |
| `weevil` | `weevil` → `weevil_elite` | ⚠️ gedeelde anatomie | `weevil_ultimate` (nr. 96) |
| `earwig` | `earwig` → `earwig_elite` | ⚠️ gedeelde anatomie | `earwig_ultimate` (nr. 97) |
| `grasshopper` | `grasshopper` → `grasshopper_elite` | ⚠️ gedeelde anatomie | `grasshopper_ultimate` (nr. 98) |
| `lacewing` | `lacewing` → `lacewing_elite` | ⚠️ gedeelde anatomie | `lacewing_ultimate` (nr. 99) |
| `dungbeetle` | `dungbeetle` → `dungbeetle_elite` | ⚠️ gedeelde anatomie | `dungbeetle_ultimate` (nr. 100) |
| `mantis` | `mantis` → `mantis_elite` | ✅ ander model | `mantis_ultimate` (nr. 101) |
| `butterfly` | `butterfly` → `butterfly_elite` | ✅ ander model | `butterfly_ultimate` (nr. 102) |
| `divingbeetle` | `divingbeetle` → `divingbeetle_elite` | ⚠️ gedeelde anatomie | `divingbeetle_ultimate` (nr. 103) |
| `waterstrider` | `waterstrider` → `waterstrider_elite` | ⚠️ gedeelde anatomie | `waterstrider_ultimate` (nr. 104) |
| `hoverfly` | `hoverfly` → `hoverfly_elite` | ⚠️ gedeelde anatomie | `hoverfly_ultimate` (nr. 105) |
| `leafhopper` | `leafhopper` → `leafhopper_elite` | ⚠️ gedeelde anatomie | `leafhopper_ultimate` (nr. 106) |
| `cricket` | `cricket` → `cricket_elite` | ⚠️ gedeelde anatomie | `cricket_ultimate` (nr. 107) |
| `stick` | `stick` → `stick_elite` | ⚠️ gedeelde anatomie | `stick_ultimate` (nr. 108) |
| `leaf` | `leaf` → `leaf_elite` | ⚠️ gedeelde anatomie | `leaf_ultimate` (nr. 109) |
| `silverfish` | `silverfish` → `silverfish_elite` | ⚠️ gedeelde anatomie | `silverfish_ultimate` (nr. 110) |
| `antlion` | `antlion` → `antlion_elite` | ⚠️ gedeelde anatomie | `antlion_ultimate` (nr. 111) |
| `cockroach` | `cockroach` → `cockroach_elite` | ⚠️ gedeelde anatomie | `cockroach_ultimate` (nr. 112) |
| `cranefly` | `cranefly` → `cranefly_elite` | ⚠️ gedeelde anatomie | `cranefly_ultimate` (nr. 113) |
| `flea` | `flea` → `flea_elite` | ⚠️ gedeelde anatomie | `flea_ultimate` (nr. 114) |
| `giantwaterbug` | `giantwaterbug` → `giantwaterbug_elite` | ⚠️ gedeelde anatomie | `giantwaterbug_ultimate` (nr. 115) |
| `mayfly` | `mayfly` → `mayfly_elite` | ⚠️ gedeelde anatomie | `mayfly_ultimate` (nr. 116) |
| `termite` | `termite` → `termite_elite` | ⚠️ gedeelde anatomie | `termite_ultimate` (nr. 117) |
| `tigerbeetle` | `tigerbeetle` → `tigerbeetle_elite` | ⚠️ gedeelde anatomie | `tigerbeetle_ultimate` (nr. 118) |
| `tortoisebeetle` | `tortoisebeetle` → `tortoisebeetle_elite` | ⚠️ gedeelde anatomie | `tortoisebeetle_ultimate` (nr. 119) |
| `bee` | `bee` → `bee_elite` | ⚠️ gedeelde anatomie | `bee_ultimate` (nr. 120) |

### 2B. 12 families hebben al drie stadia

| Familie | Huidige route | Eigen 3D-geometrieën | Status |
| --- | --- | ---: | --- |
| `caterpillar` | `caterpillar` → `moth` → `moth_elite` | 2/3 | Elite mist eigen vorm |
| `beetlegrub` | `beetlegrub` → `hercules` → `hercules_elite` | 2/3 | Elite mist eigen vorm |
| `lesserstag` | `lesserstag` → `goldenstag` → `giraffestag` | 3/3 | Volledig uniek |
| `minotaurbeetle` | `minotaurbeetle` → `atlasbeetle` → `caucasusbeetle` | 3/3 | Volledig uniek |
| `rosechafer` | `rosechafer` → `flowerchafer` → `rainbowscarab` | 3/3 | Volledig uniek |
| `acornweevil` | `acornweevil` → `leafrollingweevil` → `harlequinbeetle` | 3/3 | Volledig uniek |
| `asianladybeetle` | `asianladybeetle` → `ladybird28` → `jewelchafer` | 3/3 | Volledig uniek |
| `leafbeetle` | `leafbeetle` → `cucumberbeetle` → `deerflowerbeetle` | 3/3 | Volledig uniek |
| `cardinalbeetle` | `cardinalbeetle` → `rosalialonghorn` → `asianlonghorn` | 3/3 | Volledig uniek |
| `eyedclickbeetle` | `eyedclickbeetle` → `golofabeetle` → `elephantbeetle` | 3/3 | Volledig uniek |
| `sacredscarab` | `sacredscarab` → `moonhornedbeetle` → `neptunebeetle` | 3/3 | Volledig uniek |
| `manticora` | `manticora` → `titanbeetle` → `fivehornbeetle` | 3/3 | Volledig uniek |

*De tien veldfamilies zijn bewust **game-evoluties tussen verschillende keversoorten**, geen echte levenscyclus. De twee bestaande larve/adult-lijnen hebben een cosmetische Elite-eindvorm die voor 150 unieke 3D's nog vervangen moet worden.*

## 3. Wat staat nog buiten de actieve game?

### 3A. 11 SHA-unieke gecomprimeerde modellen — `assets/3d/bug-kandidaten-20261026/sources`

| Naam | Soort | Animaties | Hergebruik |
| --- | --- | ---: | --- |
| Armabee | fantasiebij fase 1 | 8 | Goed: nieuw tweestadia-spel |
| Armabee-Evolved | fantasiebij fase 2 | 8 | Goed: fase 2, derde stadium ontbreekt |
| Scorpion | schorpioen | 4 | Goed: geanimeerde basis |
| Geode-Centipede | duizendpoot | 3 | Goed: geanimeerde basis |
| Bee-Enemy | fantasy-bij | 4 | Alleen als soort/evolutie qua anatomie/stijl klopt |
| Crab-Enemy | fantasy-krab | 10 | Geen insect; alleen breed 'creatures' thema |
| Gobkit-Mantis | bidsprinkhaan | 3 | **Niet extra tellen**; originele bron van bestaande EmeraldMantisAdult |
| Bee | statische bij | 0 | Alleen referentie/riggen |
| Mantis-Detail | statische bidsprinkhaan | 0 | Alleen referentie/riggen |
| Poly-Beetle | statische kever | 0 | Alleen referentie/riggen; **CC-BY 3.0 credits** |
| Tarantula-Detail | statische vogelspin | 0 | Alleen referentie/riggen |

Nog drie exacte SHA-dubbelen (`Gobkit-Centipede`, `Mantis`, `Poly-Bee`) zijn bij 11 niet meegeteld. Verliesloos uitpakken kan via `unpack_staged.py --extract`.

### 3B. 11 extra SHA-unieke modellen in `.local/evolution-research`

| Model | Animaties | Reële inzet |
| --- | ---: | --- |
| DAssetsEmperorScorpion | 0 | 3D-evolutiestadium **na rigging** |
| DAssetsGiantCentipede | 0 | 3D-evolutiestadium **na rigging**; 10,9k triangles |
| DAssetsGrasshopper | 0 | Extra uiterlijk **na rigging** |
| DAssetsLadybird | 0 | Extra uiterlijk **na rigging** |
| DAssetsLeafCutterAntWithLeaf | 0 | Referentie/alternatief; inspecteer overlap met bestaande LeafcutterAnt |
| DAssetsOrbWeaverSpiderOnWebFrame | 0 | Referentie/decor; spin zit op spinnenwebframe |
| DAssetsRhinocerosBeetle | 0 | Extra keveruiterlijk **na rigging** |
| DAssetsStagBeetle | 0 | Extra keveruiterlijk **na rigging** |
| FieldAnt | 2 | Blendersource van bestaande volwassen mier; **niet zomaar nieuw tellen** |
| OriginalAdultAntlion | 4 | **Sterkste directe optie:** originele nieuw gemaakte volwassen mierenleeuw voor bestaande `antlion_elite` |
| WoodlandButterfly | 3 | Blendersource van bestaande MonarchButterflyAdult; **niet zomaar nieuw tellen** |

De acht `DAssets*`-bestanden hebben eigen CC0-bronbewijs in `.local/evolution-research/minibeasts-candidate-proof.json` en liggen als GLB plus PNG-preview klaar. De volwassen mierenleeuw heeft eigen geometrie-/animatiebewijs onder `.local/evolution-research/original-antlion-proof.json` en losse actiepreviews.

### 3C. Vijf gecontroleerde geanimeerde GLB's op GitHub

| Model | Animatieclips | Status |
| --- | ---: | --- |
| Spiderling | 7 | Extern geverifieerd; nog niet gedownload |
| Spider | 10 | Extern geverifieerd; nog niet gedownload |
| Broodmother | 8 | Extern geverifieerd; nog niet gedownload |
| Wasp | 8 | Extern geverifieerd; nog niet gedownload |
| Centipede | 10 | Extern geverifieerd; nog niet gedownload |

Bron: https://github.com/danielgruginski/Insectoids. Bronrepo CC0; de vijf geanimeerde `export/godot/<naam>/<naam>.glb`-bestanden zijn rechtstreeks inhoudelijk gecontroleerd. `Centipede` is circa **5,5 MB**: eerst optimaliseren en mobiel testen.

## 4. Wiskundig exact plan voor 150 Dex-vermeldingen

| Stap | Extra Dex-IDs | Nieuwe 3D-geometrieën nodig | Portretproductie |
| --- | ---: | ---: | --- |
| Bestaande 28 tweestadiafamilies uitbreiden naar drie | **28** (nr. 93–120) | 28 | 56 nieuwe normaal/shiny-varianten |
| Tien nieuwe families × drie stadia | **30** (nr. 121–150) | 30 | 60 nieuwe normaal/shiny-varianten |
| 27 bestaande cosmetische Elite-vormen voorzien van eigen anatomie | **0** | 27 | 54 varianten **opnieuw renderen** |
| **Totaal** | **+58** | **85** | **+116 varianten en 54 opnieuw** |

**Eindbeeld:** 150 Dex-vermeldingen in **50 families van ieder 3 stadia**, **150 verschillende 3D-bugmodellen**, **300 normaal/shiny-portretten**, **600 afbeeldingsbestanden** (300 PNG plus 300 WebP). De bestaande 92 nummers 1–92 en de huidige basis→Elite-evoluties blijven ongewijzigd.

**Exacte concept-IDs, nummers, bronkandidaten en nog missende meshes staan in** `assets/3d/bug-kandidaten-20261026/DEX_150_TARGET.json`. **Het JSON-bestand is een VOORSTEL; geen actieve gameplayregel of officiële nieuwe soortnaam.**

### 4A. De tien nieuwe families

| Nieuwe familie | Voorlopige geplande stadia | Kandidaten/ontbrekende modellen |
| --- | --- | --- |
| **spider** | `spider_1` → `spider_2` → `spider_3` | Spiderling (insectoids-github); Spider (insectoids-github); Broodmother (insectoids-github) |
| **armabee** | `armabee_1` → `armabee_2` → `armabee_3` | Armabee (local-staged); Armabee-Evolved (local-staged); **nog te maken** |
| **scorpion** | `scorpion_1` → `scorpion_2` → `scorpion_3` | Scorpion (local-staged); DAssetsEmperorScorpion (.local/evolution-research-static); **nog te maken** |
| **centipede** | `centipede_1` → `centipede_2` → `centipede_3` | Geode-Centipede (local-staged); DAssetsGiantCentipede (.local/evolution-research-static); Centipede (insectoids-github) |
| **wasp** | `wasp_1` → `wasp_2` → `wasp_3` | **nog te maken**; Wasp (insectoids-github); **nog te maken** |
| **dragonfly** | `dragonfly_1` → `dragonfly_2` → `dragonfly_3` | **nog te maken**; **nog te maken**; **nog te maken** |
| **firefly** | `firefly_1` → `firefly_2` → `firefly_3` | **nog te maken**; **nog te maken**; **nog te maken** |
| **cicada** | `cicada_1` → `cicada_2` → `cicada_3` | **nog te maken**; **nog te maken**; **nog te maken** |
| **mosquito** | `mosquito_1` → `mosquito_2` → `mosquito_3` | **nog te maken**; **nog te maken**; **nog te maken** |
| **snail** | `snail_1` → `snail_2` → `snail_3` | **nog te maken**; **nog te maken**; Sanctum-Glass Ossuary Snail (gobkit-community-not-downloaded) |

**Taxonomie:** spin/schorpioen zijn spinachtigen, duizendpoten veelpotigen, slak een weekdier. Als BugBaas uitsluitend **insecten** wil, vervang deze families door insectenfamilies (bijvoorbeeld waterjuffer, gaasvlieg, lieveheersbeestje, extra motten) vóór formele ID-publicatie. Bestaande tien keverfamilies zijn *game-fantasie-evoluties* en zo moeten de nieuwe volwassen-stadia ook worden gepresenteerd als ze niet biologisch correct zijn.

## 5. Kan dit echt met wat er nu ligt?

**Niet direct.** De 85 benodigde extra **onderscheidende** modellen zijn niet al aanwezig. Van de 22 lokaal opgeslagen extra model-hashes zijn 12 niet geanimeerd; meerdere andere vertegenwoordigen al bestaande geometrie. Vijf geanimeerde Insectoids-modellen moeten nog worden gedownload. **Deels kan direct worden geïmporteerd; tientallen modellen moeten nog worden gevonden, ingrijpend veranderd of gemaakt.**

Bronnen voor aanvullende modellen:
- **Gobkit**: https://gobkit.com/api/free en https://gobkit.com/api/community. Reeds 60 insecten gebruikt; andere Gobkit free packs bieden vooral andere diersoorten.
- **Insectoids**: https://github.com/danielgruginski/Insectoids. Bruikbare broncode/Blender voor **eigen geometrisch verschillende evoluties**, niet enkel kleurwijzigingen.
- **3DAssets.dev**: https://3dassets.dev/packs/reptiles-amphibians-and-minibeasts. CC0, vaak **statisch**; alleen als bron voor rigging/retopologie, niet meteen speelbaar.
- **Sloyd**: https://www.sloyd.ai/free-3d-models/animals-creatures/insects-bugs. CC-BY 4.0, vaak statisch, niet elk resultaat is werkelijk een insect.
- **BlendSwap/OpenGameArt**: https://blendswap.com/3d/insects en https://opengameart.org/. Licentie per bestand bewaren; `CC-BY-SA`, `NC`, onbekende rechten en niet-overdraagbare licenties niet automatisch gebruiken.
- **Eén vorm met een andere tint/schaal is géén nieuwe 3D-evolutie.** Toets verschillende silhouetten/meshstructuren en bruikbare bewegingen in browser en op mobiel.

**Aanbevolen productie:** start met werkelijk bestaande animaties, voer vervolgens een **Blender-gebaseerde familieproductie** uit voor ontbrekende stadia (nieuwe kop/antennes/vleugels/pantser/ledematen/hoorns, aangepaste rig en animaties, eigen materiaal/shiny). Hergebruik een rig waar passend, niet een identieke mesh.

## 6. Implementatievolgorde zonder verlies van spelergegevens

1. **Inventaris & assetpromotie.** Bestaande 92 mapping + 184 portretten bevriezen als testfixture. `.local`-bronnen eerst met maker/licentie/SHA vastleggen in een duurzame, versiebeheerde `assets/3d/sources/`-structuur. Gecomprimeerde archieven uitpakken in de aparte `downloads/`-map en vijf Insectoids-GLB's gecontroleerd downloaden. Geen productie- of accountmutaties.
2. **Eerste volledige nieuwe familie.** `Spiderling → Spider → Broodmother` afzonderlijk in `public/models`, nieuwe Dex-IDs **pas na expliciete eindcontrole** append-only toevoegen, alle 6 PNG-portretten en 6 WebP's renderen, idle/walk/attack normaliseren, mobiele compositie en 3D/2D matching toetsen. Dit is het bewijs dat de 150-pijplijn werkt.
3. **Deelverzameling nieuwe families naar Dex 122.** Tien families met drie modellen, bronverwijzingen en wereldspawns per lijn. Kies bij voorkeur andere insectvormen in plaats van nog meer kevers. Dit is nog steeds geen compleet 150-beeld.
4. **Bestaande 28 lijnen uitbreiden naar Dex 150.** Nieuwe `elite → ultimate` toevoegen **zonder bestaande `base → elite`-kosten te veranderen**. Houd oude eigendommen/IV/shiny/held items/candy en nummering stabiel.
5. **27 Elite-replacements.** Vervang resterende gedeelde geometrie door echt verschillende modellen. `OriginalAdultAntlion` is concrete kandidaat voor `antlion_elite`. Regenereer bij vervanging bestaande normale/shiny-2D-portretten zonder nieuwe Dex-ID.
6. **Laatste QA / releasegate.** Assert 150 Dex-nummers, 150 eigen 3D-modellen, 300 normaal/shiny-portretvarianten als PNG+WebP, 50 geldige **acyclische** lijnen met 3 stadia, gedeelde familievaluta, terminale eindfase, veilige migratie, bronbewijzen, WebGL-fallback, mobiele CPU/GPU/netwerklast en regressietests.

### Kritische codepaden voor Codex

- `game/dexV2.ts` — expliciete Dex-nummers, `ELITE_FORMS`, `EVOLUTIONS`, `candyFamily`, `EVOLUTION_APPEARANCES`. **Nooit 1–92 hernummeren.**
- `game/walkingV2.ts` — `WALK_MODELS`, veldspawngewichten en biomevoorkeuren.
- `game/fieldFamiliesV2.ts` — regels/gewichten voor de bestaande tien veldfamilies.
- `game/catalogV2.ts` / andere Go-species-koppelingen — naam, stats, moves, zeldzaamheid, types, geschiktheid voor loops/eieren/battles.
- `src/bugModelV2.ts` — glTFLoader, meshformaat, skinclone, idle/attack-clip mapping, shiny-paletten, cache. `Insectoids` gebruikt `Idle`/`Walk`/`Bite`; `Armabee` heeft prefixed clipnamen. Kies expliciete idle, niet de eerste (`Death` kan eerst komen).
- `scripts/render-bug-portraits.mjs` — 1024px normale/shiny PNG + WebP, manifest; model moet dezelfde geometrie hebben als portret.
- `assets/v2/portraits/v1/manifest.json` — formele normal/shiny modelverwijzingen.
- `tests/dexV2.test.ts`, `tests/renderingModelsV2.test.ts` — bestaande veiligheidstests uitbreiden, plus gerichte drie-stadia-/migratietests.

**Concurrency:** project heeft op dit moment veel niet-gecommitte wijzigingen in precies deze bestanden van een andere Codex-worker. **Niet blind bewerken, resetten of samenvoegen.** Deze audit raakt alleen documentatie onder `docs/` en script/manifest onder de eigen kandidaatmap.

## 7. Wat is bewezen / nog niet bewezen?

| Claim | Status |
| --- | --- |
| 92 Dex IDs, 65 bug-GLB's en 184 normaal/shiny 2D-varianten | **Bewezen door bestand- en registercontrole** |
| Geen ontbrekende model- of portretbestanden voor deze 92 | **Bewezen** |
| 40 actieve evolutielijnen (28×2 en 12×3) | **Uit actuele TypeScript-definities geverifieerd** |
| 22 extra lokale unieke GLB-hashes | **Bewezen**, maar niet hetzelfde als 22 nieuwe soorten |
| 39 losse onderzoekspreviewbeelden | **Bewezen**, niet in Dex-manifest |
| 5 Insectoids-bestanden zijn geldige geanimeerde GLB-bronnen | **Gecontroleerd via externe GLB-responses**, nog niet lokaal |
| 150 unieke 3D-vormen en 600 beeldbestanden | **Doel, niet gerealiseerd** |
| Nieuwe modellen zijn stijlconsistent en gameplay-/mobiel-getest | **Niet bewezen** |

**Een regel voor Codex:** tel nooit een bronbestand, screenshot, andere kleur, gedeeld 3D-model of statische mesh als een nieuwe volledig geïmplementeerde evolutiesoort.
