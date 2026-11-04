# Animaties — uitvoercontract voor Claude

**Actueel: 4 november 2026.** Alle zeven oorspronkelijke games zijn technisch aangesloten, met squadsteun, replay, oefenen en async ranked. Claude bouwt de presentatie hieronder op deze bestaande ports. De oude remake-instructies zijn vervangen; geen tweede spelkern maken. Functioneel bewijs staat in `tester.md`; eindkwaliteit van animaties, 3D en alle telefoons is nog open.

Visuele bronnen: het creatorpakket `../../../../bugbaas-creatorpakket-20261102/`, previews P00/P13/P14/P15, `asset-manifest.json` en `08_ASSETREVIEW.md`. De oorspronkelijke mechanics in `game/arcade/original/` gaan voor oude regels in `games.json` en de TO/FO. De previews bepalen sfeer/compositie, niet opnieuw de physics. Eén Speel rouleert; Spellen biedt optioneel oefenen; Ranked geeft een willekeurig menselijk scoreduel.

## Beeld, beschikbare bronnen en afbakening

Volwassen HD-natuur, herkenbare insectanatomie, schors, mos, warm boslicht; donkere teal-glaspanelen, dunne randen, cyaan hoofdactie. De scène domineert. Geen beeldvullende witte flits, kinderlijke rubberlichamen of permanent trillende camera. Hooguit één korte doelzin; echte tekst, hitgebieden en meters liggen boven losse art. Houd gameobjecten, hun schaduw, effect en HUD gescheiden.

Het actuele assetmanifest bevat **26 sets en 16 losse cutouts: acht normaal/shiny-paren**. De oudere tekst die 23 sets/acht figuren noemt is achterhaald. A10/A11 zijn stijlreferenties; voor losse figuren gebruik je de expliciete cutouts. A04 bevat lucht/blad/vuur/schild; A25 water/insect/gif/normaal; A26 grond/steen/staal/duister. Daarmee hebben alle elf typen effectart; schild is een toestandseffect. A14 heeft vier netframes met gemeten handvatpivot; A18 vier sparkleframes. Gebruik `regions[].rect` en de opgegeven anchors uit `asset-manifest.json`, geen aangenomen uniforme atlascel. Aanwezige frame-art is pas runtime-ready na afspeelcontrole.

Voor de 153 bestaande GLB's zijn animatie-aliassen voor idle/walk/attack/hit/dead beschikbaar. Verifieer de daadwerkelijke clipmapping per model; een alias is geen nieuwe HD-animatie. De 15 bestaande trainer-ID's behouden hun model-/portretkoppeling. Claude rendert afzonderlijk 306 HD-portretten; raak die renderreeks, authoring en uitvoer niet aan. Acht nieuwe cutoutparen betekenen niet dat 153 soorten handgetekend HD klaar zijn.

## Gemeenschappelijk event- en tijdcontract

De eventnamen in de tabellen zijn het te binden presentatiecontract, geen claim dat een volledige nieuwe eventadapter al bestaat. De huidige ports leveren originele state/kleine effectlijsten; leid alleen de ontbrekende presentatie-events daarvan af, met een stabiel run-ID en volgnummer. Voeg geen tweede simulator of klok toe.

Een presentatie-event bevat `eventId`, `runId` of `battleId`, `tick`, `entityId`, eventueel `targetId`, `type`, `amount` en `outcome`. De simulator/server bepaalt spelgebeurtenissen; de renderer vertaalt ze naar beeld. Een herhaald event-ID speelt geen tweede reward, haptic of muntgeluid af. Visuele afronding schrijft nooit score, schade, voorraad of specimen.

Arcade simuleert in stappen van **20 ms**, logisch veld **360×640**. Tabelduren hieronder zijn presentatieduren, tenzij expliciet een spelvenster genoemd wordt. `onAnimationEnd`, audio-einde, video-einde, renderframes en particle-aantallen mogen nooit spelregels uitvoeren. Bij frameverlies render je de actuele toestand en vervallen oude effecten; geen vertraagde reeks achterstallige treffers. Bij een laat gevechtsevent begin je op de juiste tijdsfase. Een animatie mag visueel afbreken voor KO, einde, navigatie of nieuwere state.

Hitgebieden volgen logische positie/straal uit de simulator. Interpoleer bewegende figuur en interactieregio vanuit dezelfde toestand; schaduw, glans, vleugeltip, glow en trail vergroten niets. Een UI-knop ontvangt zijn eigen input en blokkeert de spelactie eronder. Geen extra tikvenster door squash, dodgerol of fade. Pointer capture opruimen bij cancel/blur; vasthouden wordt bij hervatten niet stil voortgezet.

De renderer kent drie lagen: blijvende toestand (HP/waarschuwing/richtlijn), korte reactie en decor. Reduced motion verwijdert alleen verplaatsende/knipperende decoratie; spelbeweging blijft nodig en identiek. Geen stroboscopie; gebruik bij onkwetsbaarheid een vaste contour in plaats van snel knipperen. Low gebruikt DPR 1, 30 renderfps, maximaal acht effectdeeltjes en geen fullscreenblur/parallax. De simulator houdt dezelfde ticks en uitkomst. Normaal: maximaal 24 effectdeeltjes, hoog 40; pool korte effecten/projectielen. De Bubbelzwerm-grid is een gebatchte bordlaag, geen reden om tientallen afzonderlijke geanimeerde rendercomponenten te maken.

Audio hergebruikt de aanwezige gelicenseerde bronnen: `battle-loop.mp3`, `knifeSlice.wav`, `success.wav`, `win.wav`, `lose.wav`, `shiny.wav`, `handleCoins.wav` en natuurambient. Koppel eerst aan bestaande audio-service en credits; maak geen nieuwe pieptoon als vervanging. Maximaal één impactgeluid per 80 ms en vier stemmen. Haptics zijn optioneel: licht 10 ms, verlies 25 ms, succes twee korte pulsen; bestaande toestel-/gebruikersinstelling gaat voor. Reduced motion zet haptics niet zelfstandig aan. Geen geluid nodig om een waarschuwing te begrijpen. Alle tabellen gebruiken deze limieten.

## Gedeelde start, einde en rewards

| Event / trigger | Beeld en duur | Gedrag, audio en haptic |
| --- | --- | --- |
| `run.assetsReady` — benodigde assets gedecodeerd | Statische lobby wordt klaar; cyaan Speel actief | Tijd begint pas met geldig startticket en aftelling; laad alleen dit spel en de gekozen squad. |
| `run.countdown` — startticket ontvangen | 3–2–1, elk 1000 ms, eenvoudige opacity; voorbeeldgebaar eenmaal | Exact drie seconden; geen tweede Start. Low/reduced: statische cijfers; zacht ticksignaal optioneel. |
| `run.overlayOpened` — pauzemenu | Donker glas 120 ms; scoreduel loopt zichtbaar door | Oefenen mag alleen pauzeren wanneer zijn regels dat toestaan. Een score-run krijgt geen extra tijd. Achtergrond-abort geeft geen reward. |
| `run.finished` — tijd, objective of alle levens op | Gameplayinput stopt op eindtick; laatste beeld, uitslagpaneel 180 ms | Score en oorzaak direct beschikbaar; effecten afkappen. Geen winstjingle bij alleen een onbevestigde lokale overwinning. |
| `result.pending` — submit/ACK onzeker | Score bewaard; statisch cloudicoon, Wacht op verbinding, Beloning volgt | Zelfde run/receipt opnieuw. Geen stof-/XP-teller ophogen, confetti of muntgeluid. Navigatie blijft beschikbaar. |
| `result.accepted` — bewaarde serverreceipt | Definitieve score; rewardregels in 160 ms; bedragen hooguit 350 ms optellen | Werkelijk bedrag staat meteen toegankelijk in tekst. Eén succesklank/haptic; Volgende ronde direct bruikbaar. Bedragen uitsluitend uit receipt. |
| `result.record` / `medal.unlocked` — bevestigd nieuw record/medaille | Eén gecombineerde glans 450 ms, medaille 300 ms | Geen stapel popups. Medaille brons/zilver/goud op 3/10/30 unieke geldige runs; geen extra grondstoffen verzinnen. |
| `result.rejected` / `result.practice` | Score niet opgeslagen met korte reden, of Oefenen; 120 ms | Geen beloningsclaim. Oefenen geeft geen stof, XP, medailleprogressie of ranked score. |

Reduced motion maakt paneelovergangen direct en bedragen statisch; low gebruikt één glowvlak in plaats van particles. Alle zeven spellen gebruiken exact deze resultaattoestanden. Verlies kan een geldige beloonde run zijn; beoordeel de ticket-/kwalificatieregels, geen kleur van het eindscherm. Dagwaarden: eerste drie geldige runs ieder 75 stof/20 XP, eenmalig 100 stof bij de eerste, eventuele echte scorewinst +25 binnen budget; maximaal 400 stof/60 XP. Na budget geen nepbedrag. De weekbeloning na vijf verschillende geldige speeldagen (500 stof en vijf nectar van een werkelijk aanwezige buddyfamilie) wordt al atomair in de Arcade-receipt verwerkt; geen tweede claimknop of extra betaling toevoegen. Bij Ranked kan de echte winstbonus later met de definitieve dueluitslag volgen. Een wachtende score is nog geen winst; oefenen heeft uitsluitend een eigen oefenrecord. Persoonlijk record, scorevergelijking en tegenstander tonen alleen geldige brondata: **Eerder gespeeld**, **Opgeslagen team** of **Veldwachter**, nooit verzonnen online aanwezigheid.

## Zeven originele games — uitvoerbare animatieopdrachten

Alle scene-paden hieronder staan onder `src/arcade/original/`, de bijbehorende pure state onder `game/arcade/original/`. Het gedeelde `OriginalArcadeFieldV3.tsx` bezit de 20ms-klok, invoerlog en eindbeslissing. Claude beheert de presentatie; verander geen simulatie of inputbetekenis. Bouw geen algemene eventbus als een kleine presentatiebinding in de scene volstaat. Gebruik per object zijn bestaande ID en oude/nieuwe snapshot; houd effectlijsten begrensd en ruim op bij sluiten.

### 1. Tikduel — GM-01, P13.1, 30 seconden

- **Behoud:** 56 gekozen doelen uit de oude catalogus; bewegingspatronen, 2/3/5/7/9 tikken volgens zeldzaamheid, oorspronkelijke punten, 650 ms-combo en vijfde-combobonus. Eigen squad helpt mee. Geen tegenaanval-/KO-remake toevoegen.
- **Bron/binding:** `TapDuelScene.tsx` / `tapDuel.ts`: `originalTapTargets`, `hitCounts`, `caughtBugIds`, `combo`, `helperReadyAt`, `effects[{at,kind,x,y,helper,points,targets}]`.
- **Maak:** vleugel-/loopbeweging met logische doelpositie; tikimpact80–140ms, herkenbare resterende tikjes; combo-pulse160ms; gevangen doel fade180ms/+punten250ms; eigen helperuitval140ms/type-trail120ms. Behoud invloed van freeze/slow en de echte cooldown.
- **Art/controle:** huidige portretten en A04/A25/A26, geen 1000 nieuwe collectiebugs verzinnen. Los herhaalde/onpassende doelportretten gericht op; behoud de oorspronkelijke catalogusidentiteiten. Eén HUD; normaal/low/reduced dezelfde raakdoelen en score.

### 2. Webrenner — GM-04, P13.2, overleven

- **Behoud:** drie banen, swipe links/rechts, tik/omhoog-swipe voor 620 ms-sprong, web/vliegende vijand, nectar/schild/magneet/boost, oorspronkelijke combo- en moeilijkheidstoename. Natuurlijke afloop;600 s is de technische bovengrens, geen 45 s-rondje.
- **Bron/binding:** `WebRunnerScene.tsx` / `webRunner.ts`: `lane`, `entities[id,kind,lane,y]`, `jumpUntil`, `shield`, `magnetUntil`, `boostUntil`, `hitCount`, `combo`.
- **Maak:** familie-walkloop, baanlean/herstel100ms; sprongpose volgt exact het620 ms-venster; webcontact120ms, schildbreuk180ms, hart direct; nectar120ms, magneetcontour en boosttrail die eindigen op de state-deadline. Geen extra tijd of score uit een clip.
- **Art/controle:** hergebruik `assets/v3/original/runner/` en de bestaande imports in de scene. Springen zichtbaar boven obstakels; vliegende vijand onderscheidbaar. Low/reduced beperken decor, niet obstakels.

### 3. Nestwacht — GM-02, P13.3, 150 seconden

- **Behoud:** werkelijk pad, vijf torenplekken, drie torentypes, upgrades, bouwmunten, zeven vijandrollen, waves/boss, handmatig tikken met combo, Spray en Kleefweb. Oorspronkelijke 125 munten / 13 HP vóór squadsteun. Geen drie-banen-schietremake.
- **Bron/binding:** `NestDefenseScene.tsx` / `nestDefense.ts`: `towers[id,kind,level,cooldownUntil]`, `enemies[id,kind,hp,progress,slowUntil]`, `wave`, `coins`, `hearts`, `impacts[id,x,y,at]`, `slowZones`, `sprayCooldownUntil`, `stickyCooldownUntil`.
- **Maak:** bouwen220ms/upgrade250ms; leesbare rapid/heavy/slow-profielen; torenreactie100–180ms en impact120ms op de echte treffer; tankpantser/healer-aura/zwerm/boss in beeld herkenbaar; lekkage150ms/HP direct; Spray250ms, web uitvouwen180ms en stategebonden cooldownmeters.
- **Art/controle:** `assets/v3/original/nest/`, A03/A04/type-art. Vervang NORMAL/FAST enz. door korte icooncues/uitleg. Bouwknoppen blijven op korte telefoons raakbaar; één timer/score. Geen extra torens of economische aanpassingen.

### 4. Windvlucht — GM-05, P14.1, overleven

- **Behoud:** vrije XY-vlucht, tikimpuls links/rechts, zwaartekracht/inertie, acht objectsoorten, hartjes/schild/wind/pollen/streak. Geen poortjes of vasthouden-om-te-vliegen. Natuurlijke afloop,600 s bovengrens.
- **Bron/binding:** `BugGlideScene.tsx` / `bugGlide.ts`: `x/y/vx/vy`, `entities[id,kind,x,y]`, `tapPulses`, `hits`, `hearts`, `shieldUntil`, `windUntil`, `streak`.
- **Maak:** vleugelslag op tik140ms, lichaamslean uitvx/vy; pickup120ms/streak160ms; hart- en schildreactie180ms; windstrook zolang `windUntil` geldt; vogel/regen/doorn visueel verschillend. Heldere waarschuwing zonder extra reactietijd.
- **Art/controle:** bestaande scene-imports/oorspronkelijke assets. Noodzakelijke vlieg-/objectbeweging blijft bij reduced; geen decorparallax in low. Tick-/collisionposities gelijk houden.

### 5. Vlinderjacht — GM-06, P14.2, 60 seconden

- **Behoud:** echte oude 360°-webwereld, slepen/optionele sensor, insect 1,5 s volgen tot 100%, originele880 ms-netslag met daadwerkelijke hit op 48%,980 ms-cooldown, ontwijking/respawn en oorspronkelijke streakbonus. Geen net ernaartoe slepen als vangmechaniek.
- **Bron/binding:** `ButterflyCatchScene.tsx`, `ButterflyWorld.ts` / `butterflyCatch.ts`: `cameraQ`, `bugs[index,points,phase,dodgeUntil,caughtUntil,captureAt]`, `aimedBug`, `focusProgress`, `swinging`, `swingStartedAt`, `captureCooldownUntil`, `catches`, `streak`, `message`.
- **Maak:** verbeter boslicht/materialen en insectanatomie; focusmeter/navolgbare vangzone, nette netswing vanaf juiste pivot, bevestigde catchreactie200ms, misser120ms, geen onnodige camera-shake. Oorspronkelijke hitframe en respawn blijven leidend.
- **3D/native:** de browser tekent het gekopieerde procedurele Three-bos. Native gebruikt nu een projectie/portretfallback; dat is nog geen volwaardige native 3D-levering. Hergebruik bij 3D-aansluiting de bestaande host/WebView-mogelijkheid als passend; geen nieuwe nativeengine. Bewijs native apart en behoud de werkende fallback.

### 6. Bladtoren — GM-07, P14.3, overleven

- **Behoud:** vasthouden om te rennen/laden, loslaten om te springen,360 ms-landingsvenster voor salto, munten/raket/MEGA-veer, bewegende smallere platforms en stijgende druk. Geen automatische bounce. Natuurlijke valafloop,600 s bovengrens.
- **Bron/binding:** `BugTowerScene.tsx` / `bugTower.ts`: `player[x,y,vx,vy,grounded,spinning,spinAngle]`, `platforms[id,x,y,width,floor]`, `pickups`, `runDistance`, `chainUntil`, `combo`, `rocketUntil`, `rocketCooldownUntil`, `springReady`.
- **Maak:** loop/lading uitstate; afzet100ms en landing120ms zonder nieuwe hitbox; salto volgt `spinAngle`; markeer het echte 360 ms-venster, geen extra venster na animatie; rakettrail zolang actief, veerreactie180ms, munt120ms, valfade180ms.
- **Art/controle:** bestaande bladeren/pickups; haal technische platformnummers en lange instructies uit het primaire veld. Linker/rechteraanraakstrook op korte schermen48px breed; dezelfde spelcoördinaten behouden.

### 7. Bubbelzwerm — GM-03, P15.1, overleven

- **Behoud:** richten/loslaten, kaatsen, originele clustering/losvallers/combo, Bom/Freeze, oplopende drukrijen en levels met 3→6 kleuren. Een leeg bord start de volgende level, geen vroeg eindscherm. Natuurlijke drukafloop,600 s bovengrens.
- **Bron/binding:** `BubbleSwarmScene.tsx` / `bubbleSwarm.ts`: `board[id,kind,row,col,power]`, `aim`, `projectile[path,startedAt,resolveAt]`, `currentShot`, `nextShot`, `shotCount`, `combo`, `popped`, `level`, `nextPressureAt`, `freezeUntil`, `impact`.
- **Maak:** afgeschoten bubbel op de echte path/flighttijd; verwijdercluster180ms en vallers250ms vanaf echte oude bordposities; bom200ms, Freeze-contour zolang actief, levelreveal250ms en drukwaarschuwing als vaste vormcue. De originele vlucht+120ms-resolutie niet versnellen via animatie.
- **Art/controle:** `assets/v3/original/bubble/`, duidelijke soortvorm naast kleur, next-shot altijd zichtbaar. Effecten blokkeren richten niet. Low/reduced verwijderen particles maar behouden de werkelijke board/flight/uitkomst.

Voor **iedere game**: korte passende geaccepteerde hit-/pickup-/mislukklank, geen oude piepjes of geluid voor iedere renderframe; gebruik bestaande audio en volume/mute. Haptic alleen indien ondersteund en begrensd. Sluiten/achtergrond/accountwissel stopt de eigen effecten en klanken. Bewijs minimaal een invoerreactie, fout/schade, eindresultaat en receipt; gelijk gedrag op normaal/low/reduced. De survivalgames tonen verstreken tijd, de getimede games resterende tijd. Assets die nog geen nette bron hebben blijven expliciet open, niet vervangen door tekstvakjes.

## Squadcombat en Plaagbende

Combat volgt P00 met echte squadstats. De markering voor gericht tikken geeft maximaal 15% basisschadebonus, geen energiebonus. Gewone veldtik blijft een basisaanval; twee charges en reserveknoppen horen uitsluitend hier. Onderstaande vensters zijn gameplaydata, geen vrij aanpasbare clipduren.

| Event / trigger | Benodigde presentatie | Tijd, input en resultaat |
| --- | --- | --- |
| `combat.basicAccepted` / `combat.hit` | Familie-`attack`, type-trail en `hit` als Tikduel | Presenteer in 140–220 ms; echte movecooldown blijft leidend. Houd-aanvaloptie herhaalt gewone aanvallen binnen die limiet. |
| `combat.chargeStarted` | Type-embleem, rustige aanloop, duidelijke waarschuwing + aftelring | Aanloop exact 1000 ms, beide basisaanvallen gepauzeerd. Energie bij start afgeboekt; geen afzonderlijk minispel. |
| `combat.dodgeWindowOpened` / `combat.dodgeAccepted` | Pijl/ontwijkicoon; zijdelingse pose 160 ms, contour 200 ms | Venster laatste 650 ms; horizontale veeg ≥40 logische px, twee teamontwijkingen, 75% minder schade. Geen hitboxverplaatsing die volledige immuniteit suggereert. |
| `combat.chargeResolved` | A04/A25/A26 impact 240 ms; sterk/zwak-vormcue | HP/damage op vast resolve-event, niet op zichtbare impactframe. Geen drie seconden extra wachten. |
| `combat.switched` / `combat.activeKO` | Uit-/intrede samen 300 ms; KO `dead` 220–400 ms | Wisselcooldown 12 s. KO-reservekeuze maximaal 5 s; default uit sim. Clip kan reserve niet blokkeren. |
| `combat.finished` | Gewonnen/Verloren/Gelijk, 180 ms paneel | 180 s tiebreak volgens regels; gym/raid eigen objective. Rating en rewards uitsluitend bevestigde receipt. |

Reduced: vaste charge-/dodge-iconen, geen camera-uitval; low: één type-impact en clipalias per actieve bug. Geluid: één slice/impact, charge-opbouw zacht, warning leesbaar zonder audio, winst/verlies pas bevestigd; haptic licht bij eigen geaccepteerde actie, 25 ms bij ontvangen charge. Opgeslagen team blijft herkenbaar computergestuurd; geen bewegende onlinebadge als bewijs van aanwezigheid.

Plaagbende hergebruikt vier complete games en combat; maak geen vijfde bediening. `crew.appeared`: kaarticoon/ballon rustig bob 1800 ms (reduced/low stil). `crew.encounterOpened`: portret en vaste kaart fade 150 ms, één Speel. `crew.targetReached`: direct sim-einde bij vast doel, geen uitspelen tot timer. `crew.defeated`: portretreactie 300 ms; daarna gedeeld pending/accepted. `crew.rescueGranted`: uitsluitend bevestigde rescue verschijnt in 350 ms, A18 alleen bij werkelijk shiny. Geen tweede vangstrol of netverbruik. Baretbende/Olijfgarde heropenen met hetzelfde encounter-ID, game/doel/rescue; geen reroll door animatie of retry. Eerste maximaal drie bevestigde bende-overwinningen: 250 stof/100 XP/rescue met drie familie-nectar, eigen budget. Geen Arcadebeloning/medaille ernaast. Retry toont dezelfde ontmoeting; verlopen encounter een korte echte fout. Leider gebruikt hetzelfde combatpakket, één vijandontwijking versus twee van speler.

## Behouden PoGO-loop als gedeeld animatiepakket

| Event / trigger | Asset en timing | Behoud van spelwaarheid / reduced & low |
| --- | --- | --- |
| `map.entityAvailable` / `map.entitySelected` | Bestaande GLB idle/walk; ring 200 ms, post/gym/raidprop | Bereik uit echte state, geen gloed buiten bereik als interactiebelofte. Low instancing/statisch idle; reduced geen bob/camerazoom. |
| `map.postRewarded` | Post draait hooguit 500 ms; bevestigde itemregel | Voorraad alleen receipt; heropenen betaalt niet opnieuw. Reduced statische statuswissel; low één draaiende prop. |
| `net.throwAccepted` | A14 vier frames samen maximaal 400 ms, gemeten pivot; baan uit bestaande worp | Snelle opwaartse veeg/loslaatsnelheid blijft; traag slepen kost geen net. Animatie parallel aan server; reduced korte netpose, low twee frames. |
| `net.captureConfirmed` / `net.escaped` | Bug/netreactie 200–350 ms; echte vangstkaart of ontsnapping | Geen Vangst!-viering tijdens onzekere ACK. Dezelfde receipt retry; shiny pas bevestigde variant. Audio succes/shiny eenmaal, verlies zacht; haptic 2×kort of licht. |
| `cocoon.ready` / `cocoon.hatched` | Coconprops: rustglans 1200 ms; openen 700 ms, reveal 350 ms | Afstand/specimen uit server, geen versnelling door clipoverslaan. Direct overslaan mag; reduced statische reveal, low geen shellparticles. |
| `evolution.confirmed` | Oud→familiespecifiek nieuw model/cutout, glow 500 ms, reveal 500 ms | Kosten eerst bevestigen; dezelfde specimen-ID/IV/shiny/level/historie. Geen vergrote oude sprite als ander stadium. Reduced directe voor/na, low crossfade. |
| `powerup.confirmed` | Eén pulse 220 ms; werkelijke CP/stat-voor/na | Toon eerst echte kosten, pas receipt past bezit aan. Geen stijgende teller zonder serverdelta. Reduced/low vaste nieuwe waarden. |
| `gym.stateChanged` / `gym.rewardGranted` | Ploegkleur/bezette plekken direct, torenaccent 300 ms; munten 350 ms | Alleen bevestigde plaatsing/terugkeer/muntdelta. Winst maakt gym niet automatisch vrij. Reduced geen torenrotatie; low statische prop. |
| `raid.started` / `raid.finished` | Cocon→baas 700 ms, boss idle/attack/hit/dead; objective-timer blijft zichtbaar | Echte lobby/ready-state, geen fictieve deelnemers; timeout is geen winst. Vangstrecht/rewards na bevestiging, geen automatische specimenclaim. Reduced reveal direct; low bestaande bossalias. |
| `return.syncPending` / `return.summaryConfirmed` | Rustige cloudstatus; bevestigde km/vangsten/buddy/cocons/rewards in één paneel 180 ms | GPS/Health-ontdubbeling blijft; geen Arcade als wandelmeters. Individuele vangsten achter tik, geen verplichte revealrij. Reduced/low statisch overzicht, geluid één keer. |

Alle bedragen blijven leesbaar zonder uitanimatie. Gebruik optionele korte sound/haptic bij bevestiging, nooit een blijvende loop voor onzekere sync. Afstand, voorraad, evolutiekosten en kansen blijven de bestaande serverregels; dit pakket verandert geen economie of data.

## Claude-assetpakketten en definitie van compleet

Lever onderstaande pakketten als losse runtime-assets/profielen met één machineleesbaar manifest, bijvoorbeeld `assets/v3/animations/source.json`; dit is een doelpad, nog geen bestaand bestand. Per record: bron/provenance, type (GLB/sprite/procedureel), semantische clipalias, expliciete regio/pivot, schaal/contactpunt, duur/loop, eventbinding, quality-/reducedfallback en status. Geen volledige schermvideo per soort/move; gameplay blijft opgebouwd uit realtime lagen. Eén korte demonstratie per game/flow is bewijs, geen runtime-afhankelijkheid.

| Pakket | Concrete levering aan Claude | Volledigheidscriterium |
| --- | --- | --- |
| FX-01 — kern | Eventadapter, start/einde/pending/accepted/rejected/practice/record/medaille en audio/hapticbindingen | Iedere toestand oproepbaar met echte/fixture-events; herhaald ID speelt geen dubbel effect; Volgende ronde werkt tijdens decor. |
| FX-02 — bugs/families | Hergebruik 153 GLB-mappings; profielen voor lopend pantser, kruipend/lang, vliegend transparant, vliegend breed, springend en Oerbug-uitzondering; cutoutfallbacks | Alle 153 IDs en normaal/shinybron gekoppeld; ontbrekende alias expliciet fallback. Eén bewegingsprofiel per familie, unieke anatomie vraagt alleen waar nodig correctie. Geen claim van 153 nieuwe rigs. |
| FX-03 — typen/net | Elf type-effectrijen + schild, A14/A18 met werkelijke pivots en schone alpha | Alle fasen zonder framesprong bekeken op bos/vijver; netmond en pivot kloppen, typekleur en embleem consistent. |
| FX-04 — zeven games | Zeven bindingsets voor alle bovenstaande events, objectpools, relevante HUD-signalen, low/reduced | Per game volledige start→normaalspel→schade/fout→tijd/verlies/objective→pending→accepted/rejected, inclusief één geldige statbonus. Een mooie idle alleen is onvolledig. |
| FX-05 — combat/bende | Basic/charge/dodge/switch/KO/result; twee bendes, leiders en vaste rescue-reveal | Waarschuwing en 650 ms-window zichtbaar; dubbelKO/tijd/late events afhandelbaar. Alle vier bendegames hergebruiken FX-04; rescue slechts receipt. |
| FX-06 — behouden loop | Kaart/post, kaartnet, cocon, evolutie, power-up, gym, raid en terugkomstbindings | Huidige model-/trainer-ID's behouden; voortgang/kosten/receipt ongewijzigd; skip/reduced/low geven dezelfde uitkomst. |

Controleer gericht tijdens inbouw: representatieve bewegingsfamilie plus alle uitzonderingen visueel, manifestdekking voor alle IDs, atlasframes/pivots op echte achtergronden, dezelfde seed/input op normaal/low/reduced, en timing bij 30/60 fps of vertraagde render. Voor ieder spel één kleine bewijsopname/schermreeks op 390×844 en compacte 320×568-toestand; geen volledige nieuwe E2E-suite nodig voor dit assetcontract. Bewaar per pakket wat aanwezig, bekeken en runtime-bewezen is. Native touch/haptics, Androidprestaties en GPS/Health Connect blijven apart te verifiëren; ontwerp- of videobewijs is geen releasebewijs. Het hoofdstuk is compleet wanneer elk genoemd event een concrete bron/fallback en validatie-uitkomst heeft; voltooiing van de toekomstige app wordt hier niet geclaimd.
