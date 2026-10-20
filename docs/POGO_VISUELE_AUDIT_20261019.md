# BugBaas ⇄ Pokémon GO: visuele audit, schermentest en voorstellen
19 oktober 2026. **Evidence:** eigen, vandaag in Chromium opgeslagen schermafbeeldingen; PoGo publieke help-/appbeelden (geen toegang tot huidige ingelogde Pokémon GO-app). Geen spelcode aangepast.

## Locaties
- FO: [POGO_FO_20261019.md](POGO_FO_20261019.md)
- TO & spritebron: [POGO_TO_ASSETS_20261019.md](POGO_TO_ASSETS_20261019.md)
- **Interactieve klikbare schets met huidig/concept naast elkaar**: [POGO_SCHERMSCHETSEN_20261019.html](POGO_SCHERMSCHETSEN_20261019.html) — lokaal in Chromium openen (relatieve `../assets/` en `../../bugbaas-pogo-design-audit/` paden behouden).
- Werkelijke browser QA screenshotmap: `../../bugbaas-pogo-design-audit/`. Rapport: `../../bugbaas-pogo-design-audit/report.json` (28 screenshots).
- Schetsbrowser QA: `../../bugbaas-pogo-design-audit/wireframe-report.json` (17 schermen, geen JS-fout/missende images, 21 dex).
- Eerdere brede navigatiecheck: `../.local/sprites-nav-browser-check.py` met 8 geslaagde checks.

## Visuele benchmark
Pubieke PoGo-bronnen:
1. Map View, current control hierarchy and interactive locations: https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/84-what-is-the-map-view/
2. Pokédex UX (seen / caught / numbered silhouettes / shiny categories): https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/124-viewing-the-pokedex/
3. Evolution UX and costs: https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/100-evolving-your-pokemon/
4. Oct 2026 Compass + Weather combined dynamic icon: https://pokemongo.com/news/pgo-gameplay-update-oct-2026
5. Official basic gameplay & map/stop images: https://www.pokemongo.jp/play/
Let op: sommige publiek beschikbare screenshots zijn oudere builds; er is dus géén pixel-voor-pixel vergelijking met 19-10-2026 geïnstalleerde PoGo-app gedaan.

## Alle gecontroleerde schermen, met ingreep
| Stap | Huidige screenshot | Visueel oordeel | Voorgestelde gerichte ingreep |
|---|---|---|---|
| 01 Onboarding | `01-onboarding.png` | Functioneel | Intro één actie, duidelijke GPS-uitleg; pas toestemming vragen voor de kaart |
| 02 Kaart | `02-world-map.png` | **P0: leegte / verschil PoGo** | Wegdetail, kleurvlakken en 3D-variatie, zichtbaar GPS-loopgebied, insectenposten/nesten, iets grotere trainer, schaduw en echte kaart-CTA |
| 03 Menu | `03-menu.png` | **P1: veel leeg wit** | 3×3 bestemmingen, eigen mooie game-art iconen, compactere afstanden, statusregel + kaart terug |
| 04 Veldtas | `04-bag.png` | Oke basis | Finite voorraad, itemcategorien, goede multipliers, actieve selectie en kleine beschrijving |
| 05 Onderzoek | `05-research.png` | **P1: te kaal** | Verduidelijkingskaarten, progressbar, opdrachtlabels, beloningsbeeld; extra tabs pas wanneer backend werkt |
| 06 Nearby | `06-nearby.png` | **P1: geen doelen** | Tabs wilde bugs / posten / nesten / routes, highlightkaart, kompas en echt loopbaar doel |
| 07 Profiel | `07-profile.png` | **P1: zeer leeg** | XP/level (nog niet gebouwd), badges, stats, favoriete buddy, duidelijk progressieblok |
| 08 Vrienden | `08-friends.png` | **P1: zeer leeg** | Kopieerbare code, uitnodigingsflow, vriendenlijst, cadeau/duelstatus |
| 09 Buddy | `09-buddy.png` | **P1: zeer leeg zonder bug** | Grote buddy visual, motivatie om te kiezen, afstandsdoel, wisselknop, statusmeldingen |
| 10 Settings | `10-settings.png` | Basis | Groeperen privacy/GPS/geluid/accessibility, gegevensbeheer |
| 11 Lege Bugdex | `11-empty-bugdex.png` | Oke silhouetten | Nummering #001–021, gezien/gevangen onderscheid, evolutiesilhouetten en zoekfunctie |
| 12 Lege collectie | `12-empty-collection.png` | Oke empty state | Voeg kleine visuele instructie toe: terug naar kaart/waar vangen |
| 13 Volle Bugdex | `13-complete-bugdex.png` | **Sterke art, ontbrekende hiërarchie** | Soortnummer, gridruimtes, categorie tabs, tik opent soortdetail en evolutielijn |
| 14 Shiny Bugdex | `14-shiny-bugdex.png` | Sterke huidige kwaliteit | Zelfde camera en framing; shiny zichtbaar onderscheidbaar van normal, niet alleen ster |
| 15 Collectie | `15-collection.png` | **Sterke art** | Compactere zoek/sort/filter, grotere zichtbare zeldzaamheid + favoriet, multi-select/confirm |
| 16 Bugdetail | `16-bug-detail.png` | **3D sterk, acties te compact** | Model hero, CP-boog, IV als optioneel paneel, grote power-up/evo CTA, geen dood blok |
| 17 Appraisal | `17-bug-appraisal.png` | Functioneel | Statbalken en IV getal rustiger boven de fold |
| 18 Aanvallen | `18-bug-attacks.png` | Functioneel | Energie/move costs en slot 1/2 visueel betere hiërarchie |
| 19 Held item | `19-bug-item.png` | Functioneel | Model/effect preview, exact in bezit en uitgerust |
| 20 Strijd | `20-pvp.png` | P1: veel wit | League-kaart, CP-grens, teampreview en CTA binnen eerste viewport |
| 21 Teamkeuze | `21-team-picker.png` | Werkt | CP-filter, toegestane 3 bugs zichtbaar, duidelijk bevestigen |
| 22 PvP-team | `22-pvp-team.png` | Basis | CP-verdeling en type-matchup signaleren |
| 23 Training | `23-training.png` | Sterke background | Camera/HPbars/attack HUD aanscherpen, feedback van hit/shield/energie |
| 24 Resultaat | `24-battle-result.png` | Basis | Grotere uitslag + stats/delta + duidelijk naar kaart |
| 25 Vangst | `25-encounter.png` | Sterk 3D-model | Ring/bug schaal/afstanden, netkeuze, vloeiende intro/loot |
| 26–28 Responsief | `320-map.png`, `430-map.png`, `1366-map.png` | Geen horizontale overflow | Ook echte klikvlakken/minimumfont en low-end GPU opnieuw testen |

### Algemeen grafisch probleem
De bestaande 2D normal/shiny-portretten zijn **de juiste kwaliteitsnorm**: ze zijn letterlijk van dezelfde low-poly 3D-modellen gerenderd, belichting en camerahoek zijn uniform, alle 21 hebben een shiny. Onderhoud die lijn, niet combineren met zomaar gevonden stockfoto's, losse spritepacks of AI-illustraties van totaal andere stijl.

### Boven- en onderkant UI
- Kaart komt dicht bij de Pokémon GO-hiërarchie: links onder profiel+buddy, middenonder hoofdmenu, rechts onder Nearby.
- Alle overlaykaarten krijgen max 3 prioritaire acties en afsluiten bovenaan; marges 8/12/16pt als design tokens.
- Verrijk de leegte NIET met nepstatistieken of niet-werkende knoppen; voeg zinvolle echte gegevens/handelingen toe.
- Veel tinten beige/groen maken het nu vrij egaal. Zorg voor duidelijke accentkleuren voor route (teal), locatie (blauw), raid/nest (oker), shiny (goud), fouten (rood). Eigen BugBaas identiteitskleuren blijven.

## Assetbron en negen extra soorten
Huidig lokaal pack: `assets/3d/gobkit-insects/`, `README.txt` en `LICENSE.txt` geven Gobkit Free Insect Pack Vol.1, CC0.
- **30** gerigged low-poly GLB modellen gevonden, waarvan **21** in `WALK_MODELS` actief.
- **Negen niet actief:** AntlionLarva, Cockroach, CraneFly, Flea, GiantWaterBug, Mayfly, SoldierTermite, TigerBeetle, TortoiseBeetle.
- 42 WebP's (21 normal + 21 shiny) al in `assets/v2/portraits/v1`.
- Naar 30 kan via dezelfde bake/encode pipeline na namen/biomen/moves/risico-review: **18 extra WebP's** en negen shiny-materiaalpaletten.
- Pokedex-evoluties: momenteel maar één echte spel-lijn, `caterpillar → moth`. De 3D-beeldbron van caterpillar is `BeetleGrub` (keverlarve), en van moth `HawkMoth`: dit moet visueel/biologisch worden gecorrigeerd vóór het een officieel evolutiescherm krijgt. Andere 19 eindvormen hebben geen evo-mechaniek, dat niet verzinnen.
- Voor echt extra evolutielijnen zijn nieuwe stadia/rigs nodig. Eerst de dezelfde maker/stijl/rig gebruiken. Herkomst/hash/licentie registreren. Geen NC/ND assets in release.

## Fase- en prioriteitenlijst
1. **P0** Fix native kaart (nu placeholder) en sluit gelijksoortige art-/naamfouten: geen gestileerde 1:1 waarde zonder native locatie.
2. **P0** Nummer/registratie van Dex + expliciete evolutionregie; screenshot-audit voor alle 21 art.
3. **P1** Kaart met echte openbare POI's, nearby-navigatie en routes, getest met GPS; dit geeft Pokémon GO-lus betekenis.
4. **P1** Kortere, rijkere menu/profiel/research/buddy schermen; bestaande arts blijven behouden.
5. **P2** Negen extra insectsoorten toevoegen via dezelfde GLB+2D/shiny pipeline.
6. **P2** PvP-presentatie en vrienden/rankseizoenen uitbreiden op bestaande server.
7. **P3** PvE-nesten/raids, echte extra evolutiestadia, geavanceerde achtergrondfuncties.

## Browser / toetsbaarheid / beperkingen
- **28 browsergecaptured states** in Chromium: `report.json`: geen script errors/asset 404/overflow. Dit test zichtbare schermen en routes, geen fysieke beweging.
- **17 UI-schetsroutes in browser**: `wireframe-report.json`: alle 17 toegankelijk, 21 Dex-cellen, 6 voorbeeld-collectiecellen, 390/740/1110 responsive en afbeeldingsresolutie.
- Concept wireframe toont geen echte nieuwe gameacties en vervangt niet productiecode.
- Browserfoto's geven geen zekerheid over actuele Pokémon GO-build van 19-10-2026, echte Android-GPU, 3D-perf, toegangsrechten of locatie buiten.
