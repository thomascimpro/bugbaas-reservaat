# BugBaas — actuele voortgang

Bijgewerkt: 20 oktober 2026. Houd dit kort: taak, resultaat, controle en wat nog openstaat. Bestaand ontwerp is geen nieuwe todo-lijst.

## ACTUELE CHECKPOINT

**BB-50 kaartfix klaar; BB-60 GPS- en BB-70 providerfix samengevoegd.** Branch `codex/bb-01a-qa-records`.
- Kaart — Codex `/root`: alle gebouwen uit gegroepeerde MultiPolygon-kaartdata worden meegenomen, binnen het bestaande maximum van 100. Voorheen werd alleen het eerste gebouw per groep gelezen.
- Android GPS — Sol 6.1 `g4_android`: vertraagd gestarte GPS-watchers worden ook na achtergrond, herladen, fout of sluiten direct opgeruimd. Ze kunnen geen oude locatiecallbacks blijven sturen.
- Locatiebron — Sol 6.1 `g5_live_world`: gedeelde cache en aanvragen, wachttijd bij fouten/429, stoppen bij 403/406 en onvolledige antwoorden weigeren. Bron en identiteit niet gewisseld.
- Getest: **201/201 functietests, TypeScript en webbuild groen**. Logs: `.local/bb50-70-integrated-tests.log`, `.local/bb50-70-typecheck.log`, `.local/bb50-web-build.log`.
- Browser: stad **100 gebouwen**, bos **160 bomen**; 320/390/430 px breed, terugnavigatie en geen browserfouten. [Screenshots en resultaten](../../bugbaas-map-fix-browser/checks.json). Afzonderlijke QA-accounts en gesimuleerde browserlocatie; geen echte wandeling.
- Sol 6.1 `g1_g3_map` hielp met kaartdiagnose en las de twee agentfixes na: geen blokkerende bevinding.
- BB-01a blijft klaar in commit `4181c33bdb3f8994e077c1364520b3b2941bb085` (8 registratietests; destijds 191 volledige tests).

**Resterende concrete blokkade: BB-70 — toegestane werkende live bron voor posten/routes.** Bestaande providerweigering niet opnieuw blijven proberen. Androidbouw blijft apart geblokkeerd door Java-loopback. Extra testselectie/runner/CI bouwen we nu niet; zie het [eenvoudige plan](superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md).

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
| BB-50 | Webkaart/GPS/vangen | Kaartbebouwing hersteld; stad/bos en navigatie op drie telefoonbreedtes browsergetest. |
| BB-60 | Android | GPS-start/stop-race opgelost, 7 gerichte tests groen. Echte uitvoering geblokkeerd door Java-loopback en ADB unauthorized. Fysieke wandeling/GPU/accu open. |
| BB-70 | Posten/routes | Cache/foutafhandeling verbeterd, 10 gerichte tests groen. Toegestane betrouwbare live bron en veilige buitenroute open; providerblokkade niet omzeilen. |
| BB-80 | Nesten/raids | Later, niet gebouwd. |
| BB-90 | Release/cloudherstel | Lokale QA-restore geslaagd (600 records); echte cloudrestore, Android-wandeling en productieakkoord ontbreken. |

## Bewijs en regels
- [Historisch uitvoeringsverslag](POGO_UITVOERING.md): eerdere 28 schermchecks, 13 navigatiechecks, 5 native-brugchecks en 5 synthetische post/routechecks. Dit is geen nieuwe run op iedere wijziging.
- Unit-/TypeScript-runs voor BB-01a staan in `qa/runs.jsonl`; de nieuwe spelcontroles staan in bovenstaande logs en screenshots. Geen volledige schermscan herhaald.
- Browserbrug ≠ echt Android. Synthetische punten ≠ veilige live route. Oude auteurs blijven onbekend als ze niet aantoonbaar zijn.
- Geen productiepublicatie, reset van spelerdata of remote push uitgevoerd.

## Bijwerken na een taak
Eén korte notitie volstaat: **taak — gedaan — getest (commando of screenshot) — eventueel geblokkeerd — volgende stap**. Gebruik het bestaande bewijs waar dat nog relevant is; bouw geen extra administratie om een gewone fix heen.

Ontwerpdetails: [FO](POGO_FO_20261019.md) en [TO](POGO_TO_ASSETS_20261019.md). [Testmatrix](POGO_TESTMATRIX.md) is een hulpmiddel, geen verplicht traject voor iedere wijziging.
