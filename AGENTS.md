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

**Nu:** BB-59: GPS-kaart als thuisbasis. Automatisch actuele locatie vragen, bewaarde kaart niet als startpositie gebruiken, terug uit schermen op speler centreren, compact menu over de kaart en rustigere HUD met trainerlevel. GPS-verlies verwijdert interacties direct; autovangst kan zonder GPS uit. 31 gerichte GO/native-brugtests, TypeScript en webbuild groen; toestemming, heropenen, centreren, geen locatie-API en 320/390/430 px browsergetest met gesimuleerde Eindhoven-GPS. Zie werkregister. Releasepunten BB-58 blijven open: online preview oud, actuele native uitvoering/fysieke wandeling, live postenbron en cloudherstel. Bron blijft lokaal uit via `GAME_WORLD_SITES_URL=off`; bekende geweigerde Metro-start niet herhalen. Geen publicatie/reset/betaalde dienst of nieuwe grote gameplayuitbreiding. Extra QA-infrastructuur geparkeerd.

Werkplan: `docs/superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md`.
