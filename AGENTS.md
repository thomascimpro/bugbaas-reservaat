# BugBaas Reservaat — werkafspraken

1. Lees eerst `docs/POGO_WERKREGISTER.md`. Bekijk alleen de relevante ontwerpdetails als ze nodig zijn. Bouw afgeronde onderdelen niet opnieuw.
2. Voer de gevraagde wijziging direct uit: één concrete taak, kleinste werkende oplossing, daarna gericht controleren. Geen nieuwe plannen of extra toestemming voor gewone fixes.
3. Werk in deze projectmap. De eigen Git-basis bestaat (`ab57e80`); niet opnieuw initialiseren en nooit Git-acties op de bovenliggende gebruikersrepository uitvoeren.
4. Behoud bestaande spelcode, accounts, bugs, IV/shiny, voorraad, vrienden, Elo en voortgang. Geen reset, betaalde dienst, live herstel of productiepublicatie zonder afzonderlijk akkoord. Geen beveiliging omzeilen.
5. Test alleen wat de wijziging raakt. Bekijk gewijzigd schermwerk in de browser; voer relevante bestaande tests uit bij spel-/serverwijzigingen. Unit-suite en TypeScript bij integratie zijn prima. Herhaal geen volledige screenshotscan of export zonder reden.
6. Werk het register kort bij: wat gedaan, wat getest, wat nog blokkeert en de volgende concrete taak. Geen verplichte nieuwe QA-tooling, uitgebreide formulieren of aparte reviewrondes voor gewone wijzigingen.
7. Als een externe blokkade ongewijzigd blijft, herhaal die niet steeds. Werk verder aan onafhankelijke taken. Simulatie, native telefoon en live locaties zijn verschillende vormen van bewijs.
8. Gebruik agents bij gebruikersverzoek met afgebakende taken en gescheiden bestanden. Eén chat/agent schrijft aan een bestand; behoud wijzigingen van anderen. Bij agentuitval: meld de beperking en ga zelf verder waar mogelijk.
9. Geen tokens, sleutels, precieze woonlocaties of QA-databases in Git. Historische auteurs niet raden en geen ongeteste successen claimen.
10. **3D-bugs/evoluties:** 150 vormen/50 drie-stadiafamilies zijn geïmplementeerd. Bestaande nummers1–92 en spelerdata blijven behouden. Actieve bronnen,85 geometriehashes en licenties: `assets/3d/evolution-150/source.json`; reproduceerbare authoring staat ernaast. 300 normale/shiny HD-portretten en thumbnails;48 oude HD-illustraties hergebruikt. Lees de historische importdocs alleen bij verdere assetuitbreiding; de ruwe kandidaatpacks zijn geen actieve productiebron en blijven buiten Git. Controleer geometrie, animatie-aliassen, kleurtextures en nieuwe portretten vóór promotie. Sommige verwante stadia blijven vergelijkbaar; bestandsverschillen zijn geen bewijs van andere anatomie.

**Gepubliceerd:** 0.1.16/code17 (preview https://bugbaas-reservaat-preview-o75liu9c9-thomas-cim-pro.vercel.app): gymbaas boven gyms op de kaart (`ExploreV2.web` → `postBossChallenge`), cocon-zeldzaamheid (`cocoonTier`/`cocoonChance`/`cocoonSpecies` in `game/goCocoonsV2.ts`), glans vangscène. Cloudcheck: gebruik de in-pagina getimede veeg (`.local/release0116-cloud-check-dbg.py`); de seriële CDP-veeg is onbetrouwbaar onder systeemlast. Groepsraids: aparte sessie/branch `claude/awesome-goldberg-79a52a`, nog niet samengevoegd.

**Vorige release:** 0.1.15/code16 (preview https://bugbaas-reservaat-preview-4cd7ynw2o-thomas-cim-pro.vercel.app): cartoonomlijning vangscène (`addOutline` in `WalkingSceneV2`, dikte uit geposeerde wereldgrootte). Gratis 3D-route: geen Blender-rondreis van runtime-GLB's (breekt quantisatie/skin); verbeteren moet in `assets/3d/evolution-150/authoring` (bron) gebeuren.

Werkplan: `docs/superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md`.
