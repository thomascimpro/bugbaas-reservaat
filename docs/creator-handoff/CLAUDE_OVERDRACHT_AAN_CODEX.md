# Overdracht Claude → Codex — 4 november 2026 (credits Claude op)

De gebruiker vraagt: "zet alles klaar voor codex dat hij het af kan maken, ook visueel". Vanaf nu is Codex eigenaar van alle bestanden hieronder. Claude schrijft niets meer. `progress.json` mag Codex vanaf nu zelf bijwerken.

Niets is gecommit of gereleased. Alles staat uncommitted in de werkmap op branch `codex/fix-native-plaag-0125`. Laatste volledige testrun: 678/678 groen, `tsc` groen.

## 1. Klaar en in de browser bekeken (390×844)

| Taak | Bestanden | Wat | Bewijs |
|---|---|---|---|
| AF-01 popup | `src/AwaySummaryV2.tsx` | <ul><li>Regel `walkTodayText` groot bovenaan.</li><li>Tegels in zeldzaamheidskleur met sterren, shiny ✦ en ♻ op zwakke bugs.</li><li>Knop "♻ n weg" met nectar per familie; tweede tik bevestigt; stuurt `goTransferMany`.</li><li>Selectie: `transferSelectionV2(DEFAULT_TRANSFER_OPTIONS)`, alleen over de weg-vangsten.</li></ul> | `.local/away-ui/` (1,44 km → 14 bugs, 3 weg) |
| AF-01 toast | `src/AutoCatchToastV2.tsx` | Toast bij een vangst tijdens het wandelen (`bottom:250`, `zIndex:40`). | Bekeken op `bottom:150`; de nieuwe positie is **nog niet opnieuw bewezen**. |
| AN-00 HUD | `src/arcade/ArcadeScreenV3.tsx` | <ul><li>Eén spel-HUD: sluiten links, tijd midden, 🏆 score met 👑/🎯-doel rechts.</li><li>De losse doelregel is weg.</li></ul> | `.local/tap-ui/` |
| GM-01 Tikduel | `src/arcade/original/TapDuelScene.tsx`, nieuw `tapPortraits.ts` | <ul><li>1000 catalogus-ID's → 113 HD-portretten; het stadium volgt de zeldzaamheid.</li><li>Gesegmenteerde tikbalk, zeldzaamheidsgloed.</li><li>Tik-impact 140 ms, vang-burst 220 ms, punten 250 ms, combo-puls 160 ms.</li><li>Squad als glascirkels met cooldownring, één steunchip.</li></ul> | `.local/tap-ui/play-390-1.png` |
| GM-02 Nestwacht | `NestDefenseScene.tsx`, nieuw `assets/v3/arcade/nest.webp` (crop A03) | <ul><li>Chips ❤/🪙/🌊; de dubbele tijd/score is weg.</li><li>`trail.webp` met een zandpad volgens `NEST_PATH` en een HD-nest.</li><li>NORMAL/FAST/BAAS/RAAK vervangen door 👑, 🛡️, genezer-ring, slow-contour en impactring.</li><li>Bouw-/upgrade-pop en torenterugslag.</li></ul> | `.local/nest-ui/play-390-1.png` |
| GM-03 Bubbelzwerm | `BubbleSwarmScene.tsx` | <ul><li>Chips Lv / 🎯 missers / ⬇ drukrij of ❄ ijs / ×combo.</li><li>Pop 180 ms en val 250 ms vanaf de oude bordpositie.</li><li>Level-reveal 250 ms, ijscontour.</li><li>Vaste drukwaarschuwingslijn met ⚠.</li><li>Libelle als schieter, volgende bubbel in een glasring; GRENS/DAARNA/uitlegtekst weg.</li></ul> | `.local/bubble-ui/play-390-1.png` |
| GM-04 Webrenner | `WebRunnerScene.tsx` | <ul><li>Chips ❤ en 🛡/🧲/⚡/×.</li><li>Labels LINKS/MIDDEN/RECHTS, ENEMY en SPRONG weg.</li><li>Speler zonder witte kaart, met magneetring en boostspoor tot de state-deadline.</li><li>Glasknoppen ◀ ⤒ ▶; de vijand is nu `wasp_2`.</li></ul> | `.local/games-ui/original-web-runner-390-*.png` |
| GM-07 Vlinderjacht | `ButterflyCatchScene.tsx` | <ul><li>Chips 🦋 n / ×streak.</li><li>Naam boven een focusbalk.</li><li>Cyaan knop "Vang!" of "🎯 n%"; de uitlegregel is weg.</li></ul> | `.local/games-ui/original-butterfly-catch-390-*.png` |

## 2. Gebouwd, maar nog NIET in de browser bewezen

De screenshotproef liep op een time-out bij het openen: `get_by_test_id` met `original-bug-glide` / `original-bug-tower`, via Spellen → index 3 / 5. Waarschijnlijk zit Oefen-index 3 of 5 buiten beeld of klopt de volgorde niet; mogelijk is het een fout in mijn script. Eerst nakijken: `.local/games-ui/*-fail.png`.

- **GM-05 Windvlucht** (`BugGlideScene.tsx`):
  - glazen chips, de dubbele score is weg;
  - "Komt eraan" is weg;
  - nieuwe HD-achtergrond `assets/v3/arcade/canopy.webp` (A07, bron in `source.json`).
- **GM-06 Bladtoren** (`BugTowerScene.tsx`):
  - chips 🍃 etage en ×combo/zone, de dubbele score is weg;
  - LINKS/RECHTS-labels en de uitlegregel zijn weg;
  - "SALTO CHAIN" is vervangen door "Land → tik → salto".

## 3. Één regel nodig in GameV2 (bestand van Sol)

`src/GameV2.tsx` ~regel 231:

```
<AwaySummaryV2 … open={open}/>
```

wordt:

```
<AwaySummaryV2 … open={open} run={run} busy={busy}/>
```

Zonder deze props blijft de knop "♻ n weg" verborgen. Voor de browserproef heb ik dit tijdelijk zo gezet en daarna byte-exact hersteld.

## 4. Nog open, in volgorde

1. **GM-05/06 bekijken.** Daarna alle zeven games op 320×568 en 430×932, en in low en reduced motion.
2. **AN-00/RW-01 resultaatscherm** volgens P15.3:
   - "Score bewaard · Wacht op verbinding · Beloning volgt";
   - bedragen uit de receipt optellen in maximaal 350 ms;
   - één succesklank;
   - nog geen viering vóór de receipt.

   Het scherm staat nu nog in de oude stijl in `ArcadeScreenV3.tsx` (fase `result`).
3. **Animaties per game die nog ontbreken:**
   - Nestwacht: spray 250 ms, web uitvouwen 180 ms, lekkage-flits.
   - Webrenner: webcontact 120 ms, schildbreuk 180 ms.
   - Windvlucht: vleugelslag/lean, pickup.
   - Vlinderjacht: netswing en catchreactie 200 ms.
   - Bladtoren: afzet/landing/salto volgens `spinAngle`.
   - Specificaties: `sections/animations.md`.
4. **Native Vlinderjacht 3D**: aparte proef (nu een projectie-fallback).
5. **Assets**:
   - **Inbouwen** (`assets/3d/README.md`): 286 goedgekeurde HD-portretten uit `.local/portraits-hd/full-a` en 153 materiaal-upgrades uit `.local/bug-upgrade`, naar `assets/v2/portraits` en `public/models`.
   - **Herrenderen**: de 20 afgewezen portretten, met `scripts/render-bug-portraits-hd.py` (env `BB_LIST`). Ze zijn te klein in beeld of afgesneden; lijst in `.local/asset-approval-20261104/portrait-approval.json`.
6. **Kaart (WR-01)**:
   - post- en natuur-GLB's in `WalkingSceneV2` (eerst verkleinen naar minder dan 150 KB);
   - raid-cocon tijdens een actieve raid;
   - vangresultaatkaart (P03-3) visueel bewijzen.
7. **Vang-animaties (AN-01)**:
   - netspoor, 3× wiebelen met sterren, shiny-sprankel, beloningen naar de tellers;
   - evolutiemorph en level-up.
8. **Overige schermen (VS-01)**:
   - groene accenten (gymteamkeuze, volumeknoppen) naar teal/glas;
   - controle op 320×568 en 430×932;
   - raid-lobby (`GoRaidV2.tsx`/`GoGymsV2.tsx`, gedeeltelijke agentwijziging) nakijken.

## 5. Back-ups en hulpmiddelen

- **Back-ups.** De arcade-originelen vóór mijn wijzigingen staan in `.local/arcade-originals/` (die bestanden zijn nog niet in Git). Verder: `.local/AwaySummaryV2.before-cleanup.tsx`, `.local/*.before*.tsx`.
- **QA-scripts.** `.local/tap-check.py`, `nest-check.py`, `bubble-check.py`, `games-check.py <poort> <b> <h> "idx:testID,…"`, `away-check.py`.
- **QA-server.** `QA_PORT=… QA_DIST=… QA_PROFILE=… QA_XP=40000 npx tsx .local/visual78-server.ts <tag>`.
- **Export.** `npx expo export --platform web --output-dir .local/tap-dist`, op BelowNormal-prioriteit en één tegelijk (de pc liep eerder vast).
- **Huisstijl.** Glas-tokens `PO` in `src/PogoUiV2.tsx`: `#0E2828` glas, rand `#BFF3EC47`, teal `#1FC3D3`, goud `#F2C14E`.
- **Regels.** Simulatie, klok en receipts nooit vanuit presentatie wijzigen.
