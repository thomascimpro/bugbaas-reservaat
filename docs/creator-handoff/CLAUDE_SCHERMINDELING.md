# Schermindeling — PoGO-logica toegepast op BugBaas (Claude, 3 nov 2026)

Leidraad: Codex' previews (P00–P24) en `sections/navigation.md`. Gebruikersbesluiten gaan voor: **zoom/2D/3D blijven als knopjes op de kaart**; schermindeling is Claude's taak (zie `CLAUDE_UITVOERING.md`).

## 1. Hoe PoGO indeelt (de logica die we overnemen)
| PoGO-principe | Hoe het eruitziet in PoGO | Waarom het werkt |
|---|---|---|
| De kaart is het startpunt, nooit een menu | Volle kaart; alleen avatar (links onder), Poké Ball (midden onder), Nearby (rechts onder), klein kompas/weer (rechts boven) | Je kijkt naar de wereld, niet naar knoppen |
| Eén hoofdknop opent alles | Poké Ball → menu met grote tegels: Pokémon (groot), Pokédex, Items, Shop; Battle bovenin; instellingen tandwiel | Alles op 1 tik, maar niet in beeld tijdens lopen |
| Wat bij jou hoort zit achter je avatar | Avatar → profiel met tabs Me · Friends; buddy op het avatar-rondje | Sociaal en persoonlijke voortgang op één plek |
| Taken liggen naast de kaart | Verrekijker-icoon met badge rechts → onderzoek/dagstempels | Altijd zichtbaar dat er iets te halen is, zonder tekst |
| Detail = groot beeld + één knop | Pokémon groot op bioom, CP boven, wit paneel met naam, HP, Power Up/Evolve, ☰ voor extra's, ✕ midden onder | Eén ding tegelijk; extra's verstopt maar vindbaar |
| Lijsten = raster met plaatjes | 3 kolommen, CP boven, naam onder; tabs Pokémon/Eieren; zoek + sorteer | Herkenning op beeld, niet op tekst |
| Spel = volle scène | Gevecht/vangen/raid vullen het scherm; menu's verdwijnen; groot ✕/vluchten | Focus op het spel |
| Beloning vliegt naar de teller | Stardust/candy/XP animeren naar hun plek, medaille-pop-up | Je voelt wat je verdient → verslavend |

## 2. BugBaas: plaatsing per oppervlak (Codex-previews + PoGO-logica)
| Oppervlak | Indeling | Preview |
|---|---|---|
| **Onderbalk** (altijd, behalve tijdens vangen/spel/gevecht) | Kaart · Arcade · Bugs · Strijd — 4 grote iconen met kort label | P01-v2 |
| **Kaart** | Linksboven profiel-rondje (level-badge, buddy-ring) · rechtsboven kompas/weer en Tas · **links onder profiel: 2D/3D, +, − (gebruikersbesluit)** · midden boven de balk: grote net-knop = Menu · rechts boven de balk: In de buurt (+ onderzoek-badge) · loopchip "2,4 km" boven de balk | P01-v2 |
| **Menu** (net-knop) | 9 tegels (Codex): Team, Tas, Bugdex / Cocons, Buddy, Gyms / Vrienden, Doelen, Instellingen. Rode badge = iets te halen. | P01-v2 paneel 2 |
| **Arcade** | Volle scène met de volgende game groot, eigen squad (3 portretjes), **één cyaan "Speel"**; onderaan klein: Scores · Medailles · Spellen | P01-v2 paneel 3, P22 |
| **Bugs** | Raster 3 kolommen (CP, naam, type-icoon), zoek + filter; tik = detail (groot beeld, Sterker, Evolueer, ☰) | P04, P05 |
| **Strijd** | Volle scène + eigen team; één "Duel"; kleine keuzes Dag · Vrienden · Gyms · Raids · Rang | P18, P10, P20 |
| **Profiel** (avatar) | Ik · Vrienden · Medailles · Dagboek/Account | P02/P21 |
| **Spelstromen** (vangen, Arcade-ronde, gevecht, raid) | Volle scène, onderbalk weg, ⏸/✕ linksboven, alles groot, max. 1 hint | P03, P13–P15, P00 |
| **Resultaat** | Groot "Gewonnen"/score, beloningen vliegen naar tellers, één knop **Volgende** | P18-3, P12 |

**Waar de extra functies landen:** Shop via munten/Tas · Routes via loopchip · Lokker/Autovangst via kleine sheet vanaf de kaart (actieve status als snelknop) · Weer/uitleg via kompas · Echo/Arena/Beker/Rang in Strijd · Plaagbende als ontmoeting op de kaart (eigen scène, één spel) · Dagboek/Account via Profiel. Niets nieuws op de kaart behalve wat hierboven staat.

## 3. Verslavend, maar eerlijk (kindvriendelijk; geen betaal-/verliesdruk)
| Lus | Ritme | Wat je ziet/voelt |
|---|---|---|
| Lopen → vangen → sterker maken | minuten | Bugs verschijnen met pop, vangst-wiebel ×3, sterren; stof/nectar vliegen naar teller; CP telt op bij Sterker |
| Eén "Speel" in Arcade | 1–2 min per ronde | Volgende game al klaar; squadbonus zichtbaar ("+12%"); persoonlijk record knalt; medaille-voortgang |
| Dagelijks | 1× per dag | Doelen met stempels (7-dagenkaart), eerste vangst/ronde van de dag extra, cadeautje van buddy |
| Wekelijks | 1× per week | Weekbeker, Glimmerweekend, Oerbug van de week in raids |
| Verzamelen | lang | Bugdex-ringen, shiny-jacht, evoluties met mooie morph, medailles per spel |
Regels: geen verlies bij een gemiste dag, geen betaalde herkansing, korte rondes, altijd één duidelijke volgende stap.

## 4. Volgorde van uitvoering (Claude)
1. **WR-01 kaart** (bezig): props ✅, zoom/2D ✅, nog: post/natuur 3D, vang-animatie, beloningen naar teller.
2. Kaartindeling naar §2 zodra Sol de onderbalk (IN-01) levert; tot dan geen dubbele balk.
3. **PR-01**: Bugs-raster + detail (P04/P05), evolutie-animatie.
4. **GM-01 beeld**: Tikduel-presentatie op Sol's simulator-events; daarna de andere spellen.
5. **CB-01 beeld**: actieduel.
Elke stap: screenshot naast het juiste previewpaneel (390×844, plus 320/430 voor passen), bijhouden in `CLAUDE_TAKEN.md`.
