# BugBaas — actuele voortgang

Bijgewerkt: 20 oktober 2026. Houd dit kort: taak, resultaat, controle en wat nog openstaat. Bestaand ontwerp is geen nieuwe todo-lijst.

## ACTUELE CHECKPOINT

**Vier PoGO-achtige spelonderdelen uitgevoerd met drie Sol 6.1-agents en root.** Branch `codex/bb-01a-qa-records`.
- Collectie — `g1_g3_map`: naam/dex, CP-bereiken, IV-sterren, shiny/favoriet/buddy/team; combineren met `&`/`!`, snelkeuzes, reset en waarschuwing vóór een power-up een leaguegrens overschrijdt.
- Onderzoek — `g4_android`: één stempel per serverdag bij de eerste opgehaalde dagtaak. Gemiste dagen wissen niets. Iedere zeven stempels automatisch 500 nectarstof, 10 veldnetten, 2 lokbloemen en 1 snelle TM. Bestaande claims/XP blijven behouden.
- Vrienden — `g5_live_world`: eerste echte dagvangst (ook auto) geeft een habitatkaart, max. 10 in de tas. Sturen/openen werkt via bestaande servertransacties/receipts; één cadeau per vriend per dag, geen nieuw zolang ongeopend, maximaal één vriendschapspunt per paar per dag. Harten op 1/7/30/90 dagen en kaartenalbum. Openen: 5 veldnetten, 1 lokbloem, 100 stof. Her-toevoegen reset de cadeaugeschiedenis niet. Geen locaties gedeeld.
- Vangen/HUD — `/root`: geanimeerde vangstfeedback met bevestigde CP/XP/stof/soortnectar, badge voor nieuwe soort en knop naar de collectie. Echte eindige netvoorraad. Klaarstaande onderzoeken, cadeaus en dagbox krijgen een kleine cijferbadge.
- Getest: **219/219 functietests, TypeScript en webbuild groen**. Logs `.local/pogo-slice-tests.log`, `.local/pogo-slice-typecheck.log`, `.local/pogo-slice-web-build.log`.
- Browser: echte vangst, combinatiezoekfunctie/reset, CP-waarschuwing, zevende stempel/eenmalige beloning en twee spelers die vrienden worden/cadeau sturen/openen. 320/390/430 px bekeken; geen browserfouten. [Screenshots en resultaten](../../bugbaas-pogo-slice/checks.json). Alleen geïsoleerde QA-accounts, ingerichte testvoortgang en gesimuleerde GPS; geen echte wandeling.
- Eerder afgerond: BB-01a (`4181c33`); kaartbebouwing/GPS-opruiming/providerfouten (`b6fdb4a`). Stad 100 gebouwen en bos 160 bomen eerder browsergetest; geen nieuwe kaartscan nodig voor deze spelonderdelen.

**Resterende concrete blokkade: BB-70 — toegestane werkende live bron voor posten/routes.** Bestaande providerweigering niet opnieuw blijven proberen. Androidbouw blijft apart geblokkeerd door Java-loopback. Extra testselectie/runner/CI bouwen we nu niet; zie het [eenvoudige plan](superpowers/plans/2026-10-20-bugbaas-selectieve-qa-en-tracking.md).

## Stand per onderdeel
| ID | Onderdeel | Stand / resterend |
|---|---|---|
| BB-00 | Eigen Git-repo | Klaar: baseline `ab57e804118251ab2ca184a9eff200932555467c`. Niet opnieuw initialiseren. |
| BB-01a | Bewijsregistratie | Klaar + gericht getest, zie checkpoint. |
| BB-01b/c/d | Extra QA-automatisering | Geparkeerd; geen voorwaarde voor verder spelwerk. |
| BB-10 | Menu/navigatie/camera | Web gebouwd, eerder browsergetest. Alleen hertesten bij relevante wijzigingen. |
| BB-20 | Dex/collectie/detail/evolutie | Web gebouwd: #001–030 en rups → mot; uitgebreid zoeken en CP-grenswaarschuwing getest. Native detail nog 2D-fallback. |
| BB-30 | 3D-bugs en shiny-art | 30 soorten en 60 portretten gebouwd; eerdere artcontrole beschikbaar. |
| BB-40 | Tas/dagtaken/trainer/buddy/vrienden/PvP | Web gebouwd; uitgebreid met zevenstempelboek, echte cadeaus en vriendschapsharten. Nieuwe flows browsergetest met twee QA-spelers. |
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

Mechaniekreferenties: [collectiezoeken](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/1486-searching-filtering-your-pokemon-inventory/?pgo_client=iOS), [onderzoeksstempels](https://pokemongo.com/news/research), [cadeaus](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/85-sending-receiving-gifts/?game_client=iOS&l=en). BugBaas gebruikt eigen assets en bovenstaande eigen beloningsbundels.

Ontwerpdetails: [FO](POGO_FO_20261019.md) en [TO](POGO_TO_ASSETS_20261019.md). [Testmatrix](POGO_TESTMATRIX.md) is een hulpmiddel, geen verplicht traject voor iedere wijziging.
