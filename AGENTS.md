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
10. **3D-bugs/evoluties:** 150 vormen/50 drie-stadiafamilies zijn geïmplementeerd. Bestaande nummers1–92 en spelerdata blijven behouden. Actieve bronnen,85 geometriehashes en licenties: `assets/3d/evolution-150/source.json`; reproduceerbare authoring staat ernaast. 300 normale/shiny HD-portretten en thumbnails;46 oude HD-illustraties hergebruikt (weevil/waterstrider afgewezen, zie `scripts/import-legacy-illustrations.mts`). Lees de historische importdocs alleen bij verdere assetuitbreiding; de ruwe kandidaatpacks zijn geen actieve productiebron en blijven buiten Git. Controleer geometrie, animatie-aliassen, kleurtextures en nieuwe portretten vóór promotie. Sommige verwante stadia blijven vergelijkbaar; bestandsverschillen zijn geen bewijs van andere anatomie.

**Gepubliceerd:** 0.1.22/code23 (preview https://bugbaas-reservaat-preview-cscixag0g-thomas-cim-pro.vercel.app, MIN_CLIENT 0.1.21): raids bij alle zichtbare gyms (ook ver), raidlijst in Gyms, op afstand meedoen zonder uitnodiging + vrienden uitnodigen. Cloudcheck: `.local/release0122-cloud-check.py`. Open: PvP-doel (beloningspad, rangen, weekbeker, Plaagbende), weerbonus, identieke 3D-stadia, Oerbugs; niets op telefoon bewezen.

**Vorige release:** 0.1.21/code22 (preview https://bugbaas-reservaat-preview-61b38keva-thomas-cim-pro.vercel.app): eerlijke types, nectar per familie, opruimhulp, Adventure Sync-vraag + weekdoel, raidrooster met ★4, horizon, 26 sprites.

Werkplan: `docs/superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md`.
