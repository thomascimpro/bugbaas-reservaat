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

**Nu:** BB-61: ruilen, collectienavigatie/bijnamen en dagboek afgerond. 302 tests, TypeScript, webbuild, gerichte browser- en cloudvangstcontrole groen. APK 0.1.4/code 5 ondertekend en over 0.1.3 getest in de aparte emulator: kaart/GPS, twee echte swipevangsten, beloningen/dagboek, cocons, bijnaam/vorige/volgende, herstart en GPS uit/aan. Android-history/GPS-fout en Cocons-navigatie hersteld; geen ontwikkeltoolbar in APK. Zie werkregister en ../bugbaas-release014/release-checks.json. Nieuwe compatibele HTTPS-preview bestaat; productiealias bleef ongemoeid. Nog open: toegestane live posten/routesbron, fysieke telefoonwandeling/GPU/accu en echte cloudrestore. Bron blijft GAME_WORLD_SITES_URL=off; geen reset, betaalde dienst of productiepublicatie. Geen nieuwe grote gameplayuitbreiding.

Werkplan: `docs/superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md`.
