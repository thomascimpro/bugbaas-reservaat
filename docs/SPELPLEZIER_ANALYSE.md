# Speelplezier per onderdeel (2026-10-28)

Vraag per onderdeel: is dit nu een knop, of een moment dat leuk is om te doen? Bron: code en lokale browserchecks t/m v0.1.16, plus het werk dat lokaal al klaarstaat. Prioriteit = plezier per week spelen ÷ bouwwerk. Server blijft altijd scheidsrechter: mini-spellen sturen alleen invoer die de server al controleert.

| Onderdeel | Nu | Probleem | Voorstel | Werk | Prio |
|---|---|---|---|---|---|
| Opgeladen aanval | Per type een mini-spel (zwerm, wrijven, ritme, vegen) | Lokaal klaar (`5df1ffb`); nog niet uitgebracht | Uitbrengen; later per type 1 extra variant | — | klaar |
| Posten draaien | Knop "Draai gympost" | Dagelijks vaakst gebruikte actie, nul gevoel | Veeg de postschijf rond (PoGo-gevoel); items springen eruit; snelle draai = streak-teller | klein | 1 |
| Cocon uitkomen | Lijst + resultaat | Geen spanning, terwijl zeldzaamheid nu bestaat | Tik de cocon 3× open; barstjes en gloed in zeldzaamheidskleur vóór de onthulling | klein | 2 |
| Evolueren / sterker maken | Knop + cijfers | Groot moment voelt als formulier | Evolutiefilmpje: silhouet, lichtflits, nieuwe vorm draait in; sterker maken met oplopende CP-teller | klein | 3 |
| Vangen | Net vasthouden/vegen, schudden, shiny | Bug staat stil; elke worp hetzelfde | Bug springt/vliegt soms weg (net kan dan niet raken, alleen visueel blokkeren), "Perfect ×3"-reeks met bonusgloed | middel | 4 |
| Medailles | Geen | Weinig langetermijndoelen | Medailles per type, habitat en activiteit (brons/zilver/goud), met kleine vangbonus per type (zoals PoGo) | middel | 5 |
| Evenementen | Geen | Elke dag hetzelfde | Weekend-spotlight: één familie vaker en grotere shinykans; tijdelijk onderzoek | middel (server) | 6 |
| Buddy | Km lopen voor nectar | Passief | Buddy voeren/aaien (tik-interactie), buddy loopt mee op de kaart en vindt soms een item | middel | 7 |
| Snelle aanval | Spam-tikken op het veld | Weinig keuze | Ontwijken: veeg weg vlak voor een vijandelijke opgeladen aanval = minder schade (servercheck op timing) | groot (server) | 8 |
| Schildkeuze | Groot rond schild / zonder | Keuze is goed | Laten zoals het is | — | — |
| Ruilen | Ruil met vriend | Weinig verrassing | "Geluksruil" (kleine kans op hoge IV), zoals PoGo | klein (server) | 9 |
| Cadeaus | Kaarten versturen/openen | Openen is een knop | Cadeau openmaken met strikanimatie + inhoud één voor één | klein | 10 |
| Bugdex | Grid met silhouetten | Doel onduidelijk | Voortgang per familie/regio + medaillekoppeling | klein | 11 |
| Raids | In aanbouw (branch BB-79) | — | Na review-fixes uitbrengen als 0.1.17 | — | lopend |
| Kaart / wandelen | Spawns, posten, gymbaas | Goed | Weerbonus zichtbaar maken (icoon op geboosterde bugs) | klein | 12 |

## Ontwerpregels
- Elke dagelijkse actie krijgt een gebaar (vegen, tikken, wrijven) in plaats van een knop, met een duidelijke afronding (geluid, gloed, teller).
- Uitslag en beloning blijven op de server; mini-spellen leveren alleen controleerbare invoer.
- Minder beweging = eenvoudige knopversie blijft beschikbaar.
- Geen betaalde tools of assets (gebruikerskeuze).
