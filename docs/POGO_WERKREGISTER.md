# BugBaas — actuele voortgang

Bijgewerkt: 20 oktober 2026. Houd dit kort: taak, resultaat, controle en wat nog openstaat. Bestaand ontwerp is geen nieuwe todo-lijst.

## ACTUELE CHECKPOINT

**BB-01a klaar.** QA-bewijsregistratie staat in commit `4181c33bdb3f8994e077c1364520b3b2941bb085`, branch `codex/bb-01a-qa-records`.
- Gebouwd: `scripts/qa/record.ts`, `tests/qaRecord.test.ts`, `qa/runs.jsonl`.
- Getest: **8/8 nieuwe tests, 191/191 volledige unit-tests en TypeScript groen**. Direct uitgevoerd met Node 24.16.0 / tsx 4.23.15; run-ID's en inputvingerafdrukken staan in `qa/runs.jsonl`, logs in `.local/bb01a-20261020135421-034bec20-*.log`.
- Bouwer/tester van integratie en aanvullingen: Codex GPT-6 `/root`. De gelijktijdig overgenomen implementatie is behouden; geen onbekende auteur ingevuld. Geen onafhankelijke review claimen.
- De andere schrijvende chat heeft op verzoek van de gebruiker een stopbericht ontvangen. De drie Sol 6.1-agents vielen uit met `Your workspace is out of credits`; geen appwijzigingen van hen samengevoegd.

**Volgende taak: BB-50 — ontbrekende bebouwing op de webkaart onderzoeken en gericht oplossen.** Extra testselectie/runner/CI bouwen we nu niet. Werk volgens het [eenvoudige plan](superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md).

## Stand per onderdeel
| ID | Onderdeel | Stand / resterend |
|---|---|---|
| BB-00 | Eigen Git-repo | Klaar: baseline `ab57e804118251ab2ca184a9eff200932555467c`. Niet opnieuw initialiseren. |
| BB-01a | Bewijsregistratie | Klaar + gericht getest, zie checkpoint. |
| BB-01b/c/d | Extra QA-automatisering | Geparkeerd; geen voorwaarde voor verder spelwerk. |
| BB-10 | Menu/navigatie/camera | Web gebouwd, eerder browsergetest. Alleen hertesten bij relevante wijzigingen. |
| BB-20 | Dex/collectie/detail/evolutie | Web gebouwd: #001–030 en rups → mot; native detail is nog 2D-fallback. |
| BB-30 | 3D-bugs en shiny-art | 30 soorten en 60 portretten gebouwd; eerdere artcontrole beschikbaar. |
| BB-40 | Tas/dagtaken/trainer/buddy/vrienden/PvP | Web gebouwd; eerdere schermchecks beschikbaar. |
| BB-50 | Webkaart/GPS/vangen | Gebouwd en eerder getest; ontbrekende stadsbebouwing is de eerstvolgende concrete verbetering. |
| BB-60 | Android | Brug gesimuleerd getest; echte uitvoering geblokkeerd door Java-loopback en ADB unauthorized. Fysieke wandeling/GPU/accu open. |
| BB-70 | Posten/routes | Server en webflow getest met synthetische data. Toegestane betrouwbare live bron en veilige buitenroute open; providerblokkade niet omzeilen. |
| BB-80 | Nesten/raids | Later, niet gebouwd. |
| BB-90 | Release/cloudherstel | Lokale QA-restore geslaagd (600 records); echte cloudrestore, Android-wandeling en productieakkoord ontbreken. |

## Bewijs en regels
- [Historisch uitvoeringsverslag](POGO_UITVOERING.md): eerdere 28 schermchecks, 13 navigatiechecks, 5 native-brugchecks en 5 synthetische post/routechecks. Dit is geen nieuwe run op iedere wijziging.
- Nieuwe unit-/TypeScript-runs voor BB-01a staan in `qa/runs.jsonl`. De game/browser is voor die tooling niet opnieuw opgenomen; spelcode en UI zijn niet gewijzigd.
- Browserbrug ≠ echt Android. Synthetische punten ≠ veilige live route. Oude auteurs blijven onbekend als ze niet aantoonbaar zijn.
- Geen productiepublicatie, reset van spelerdata of remote push uitgevoerd.

## Bijwerken na een taak
Eén korte notitie volstaat: **taak — gedaan — getest (commando of screenshot) — eventueel geblokkeerd — volgende stap**. Gebruik het bestaande bewijs waar dat nog relevant is; bouw geen extra administratie om een gewone fix heen.

Ontwerpdetails: [FO](POGO_FO_20261019.md) en [TO](POGO_TO_ASSETS_20261019.md). [Testmatrix](POGO_TESTMATRIX.md) is een hulpmiddel, geen verplicht traject voor iedere wijziging.
