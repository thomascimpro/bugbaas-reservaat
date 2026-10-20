# BugBaas Reservaat — projectstart

> **Voor iedere nieuwe ontwikkelchat:** lees eerst [AGENTS.md](AGENTS.md). Daar staan het verplichte hervatprotocol, de actuele Git-beveiligingswaarschuwing en regels om dubbele ontwikkeling en overbodige hertests te voorkomen.

## Leesvolgorde (één actuele waarheid)
1. **[AGENTS.md](AGENTS.md)** — instructies voor elke Devspace/Codex-agent in deze projectmap.
2. **[Actueel werkregister](docs/POGO_WERKREGISTER.md)** — bovenaan staat de laatste checkpoint, uitvoerder, status en **exact één volgende stap**. Dit bestand is leidend; oude chats niet nodig.
3. [Selectieve testmatrix](docs/POGO_TESTMATRIX.md) — wat test je bij een wijziging; wanneer mag vorig bewijs hergebruikt worden?
4. [Uitvoerbaar 9-task werkplan](docs/superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md) — implementatiestappen, zonder reeds gebouwde zaken opnieuw uit te voeren.
5. [Historisch uitvoeringsverslag](docs/POGO_UITVOERING.md) — bewijs van wat eerder al gebouwd en getest is.
6. [Functioneel Ontwerp](docs/POGO_FO_20261019.md) · [Technisch Ontwerp](docs/POGO_TO_ASSETS_20261019.md) · [Schermschetsen](docs/POGO_SCHERMSCHETSEN_20261019.html).

## Huidige stap
**BB-00: Git-repository binnen BugBaas is aangemaakt door de gebruiker; eerste veilige lokale baselinecommit staat nog open.** Devspace bevestigde dat `git rev-parse --show-toplevel` nu exact de projectmap is en dat branch `main` bestaat. **Niet nogmaals `git init` uitvoeren.** De `.gitignore` beschermt ook gegenereerde `dist-android-v2/` en QA-data. Laatste instructies en ontbrekend commitbewijs staan in het [werkregister](docs/POGO_WERKREGISTER.md). Geen remote push/publicatie zonder opdracht.
