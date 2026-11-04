# Navigatie en schermopbouw — uitvoeringscontract

**Status 4 november:** deze gedeelde shell en de vier tabs zijn geïntegreerd. Claude verfijnt de bestaande compositie; geen tweede navigatie bouwen. Arcade heeft Spelen/Ranked en onder Spellen gericht Oefen; drie modi op dezelfde bestaande pagina, geen los keuzedashboard. Huidige functionele/browserbewijzen staan in `tester.md`; Android-back/native blijft afzonderlijk te controleren.

Oorspronkelijk navigatiecontract van 3 november; geïntegreerd op 4 november. De technische bouwinstructies hieronder beschrijven de te behouden werking. Deze sectie verandert geen runtimecode en geeft geen releasevrijgave. Bronnen: actuele `GameV2.tsx`, `FieldHomeV2.tsx`, beide `ExploreV2`-varianten, `BridgeFieldV2.web.tsx`, `nativeFieldProtocolV2.ts`, `ArcadeScreenV3.tsx`; creatorpakket `START_HIER.md`, `02_SCHERMEN.md`, `screens.json`, `previews.json`. P01-v2, P13 en P00 zijn visueel bekeken.

## Besluit

Eén app-shell met één onderbalk: **Kaart · Arcade · Bugs · Strijd**. P01-v2 bepaalt compositie en glaspresentatie; P13 de vrije Arcade-speelruimte; P00 het gerichte gevecht. De echte kaart, posities, gebouwen en camerabediening blijven behouden. De kaart krijgt dezelfde bediening en oppervlakken als de andere tabs. Geen extra zwevende Arcade-knop, tweede navigatiebalk of afzonderlijke Arcade-app.

`GameV2` blijft de bestaande eigenaar van spelstate, account, commando's en navigatie. Geen routerbibliotheek, nieuwe databases of algemene navigatie-infrastructuur. Breid de interne tab-union minimaal uit tot `Safari | Arcade | Team | Ranked`; zichtbare labels zijn respectievelijk Kaart, Arcade, Bugs, Strijd. Bestaande `open('team', specimenId)`, `open('ranked')` en `open('map')` blijven compatibele ingangen.

## Eén navigatiecontract

| Oppervlak | Inhoud en gedrag | Onderbalk |
|---|---|---|
| Kaart | Bestaande `ExploreV2`; echte kaart, trainer en objecten. Zoom +/− en 2D/3D linksboven, kompas/weer rechtsboven; avatar linksonder, Nearby rechtsonder en net/menu midden boven de onderbalk. Claude verfijnt marges binnen deze previewstijl. | Kaart actief |
| Arcade | Bestaande `ArcadeScreenV3` wordt inhoud van de tab. Volgende ronde, eigen squad, één **Speel**, beloningschip; kleine Scores/Medailles/Spellen onderaan volgens S07/S72. Geen zeven-keuzegrid. | Arcade actief |
| Bugs | Bestaande `GoCollectionV2`; eigen collectie, filter/zoek/sorteer. Detail opent binnen deze tab. Team kiezen blijft een afzonderlijke bestaande teamkiezer. | Bugs actief, ook in detail |
| Strijd | Bestaande `GoBattleV2`; overzicht Duel/Dag/Vrienden en eigen team volgens S50. De bestaande publieke modi blijven bereikbaar. | Strijd actief tot een actieve, gebonden spelstroom begint |
| Menu | P01-v2, paneel 2: volledig inhoudspaneel met kop, terug en instellingen; geen extra hoofdroute. De onderliggende kaart blijft bestaan. | Kaart actief |
| Secundaire pagina | Profiel, Tas, Bugdex, teamkiezer, Cocons, Buddy, Gyms, Vrienden, Doelen, Shop, Instellingen, Account en Dagboek gebruiken bestaande componenten in hetzelfde inhoudsframe. Eén kop/terugactie; eigen scrollgebied. | Tab van de ingang actief |
| Sheet | Nearby, veldpost, routebediening, lokker, autovangst, kaartopties, kleine item/type-info en bevestigingen. Glas, gedimde achtergrond, eigen Sluiten; focus blijft in de sheet. | Zichtbaar achter dimlaag; niet bedienbaar tot sluiten |
| Gerichte spelstroom | Vangst vanaf het openen van `CatchV2`, Arcade-aftelling/run/pauze, actief gevecht, bestaande serverwachtrij en onboarding. Zelfde scene en glastokens, expliciete terug-/stopactie. | Verborgen |
| Resultaat | Arcade-resultaat met **Volgende** en klein **Arcade**; gevechtsresultaat met gebonden **Terug** of echte gymvervolgactie. Vangstresultaat blijft in de vangststroom tot sluiten/Bekijk. | Terug na einde run/gevecht; vangst pas na verlaten vangststroom |

De bestaande `overlay`-stack kan de secundaire paginastack blijven; verander alleen de presentatie naar het gedeelde inhoudsframe. Toon geen generieke fullscreen `Modal` plus een eigen sluitbalk onder deze pagina's. Kleine bevestigingen en sheets mogen de bestaande modaltechniek houden. Het Menu blijft bij `FieldHomeV2`, waar GPSgebonden acties al zitten: vervang zijn menu-modal door een absoluut inhoudspaneel binnen de kaartlaag. Dit is de minimale praktische invulling van S06, dat `GameV2` als koppeling noemt; `GameV2` levert de shell.

### Menu: precies negen hoofdtegels

Volgorde van links naar rechts, rij voor rij: **Team, Tas, Bugdex / Cocons, Buddy, Gyms / Vrienden, Doelen, Instellingen**. Team opent `GoTeamPickerV2`, geen tweede collectie. Tasicoon en Menu/Tas openen dezelfde bestaande tascomponent. Doelen bundelt de bestaande dag-/post-/wandelvoortgang; geen tweede taak- of rewardsysteem.

Vaste `open`-doelen in diezelfde volgorde: `teamPicker`, `bag`, `bugdex`, `cocoons`, `buddy`, `gyms`, `friends`, `goals`, `settings`. Alleen `teamPicker`, `bag` en `goals` zijn nieuwe navigatiealiases; ze gebruiken bestaande componenten. `goals` rendert bestaand `DailyResearchV2`/`TrainerGoalsV2`; Profiel/Doelen gebruikt dezelfde inhoud. De teamkiezer krijgt een minimale embedded-presentatie zodat zijn huidige eigen `Modal`/kop geen tweede frame maakt; selectieregels en opslaan blijven gelijk.

Behoud de overige bestaande functies achter een passende ingang: Shop via munten/Tas; Dagboek en Account via Profiel; Routes via loopchip/Nearby; zoom +/− en 2D/3D blijven zichtbaar op de kaart. Extra hercentreren/uitleg plus Lokker/Autovangst via een compacte kaartopties-sheet. De actieve autovangststatus blijft een snelkoppeling naar dezelfde sheet. De bestaande “Zonder lopen”-tegels leiden naar dezelfde tabs/pagina's; verwijder hun aparte dashboardingang nadat alle doelroutes bereikbaar zijn. Er verdwijnen geen spelrechten of bestaande functies.

### Vervangen, niet stapelen

- Verwijder de `ArcadeEntry`-render en import uit `GameV2`; verwijder de ongebruikte `ArcadeEntry`-export uit `ArcadeArtV3`.
- Verwijder `overlay === 'arcade'` als aparte modalroute. Een oude `open('arcade')` mag uitsluitend de tab Arcade selecteren.
- Verwijder de eigen tabbar onder `ArcadeScreenV3`. Alleen `GameV2` rendert de gedeelde balk.
- Vervang de onderste avatar/net/Nearby-rij uit `FieldHomeV2`; integreer avatar/net/Nearby op hun afgesproken plek boven de enige onderbalk; behoud zoomknoppen. Geen nieuwe balk bovenop deze oude rij.
- Vervang het huidige `PLAY`-menu en de groepen BUITEN/KAART door het negen-tegelmenu plus de genoemde contextingangen. Bugs en Strijd staan in de vaste tabs; voeg daarvan geen extra hoofdtegels toe.
- Verwijder de oude 74px “Terug naar kaart”- en generieke “Sluit venster”-balken. De onderbalk neemt die ruimte in; pagina's hebben hun terugactie in de kop.
- De huidige aparte Ranked-kop wordt dezelfde kopcomponent. Geen dubbele titel/tellers als de bestaande pagina zelf al een kop toont.

### State en Terug

Een tabwissel sluit alleen tijdelijke sheets/pagina's van de vertrekkende tab. Bewaar de hoofdinhoud per tab: collectiezoekopdracht, filters, sortering, lijstscroll en geselecteerde bug; gekozen strijdsubtab/team; Arcadehome/squad en nog te verzenden resultaat. Bij terugkeer verschijnt die toestand opnieuw. Een geselecteerde tab opnieuw aantikken reset geen collectie of voortgang. Een gerichte `open('team', id)` heeft voorrang en opent precies dat eigen exemplaar; consumeer de ID eenmaal, niet bij iedere poll.

Bij behouden gemounte tabinhoud is de inactieve inhoud volledig inert: geen pointerevents, toegankelijkheidsfocus, geregistreerde Terug-handler of eigen foregroundloop. Geef de bestaande rootcomponenten zo nodig `active` door en begrens hun lokale back-handlers daarmee; een verborgen Bugdetail mag bijvoorbeeld Android-back op Arcade niet onderscheppen. Er loopt slechts één zichtbare navigatiestack tegelijk.

Terug, Android-back en Escape volgen één volgorde: kleine bevestiging/info → lokale sheet → lokale detail-/subpagina → vorige secundaire pagina/Menu → hoofdtab Kaart. Op de Kaart zonder open oppervlak blijft het bestaande Android-uitgangsgedrag gelden. In een actieve serverwachtrij/run/gevecht voert Terug de bestaande annuleer-/stop-/opgeefactie uit; geen tabwissel die die actie overslaat. Een gevechtsresultaat sluit uitsluitend het getoonde battle-ID. Na een gymgevecht blijft de bestaande vervolgtoegang tot die gym behouden.

## Behoud van kaart, GPS en native uitvoering

- Houd de bestaande `retained-field-map` en `ExploreV2 key={uid}` gemount. Tabwissels veranderen geen key, URL, mapinstantie of WebView. Alleen werkelijk wisselen van account wist accountgebonden kaart-/collectiedoelen zoals nu.
- Bewaar center, zoom, pitch, bearing, volgstand en gekozen wandeldoel. Open/sluit Menu, een pagina of een tab zonder hercentreren. De kaartcamera is geen nieuwe GPS-fix en verleent geen spelrechten.
- Houd de kaartlaag op een vaste volledige afmeting. De shellbalk ligt erboven; geef kaart-HUD en sheets een gereserveerde onderruimte van 72px. Verberg de balk bij vangst zonder de WebView te remounten of de camera te verplaatsen. Toepassen van safe-area-insets gebeurt éénmaal in de shell.
- `paused` blijft waar buiten Kaart en onder een blokkerende secundaire pagina. Bestaande GPS-watchstop, generation guards, zichtbaarheid en verse-fixcontrole blijven gelden. Een geopende vangst maakt de kaart niet `paused`, want `CatchV2` heeft `ensureGPS` nodig. Onder het Menu/een lokale sheet zijn kaartgebaren en kaartanimatie geblokkeerd; bestaande GPS-/autovangstregels worden niet herontworpen.
- Native blijft de bestaande HTTPS-`nativeField=1`-WebView met de huidige allowlist, RPC en GPS-shim. Alleen de host rendert de onderbalk; `BridgeFieldV2.web` rendert geen tweede shell. Foreground GPS en de afzonderlijke achtergrondautovangstdienst blijven verschillende bestaande lifecycles.
- Voor native moet de host weten wanneer `CatchV2` open is. Voeg een smalle presentatiemelding toe: `ExploreV2` geeft `onFocusChange('catch' | null)` door; de webbridge stuurt `{kind:'presentation', focus:'catch' | null}`. `nativeFieldProtocolV2` valideert uitsluitend die velden/waarden; native `ExploreV2` accepteert dit alleen voor de actieve kaart en roept dezelfde callback aan. Het bericht voert geen commando uit en bevat geen accounttoken, GPS of vrij bestemmingspad. Reset focus bij sluiten, pauzeren en unmount.
- Voor de gereserveerde onderruimte krijgt `ExploreV2` een `bottomInset: 0 | 72` vanuit de shell; native stuurt deze in zijn bestaande statebericht door aan de webkaart. Binnen de WebView geen tweede safe-area-padding. Bestaande navigate-berichten met gevalideerde camera/exemplaar-ID blijven bruikbaar. Breid de vaste bestemmingsallowlist uitsluitend uit met `bag`, `teamPicker`, `goals`; geen vrij bestemmingspad.
- `ArcadeScreenV3` rapporteert via `onFocusChange(boolean)` wanneer aftelling/run/pauze de balk verbergt. Alle andere fasen gebruiken de shellbalk; zijn huidige `close(destination)` blijft een callback naar dezelfde hostnavigatie. Een pending score wordt bewaard zoals de huidige Arcade-opslag, niet opgelost door navigatie te blokkeren of een score alvast als bevestigd te tonen.

## Layout: één meetbaar frame

Tokens uit `02_SCHERMEN.md`: achtergrond `#071E1B`, panel `#10352F`, tekst `#F4F1E6`, secundair `#BDD0C7`, actie `#32DCE7`; radius 16, gap 8, dunne lichte rand. De bestaande `PogoUiV2`-API blijft bruikbaar; Claude past de oppervlakken aan. Een kleurwijziging alleen levert de compositie niet: de oude cirkelmenu's worden werkelijk de bedoelde beeldtegels en de oude navigatie verdwijnt.

| CSS-viewport | Kop / onderbalk | Vrije normale inhoud* | Gedrag |
|---|---|---|---|
| 320×568 | 56 / 72 | 440px | Zijmarge 12; compacte hero; Menu 3×3 tegels, bij grote tekst binnen inhoud scrollen; collectie 2 kolommen bij grote tekst. Touchdoelen blijven 48px. |
| 390×844 | 56 / 72 | 716px | Zijmarge 16; basiscompositie P01-v2; hero neemt extra hoogte, squad/actie behouden vaste leesbare maat. |
| 430×932 | 56 / 72 | 804px | Zijmarge 16; meer scene zichtbaar, portretten begrensd; geen grotere bediening of nieuwe kolom. |

\* Zonder top-/bottom-safe-insets. Werkelijk beschikbaar: `viewportHeight - safeTop - safeBottom - 56 - 72`. De kaartscene mag achter kop/balk doorlopen; interactieve HUD respecteert deze ruimte. Maximaal 560px brede gecentreerde appkolom.

Arcadehome gebruikt binnen die inhoud van boven naar onder: flexibele scene met volgende-spelnaam en één gebaarhint; squadstrook; **Speel** naast de beloningschip; drie kleine secundaire tegels. Reserveer op 320px minimaal 80px squad, 56px actie en 64px secundaire rij, met 8px gaps en 8px boven-/onderruimte. De hero krimpt eerst. Speel en alle vier tabs zijn bij normale tekst zonder scroll bereikbaar; bij grote tekst mag de inhoud scrollen, de onderbalk niet. Geen absoluut geplaatste knop over de squad.

Menu: kop 56px, negen beeldtegels in drie kolommen, gap 8; standaard labels één woord. Een bestaande beginnerhint krijgt hooguit één compacte rij van 48px boven de tegels; op de kleinste hoogte mag alleen het inhoudsgebied scrollen. Alle informatiepagina's hebben één scrollgebied; hun bevestigactie blijft bereikbaar boven de balk/het toetsenbord. Geen horizontale uitloop, afgesneden sluitknop of ongeplande vaste 74/96px extra onderpadding.

Arcade-run: pauze linksboven, tijd midden, score rechtsboven, kleine eerdere score en hooguit één squadsteunchip. Geen navigatie, tas of taken over het veld. Schaal/letterbox dezelfde logische speelruimte op alle drie de maten; wijzig geen scoreafstand, timing of hitbox door layout. In P00 blijven chargeknoppen en reservebugs boven de onderrand; geen shellbalk onder het gevecht. Achtergronden `cover`, losse insecten/portretten `contain`, labels/getallen echte UI. Geen volledige previewafbeelding als schermachtergrond.

## Beginner en minimale tekst

Behoud de huidige beginner-IDs en opgeslagen voortgang. Elke aanwijzing leidt naar dezelfde nieuwe ingang: vangen → Nearby/kaart, bugs → Bugs, strijd → Strijd; geen route terug naar een verdwenen menu. Vier tabs blijven zichtbaar en herkenbaar. Bestaande levelpoorten blijven bij de betreffende acties gelden; een gesloten Strijd-tab toont compact slot + werkelijk vereist level, geen heimelijke unlock. Een lege Arcade-squad krijgt één **Vang bug**-actie; geen fictieve bugs of scores.

Knoppen 1–2 woorden, maximaal één korte hulpregel tegelijk; nadere uitleg achter ⓘ, maximaal twee korte regels per uitlegmoment. De eerste ronde toont één gebaar; daarna het icoon. Bestaande lange autovangst-/kaartuitleg verhuist naar contextinformatie. Foutmelding kort, bij de actie, met concrete herstelknop. Iconen, selected-markering en toegankelijke labels blijven betekenis geven zonder uitsluitend kleur te gebruiken. Een eerdere score heet **Eerdere score**; een verdediging **Opgeslagen team**; een NPC **Veldwachter**.

## Bestandsgrenzen Sol ↔ Claude

Deze tabel is de exclusieve schrijfverdeling voor deze navigatie-integratie. Er schrijft steeds één eigenaar per bestand. De bestaande lokale wijzigingen blijven staan. Voor de implementatie wordt deze tabel in `SAMENWERKING.md` overgenomen; dat is coördinatie, geen nieuwe goedkeuringsronde.

| Schrijver | Bestanden | Concrete verantwoordelijkheid |
|---|---|---|
| **Sol 6.1** | `src/GameV2.tsx` | Vier tabs, één shellbalk, secundaire presentatie/backstack, retained map, focus/inset-doorvoer, verwijderen oude Arcade-modal/sluitbalken. |
| **Claude — overdracht 4 november** | `src/arcade/ArcadeScreenV3.tsx`, `src/arcade/ArcadeArtV3.tsx`, `src/arcade/original/*Scene.tsx`, `src/arcade/original/ButterflyWorld.ts` | Alleen bestaande presentatie/animaties/compositie afwerken; lifecycle, commando’s, opslag en inputbetekenis behouden. Geen tweede ArcadeHome. |
| **Codex/Sol** | `src/arcade/ArcadeFieldV3.tsx`, `src/arcade/original/OriginalArcadeFieldV3.tsx`, `game/arcade/**`, `server/**` | Gedeelde klok, invoer, replay, regels, types/stats, tickets en receipts. Alleen gericht wijzigen wanneer presentatie een concrete koppeling mist. |
| **Claude** | `src/PogoUiV2.tsx` | Gedeelde glascomponenten en één `MainTabsV3` met `active: 'map'\|'arcade'\|'bugs'\|'battle'` en `onChange`; geen tabstate/servercalls in de component. |
| **Claude** | `src/FieldHomeV2.tsx`, `src/ExploreV2.web.tsx`, `src/ExploreV2.tsx` | Kaart-HUD, negen-tegelmenu/contextingangen, kaartinset, catchfocus, bestaande kaart/GPS behouden. |
| **Codex/Sol** | `src/BridgeFieldV2.web.tsx`, `src/nativeFieldProtocolV2.ts` | Inset/presentatie-uitwisseling is geïntegreerd; behoud de strikte protocolgrens. Geen visuele wijziging die extra RPC/GPS-rechten introduceert. |
| **Claude** | `src/BeginnerGuideV2.tsx`, `src/GoCollectionV2.tsx`, `src/BugDetailV2.tsx`, `src/GoTeamPickerV2.tsx`, `src/GoBattleV2.tsx` | Bestaande eigen schermen op gedeeld frame aansluiten; routes, detailstate en één kop/terugactie; geen nieuwe spelregels in dit navigatieblok. |

Overige bestanden worden voor dit blok niet gewijzigd. Met name `game/arcade/*`, `server/arcadeServiceV3.ts`, `game/typesV2.ts`, overige spel-/serverregels, accounts, assets en 3D blijven buiten deze navigatiewijziging. Spelbouw krijgt zijn eigen afgebakende taak. Als een interfacewijziging een bestand van de ander vereist, levert de ene eigenaar de wijzigingsvraag en voert de genoemde eigenaar hem uit; niet gelijktijdig schrijven.

## Historische integratievolgorde — al uitgevoerd

1. `PLAN_NAAR_PREVIEWS.md` zegt “behalve de kaart”, maar P01-v2 en `SAMENWERKING.md` vereisen gedeelde chrome. De kaartwereld blijft eigen werk; haar HUD/menu/balk moeten wel in deze shell passen.
2. Alleen `PogoUiV2` van wit naar glas kleuren laat de drie oude routes, menucompositie, sluitbalken en losse Arcade-modal bestaan. **Eerst B01-shell en ingangen afronden**, dan verdere kaartdecoratie/B10/B02–B08. Geen nieuwe 3D- of gameplaytaak als vervanging van deze integratie.
3. De presentatieoverdracht is op 4 november expliciet gedaan in de bovenstaande tabel. Claude bouwt geen parallelle klok, hub of spelregels; alleen de genoemde scenes en presentatie zijn overgedragen.
4. B12 staat bij Codex in de bloktabel, maar GoCollection/BugDetail staan al in Claude's werkgebied. Voor deze navigatie-aanpassing blijven deze bestanden bij Claude; de aangrenzende TeamPicker wordt expliciet aan dezelfde eigenaar toegewezen. Sol levert het schermcontract en schrijft ze niet tegelijk.
5. De huidige Arcade heeft al vier eigen tabs; het doel is **één gedeelde balk**, niet twee visueel gelijke balken. De eerste samengestelde oplevering omvat Kaart → Arcade → Bugs → Strijd → Kaart met de bestaande echte inhoud.

Uitvoering zonder tussentijdse release: Claude levert glascomponenten/`MainTabsV3` → Sol koppelt de vier tabs aan bestaande inhoud en verwijdert de dubbele ingangen → Claude past mapmenu/HUD/bridge en eigen detail-/strijdschermen aan → Sol controleert de samengestelde navigatie. Extra games, art en gevechtsregels volgen pas hun eigen blok; deze sectie vraagt daar geen nieuwe implementatie voor.

## Acceptatie en stoppen

- Op 320×568, 390×844 en 430×932 staat precies één balk in dezelfde volgorde. Alle vier tabs werken met dezelfde glassfeer en echte bestaande inhoud. Geen zwevende ArcadeEntry, tweede balk, witte sheetstijl of oude kaartsluitbalk blijft zichtbaar.
- Menu toont de negen afgesproken tegels. Iedere genoemde oude functie is via haar aangewezen ingang bereikbaar. Geen doodlopende/lege knop of andere ingang met een tweede tas/team/collectie-implementatie.
- Kaart → Arcade → Bugs → Strijd → Kaart bewaart camera/zoom/richting/volgstand en wandeldoel; openen/sluiten Menu en bugdetail verplaatst de kaart niet. Collectiefilters/scroll/detail en Arcade-squad blijven behouden. Bekijk na vangst opent het juiste eigen exemplaar.
- Op web en native: onderbalk verdwijnt bij vangst/run/gevecht en keert eenmaal terug; Android-back volgt dezelfde volgorde als de zichtbare terugactie. De kaart-WebView blijft dezelfde instantie. Verborgen kaart kan geen invoer/foreground-GPS-commando's blijven verwerken; een verlate GPS-/bridgecallback wordt zoals nu geweigerd. Achtergrondautovangst wordt door tabwissels niet stilzwijgend aan-/uitgezet.
- Normale tekst: hoofdactie, squad en tabs passen op de drie maten; grote tekst: inhoud scrollt zonder overlappende bediening. Touchdoelen minimaal 48px, safe-area éénmaal, geen horizontale overflow. Minder beweging behoudt dezelfde routes/timing.
- Gerichte controle: bestaande TypeScript-check; relevante bestaande navigatie/native-protocoltests bij wijziging daarvan; handmatige browsercontrole van deze routes en drie hoogtes. Geen nieuwe E2E-infrastructuur of brede suite. Native WebView/back/kaartcamera en fysieke GPSwerking zijn afzonderlijke praktijkbewijzen; ontbreken daarvan expliciet vermelden.

Stop wanneer deze navigatie en presentatie zijn geïmplementeerd en gericht gecontroleerd. Nieuwe scherminhoud, zeven complete spellen, 3D-verbeteringen, balans en release zijn geen acceptatiecriteria van dit navigatieblok. Op dit moment is alleen het contract opgeleverd; geen van deze runtimecriteria is hiermee bewezen.
