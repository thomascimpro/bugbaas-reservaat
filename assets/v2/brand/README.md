# BugBaas brand (logo + app-icoon)

Eigen werk (2026-10-29), volledig vector, geen lettertype: de letters van "BugBaas" zijn zelf getekende middenlijnen met ronde uiteinden. Geen externe fonts, beelden of AI-diensten → geen licentie-afhankelijkheden.

- Mascotte: glimmende groene kever met gouden stippen, kroon (de "baas") met roze juweel, grote ogen.
- Woordmerk: goud→oranje verloop, donkere omlijning + 3D-rand, crème stickerrand en zachte schaduw (leesbaar op donkergroen én licht).

## Bestanden

| Bron (hier) | Uitvoer | Gebruikt door |
|---|---|---|
| `wordmark.svg` | `assets/v2/ui/wordmark.webp` (+ `.png`), 1600×552, transparant, 2.9:1 | `BrandMark` in `src/gameUiArt.tsx` |
| `app-icon.svg` | `assets/v2/ui/app-icon-v2.png`, 1024², RGB op #12382e | `app.json` `icon`, `web.favicon` |
| `app-icon-foreground.svg` | `assets/v2/ui/app-icon-foreground-v2.png`, 1024², transparant | `app.json` `android.adaptiveIcon.foregroundImage` en `splash.image` |

Adaptive icon: mascotte blijft binnen de veilige cirkel van 66/108 dp (straal 313 px op 1024); het script controleert dit en meldt een overschrijding.

## Opnieuw renderen

De SVG's worden gegenereerd door `scripts/render-brand.mjs` (gedeelde mascotte/letters). Pas daar aan, niet in de SVG's.

```
node scripts/render-brand.mjs            # SVG's schrijven + PNG/WEBP renderen (sharp/librsvg)
node scripts/render-brand.mjs --svg-only # alleen SVG-bronnen bijwerken
```

`app-emblem-v2.png`/`.json` in `assets/v2/ui/` horen bij het oude logo en worden niet meer gebruikt.
