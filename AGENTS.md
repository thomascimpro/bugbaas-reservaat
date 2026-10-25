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

**Nu:** BB-67: resterende gebruikersverzoeken staan expliciet bovenaan het werkregister. 92 dexvermeldingen (62 verschillende modellen + 30 Elite), tien families met drie modellen, 184 normale/shiny portretten. Kaart geeft oude modellen vrij en bouwt terrein niet opnieuw bij rondkijken; serverrondes/kaartbehoud/batch-power-ups uit BB-66 behouden. 368 tests, TypeScript, webexport en gerichte browser/cloudchecks groen. Definitieve APK 0.1.7/code 8 van 76.908.255 bytes ondertekend en als update getest met behoud van vier QA-bugs/400 stof. GitHub-publicatie/terugdownload wordt afgerond; zie uitsluitend de bovenste checkpoint voor status en hash. Oudere releases en productiealias/spelerdata behouden. Geen PoGO-gelijkwaardigheid, fysieke telefoonwandeling/accumeting, persoonlijke Google/Health-toestemming, gesloten-app-autocatch of volledig live cloud/Auth-herstel claimen. Geen nieuwe grote systemen toevoegen tijdens deze publicatie. Repository: https://github.com/thomascimpro/bugbaas-reservaat.

Werkplan: `docs/superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md`.
