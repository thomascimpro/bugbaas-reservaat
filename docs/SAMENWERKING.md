> **Vervangen op 3 nov 2026** door `docs/creator-handoff/PLAN.md` (Codex, leidend) en `docs/creator-handoff/START_HIER.md`. Alleen nog historisch.

# Samenwerking Codex ↔ Claude (BugBaas)

Beide werken in dezelfde map. Lees dit vóór je begint; werk de tabel "Nu bezig" bij als je iets oppakt of afrondt.

## Taakverdeling (bijgewerkt 3 nov — zie `docs/PLAN_NAAR_PREVIEWS.md`)
Doel: de hele app (behalve de kaart) zoals Codex' beeldborden in `../bugbaas-creatorpakket-20261102/previews/`, mét animaties.
| Wie | Doet |
|---|---|
| **Codex** | Ontwerp/TO/FO (leidend), 2D-art met imagegen, schermen B12/B14/B15/B16/B17 en Plaagbende-schermen (B11) in de glas-look; review van Claude's 3D (`08_ASSETREVIEW.md`) |
| **Claude** | Spellen en animaties: Arcade-kern + 7 spellen (B02–B08), Speel-hub (B09), actieduel (B10), kaart + vangen (B13), alle 3D (bug-animaties/materialen/portretten, gym, cocon, post, natuur, emblemen), gedeelde glas-componenten in `src/PogoUiV2.tsx` |
| **Samen** | B01 (Codex tokens/art, Claude componenten), B18 integratie + APK (na akkoord gebruiker), register bijwerken |

## Stijlafspraken (gelden voor allebei)
- **Minimale tekst, zoals PoGO:** knoppen 1–2 woorden; hooguit één korte regel per scherm; uitleg alleen achter ⓘ (max. 2 korte regels); foutmelding max. ~6 woorden. Geen uitlegtekst in beelden.
- **Oppervlak = Codex' previews:** volle HD-scène + donkere teal-glaspanelen met dunne lichte rand, cyaan pilknop voor de hoofdactie, onderbalk Kaart · Arcade · Bugs · Strijd. De lichte witte PoGO-vellen zijn vervallen (indeling met één hoofdknop blijft).
- **Beelden:** HD-natuur zoals Codex' concept (bemost gesteente, schors, goud, warm boslicht). Transparante achtergrond voor losse objecten, geen tekst in het beeld.

## Nu bezig (bijwerken!)
| Wie | Wat | Bestanden (niet aanraken door de ander) | Sinds |
|---|---|---|---|
| Claude | Kaart-HUD ✅ en bugdetail ✅ (licht, wordt glas via `PogoUiV2`), Strijd-menu gestopt (Codex B12/B15-stijl volgt), daarna B13/B10/B02–B08 | `src/FieldHomeV2.tsx`, `ExploreV2*.tsx`, `BeginnerGuideV2.tsx`, `EnvironmentV2.tsx`, `BugDetailV2.tsx`, `GoCollectionV2.tsx`, `CollectionArtV2.tsx`, `CollectionPresentationV2.tsx`, `BugStrengthV2.tsx`, `GoBattleV2.tsx` (menu, niet het gevecht), `StrijdUiV2.tsx`, `CupV2.tsx`, `PvpRankV2.tsx`, `GoDailyChallengeV2.tsx`, `GoEchoArenaV2.tsx`, `GoBossV2.tsx`, `GoRaidV2.tsx`, `GoGymsV2.tsx`, `PogoUiV2.tsx` | 2026-11-02 |
| Claude | 3D-assets + 306 HD-bugportretten (render loopt) | `assets/3d/**`, `public/models/props|nature/`, `assets/v2/props|types|trainers/hd/`, `scripts/render-bug-portraits-hd.py`, `scripts/upgrade-bug-materials.mjs` | 2026-11-02 |
| Claude (later) | Autovangst afwezig: meer vangsten/km + popup met rarity-kleur en "slechte wegsturen" | `server/goServiceV2.ts` (awayCatch), `src/AwaySummaryV2.tsx` | gepland |
| Codex | Gevechtsconcept actieduel / Tap Duel Squad (ontwerp, nog geen code) | `docs/concepts/combat-20261102/` | 2026-11-02 |

## Verzoeken aan Codex (2D, imagegen)
1. **Gevechtsachtergronden** in dezelfde stijl als `actieduel.png`, zonder UI/tekst, staand 1080×1920, 3 biomen (weide, bos, vijver) → `assets/v2/worlds/battle-<bioom>.webp`.
2. **Aanvalsknop-iconen** (vleugel, kever, vlam, druppel, blad …) los en transparant, of gebruik de 3D-type-emblemen van Claude in `assets/v2/types/` en zeg wat beter moet.
3. **HD-bugportretten** (optioneel, route A): als je ze maakt, gebruik dezelfde kadrering als `assets/v2/portraits/v1/` (1024², transparant, ¾ aanzicht) en lever per soort normaal + shiny; Claude's Blender-portretten blijven dan reserve.

## Review van Codex' gevechtsconcept (Claude, 2026-11-03)
- **Sterk:** tikken/richten + vegen om te ontwijken + direct grote aanval maakt het gevecht actiever en lost het wachten op; uitslagscherm "Gewonnen" is duidelijk; HD-scène past bij de nieuwe kaart/detailschermen.
- **Aanpassen:** (1) minder tekst in beeld ("Tik op je tegenstander", "Ontwijk! 1/2") → één korte hint alleen bij het eerste gevecht, daarna iconen; (2) ronde aanvalsknoppen: gebruik de type-emblemen (`assets/v2/types/`) zodat type en kleur overal gelijk zijn; (3) de rand van de HUD-panelen dunner/transparanter zodat de scène overheerst; (4) bij de reservebugs alleen HP-balk + typekleur, geen CP-tekst.
- **Risico's:** veeg-ontwijken vraagt server-timing en eerlijke NPC-regels (Codex noemt dit zelf); test op een echte telefoon i.v.m. tikvertraging in de WebView.
- **Voorstel volgorde:** Codex levert achtergronden + bevestigt emblemen → Claude bouwt de visuele HUD van het gevechtsscherm met die assets → spelregels (richten/ontwijken) daarna apart, met tests.
