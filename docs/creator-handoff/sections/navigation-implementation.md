# IN-01 navigatie-integratie — 3 november 2026

Geïmplementeerd in `GameV2.tsx`, `arcade/MainTabsV3.tsx`, `arcade/ArcadeScreenV3.tsx` en `arcade/ArcadeArtV3.tsx`.

- Eén hostbalk van 72px: Kaart, Arcade, Bugs, Strijd. Bestaande atlasuitsneden, echte labels, geselecteerde markering en aanraakvlakken van minimaal 48px. Safe-area blijft eenmaal bij de host.
- Vier behouden tablagen. De kaart houdt dezelfde `ExploreV2 key={uid}` en cameraref; alleen een accountwisseling remount. Verborgen lagen hebben geen pointer-/toegankelijkheidsfocus en krijgen een inactieve `GoBackScope`; collectie en strijd ontvangen daarnaast `active`.
- Zwevende ArcadeEntry, aparte Arcade-modal/balk, aparte Ranked-kop en beide oude 74px-sluitbalken verwijderd. Secundaire pagina’s staan inline met één kop. De bestaande embedded teamkiezer behoudt zijn eigen enkele kop.
- `open('map'|'arcade'|'team'|'ranked')` koppelt aan dezelfde tab. Gericht `team,id` wordt eenmaal geconsumeerd. Nieuwe aliases `bag`, `teamPicker`, `goals` gebruiken FieldBagV2, GoTeamPickerV2 en DailyResearchV2/TrainerGoalsV2; Profiel/Doelen deelt dezelfde inhoud.
- Shellfocus via de kaartcatch en Arcade voorbereiding/aftelling/run verbergt de balk. Kaartafmeting blijft vast; kaart-HUD krijgt `bottomInset:0|72`. Actieve serverwachtrij/gevecht houdt zijn stop-/opgeefactie; resultaat sluiten blijft aan het battle-ID gebonden.
- Arcade behoudt squad en pending uitslag bij tabwissels. Tijdelijke score-/medaille-/spelpagina’s en lokale picker sluiten bij vertrek. Zeven games gebruiken de servergekozen volgende game en dezelfde Speel-knop. Scores, medailles, weekvoortgang, feedback en uitbetaalde rewards komen uit bevestigde servervelden; een onbevestigde uitslag blijft expliciet bewaard/te controleren.
- Bestaande Arcade Stop/achtergrond-abandon blijft behouden. Er is geen nieuwe pauze-/scorebeleid toegevoegd.

Gerichte controle: `npm run typecheck` geslaagd na de integratie met de nieuwe game-, service-, kaart- en lifecycle-interfaces. Broncontrole bevestigt één MainTabs-render en geen ArcadeEntry/modalroute/eigen Arcadebalk/74px-sluitbalk. Gecombineerde webexport en browsercontrole op 320×568, 390×844 en 430×932 worden door de integrator uitgevoerd; deze notitie claimt daarvoor nog geen resultaat. Geen nieuwe native toestel-/GPS-proef, release of productiepublicatie.
