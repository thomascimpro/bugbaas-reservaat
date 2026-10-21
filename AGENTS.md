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

**Nu:** BB-57: Echo-arena tegen opgeslagen echte teams (aparte rating), 2/5-km-cocons, drie vaste dagbazen, acht held items, Vuur/Water-dekking en #031 Herculeslarve→Herculeskever aangesloten en browsergetest. 281 tests, TypeScript en webbuild groen. Zestien onbereikbare oude UI-bestanden verwijderd; assets en spelerdata behouden. Zie werkregister voor bewijs en exacte regels. Sol 6.1-agents leverden eerste onderdelen; vervolgtaken stopten door werkruimtetegoed, root nam over. Volgende gameplaytaak: veilig bevestigd ruilen tussen vrienden. Shadow/zuiveren/Mega, seizoenen/events en echte co-op kaart-raids niet gebouwd. Nog niet releaseklaar: online preview oud, native uitvoering/fysieke wandeling, achtergrondafstand, live postenbron en cloudherstel open. Bekende bron blijft lokaal uit via `GAME_WORLD_SITES_URL=off`; eerdere Metro-start automatisch geweigerd, niet opnieuw proberen zonder gewijzigde omstandigheden. Geen publicatie/reset/betaalde dienst. Extra QA-infrastructuur geparkeerd.

Werkplan: `docs/superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md`.
