# BugBaas Reservaat — projectstart

**Android 0.1.9 / build 10:** [APK downloaden](https://github.com/thomascimpro/bugbaas-reservaat/releases/download/v0.1.9/BugBaas-Reservaat-0.1.9.apk) · [release en testverslag](https://github.com/thomascimpro/bugbaas-reservaat/releases/tag/v0.1.9). Android 8.0+, dezelfde ondertekening voor updates met behoud van gegevens. Oudere releases blijven beschikbaar. Deze repository is openbaar.

> **Voor iedere nieuwe ontwikkelchat:** lees eerst [AGENTS.md](AGENTS.md). Daar staan het korte werkafspraken en de grenzen voor data en releases.

## Leesvolgorde (één actuele waarheid)
1. **[AGENTS.md](AGENTS.md)** — instructies voor elke Devspace/Codex-agent in deze projectmap.
2. **[Actueel werkregister](docs/POGO_WERKREGISTER.md)** — bovenaan staat de laatste checkpoint, uitvoerder, status en **exact één volgende stap**. Dit bestand is leidend; oude chats niet nodig.
3. [Selectieve testmatrix](docs/POGO_TESTMATRIX.md) — wat test je bij een wijziging; wanneer mag vorig bewijs hergebruikt worden?
4. [Eenvoudig werkplan](docs/superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md) — implementatiestappen, zonder reeds gebouwde zaken opnieuw uit te voeren.
5. [Historisch uitvoeringsverslag](docs/POGO_UITVOERING.md) — bewijs van wat eerder al gebouwd en getest is.
6. [Functioneel Ontwerp](docs/POGO_FO_20261019.md) · [Technisch Ontwerp](docs/POGO_TO_ASSETS_20261019.md) · [Schermschetsen](docs/POGO_SCHERMSCHETSEN_20261019.html).

## Huidige stap
Echo werkt zonder gelijktijdige spelers met bewaarde teams en herkenbare NPCs. Dagstrijd heeft drie scorepogingen, onbeperkt oefenen en een weekranglijst met vrienden. Nieuwe gyms hebben NPC-wachters; eigen verdedigers keren uiterlijk na twaalf uur terug. Kaart-, menu-, profiel- en detailknoppen volgen de locaties uit de officiële PoGO-schermen.

De collectie bevat 150 vormen in 50 evolutiefamilies met drie stadia, 300 normale/shiny portretten en 85 nieuwe of vervangende modellen. De 92 bestaande nummers, accounts, nectar en exemplaren blijven behouden. Nieuwe lijnen kosten 25/100 nectar; extra eindvormen op oudere lijnen kosten 150. Stats, CP en relatieve vindgewichten staan in [de balanstabel](docs/BUGBAAS_150_BALANS.csv). Verwante stadia kunnen nog op elkaar lijken; dit is geen claim van 150 verschillende anatomieën of bewezen competitieve eindbalans.

De Bugdex en bugdetails bieden 2D/3D: 48 originele illustraties uit de oude BugBaas worden hergebruikt; overige vormen en shinies hebben hun eigen 1024px-modelportret. Lijsten gebruiken 256px-afbeeldingen met circa 88% minder bytes. Android laadt een aparte lichte 3D-viewer pas op verzoek. Kleuren, textuurverwijzingen en alle 300 portretten zijn gecontroleerd; geen ontbrekende of extern afhankelijke modeltexturen.

Vangen gebruikt een snelle opwaartse networp met mik-/veegbonus, directe vaardigheidsfeedback en snel opnieuw proberen. Een vangst telt pas na serverbevestiging. Rondkijken draait vanaf markers en kaart zonder je GPS-centrum te verplaatsen. Geclaimde dagtaken staan onderaan en zijn gedimd. Opruimen selecteert zwakke dubbelen met bescherming voor waardevolle exemplaren; vrijlaten vraagt bevestiging. Bestaande PvP, Echo/NPC's, dagstrijd, gyms, coins/shop, cocons, held items en twee aanvalmeters blijven behouden.

Een nieuwe APK gebruikt zijn eigen [online preview](https://bugbaas-reservaat-preview-lkiv5y5p5-thomas-cim-pro.vercel.app). Werk alle toestellen bij; oudere clients ondersteunen nieuwe soorten niet volledig. Android-autovangst gebruikt na inschakelen een zichtbare locatiedienst voor bewegen met scherm uit/andere app, met nieuwe soorten, minder vangkans dan actief spelen en bevoorrading bij posten. Geforceerd stoppen en batterijbeleid kunnen de dienst beëindigen. De browser vereist een geopende kaart. Terugkomen toont bevestigde vangsten, afstand en opbrengst. Gecontroleerde GPS-afstand telt ook tijdens fietsen en wordt niet meer boven 8 km afgekapt; Health Connect houdt zijn eigen begrenzing en telt afstand niet dubbel.

**Controles:** TypeScript en webexport groen; 412 tests gecontroleerd, met twee verouderde aannames aangepast en beide betrokken bestanden opnieuw groen. Vijf controles op de online preview zijn groen. Het [werkregister](docs/POGO_WERKREGISTER.md) en het release-testverslag bevatten de gerichte browser- en APK-controles. Een nieuwe emulatorinstallatie is wegens de eerdere automatische goedkeuringsblokkade niet uitgevoerd; gesloten-app-GPS/autovangst is nog niet op een toestel bewezen.

**Nog onbewezen:** fysieke telefoonwandeling/prestaties/accu, persoonlijke Google-toestemming, echte Health Connect-afstand en volledige live cloud/Auth-restore. Virtuele posten volgen openbare kaartpaden; fysieke toegankelijkheid is niet gecertificeerd. De gecureerde posten/routesbron blijft uit. De gecontroleerde GPS was gesimuleerd.
