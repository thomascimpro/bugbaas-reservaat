# BugBaas — eenvoudig werkplan

Bijgewerkt op 20 oktober 2026. Dit vervangt het uitgebreide negenstappenplan.

## Werkwijze
1. Pak één concrete open speltaak uit het werkregister.
2. Bouw de kleinste werkende verbetering. Gebruik bestaande code en assets.
3. Test wat je hebt veranderd; bekijk bij schermwerk het resultaat in de browser.
4. Noteer kort: gedaan, getest, eventueel geblokkeerd. Ga daarna door.

Geen nieuwe planningsronde of toestemming voor normale fixes. Geen afgeronde functies opnieuw bouwen. Als een externe blokkade hetzelfde blijft, noteer die en pak onafhankelijk werk op.

## Werkvolgorde
| Volgorde | Taak | Klaar wanneer |
|---|---|---|
| 1 | **Kaart afmaken (BB-50)** | Ontbrekende stadsbebouwing verklaard en waar mogelijk hersteld; natuur, biomen en wegen blijven goed zichtbaar. Controleer stad en bos in de browser. |
| 2 | **Posten en routes (BB-70)** | Toegestane echte bron werkt, bereik/cooldown/beloningen kloppen. Bij providerblokkade: foutstatus behouden en geen punten verzinnen. |
| 3 | **Android (BB-60)** | APK bouwt en draait in de aparte testomgeving; GPS, terug en achtergrond gecontroleerd. Java/ADB-blokkade alleen opnieuw proberen bij een aantoonbare nieuwe oplossing. |
| 4 | **Releasecontrole (BB-90)** | Relevante tests groen, echte Android-wandeling en veilig cloudherstel bewezen. Productie vraagt afzonderlijk akkoord. |

**BB-50 is afgerond en browsergetest.** GPS-opruiming (BB-60) en providerfouten/cache (BB-70) zijn ook verbeterd en getest. De live bron, echte Android-uitvoering en cloudherstel blijven open; zie het werkregister voor de concrete blokkades.

## Testen zonder onnodig werk
- Schermwijziging: TypeScript en alleen het betrokken scherm plus terugnavigatie op een telefoonformaat.
- Spelregels/server: relevante bestaande tests; goedkope volledige unit-suite bij samenvoegen.
- Volledige browserronde/webexport alleen als de wijziging of release dat nodig maakt.
- Een simulatie bewijst geen echte GPS-wandeling of live locaties. Noem een onderdeel pas getest na een geslaagde controle.

## Wat al klaar is
Git-basis, 30 bugs met shiny-art, Dex/evolutie, collectie, trainer/dagtaken, PvP en de webbasis bestaan al. BB-01a bewijsregistratie is gebouwd en getest in commit `4181c33` (191 unit-tests en TypeScript groen). Niet opnieuw maken.

## Geparkeerd
Automatische testselectie, extra QA-runner, uitgebreide reviewadministratie en CI zijn nu geen vereiste. Ook raids en extra evolutielijnen komen later. De bestaande QA-registratie mag gebruikt worden, maar hoeft normaal spelwerk niet te blokkeren.

## Grenzen
Behoud accounts en voortgang. Geen database-reset, betaalde diensten of productiepublicatie zonder toestemming. Agents krijgen gescheiden bestanden; één eigenaar per bestand. Als agents niet beschikbaar zijn, werk zelf verder aan dezelfde kleine taak en vermeld die beperking kort.

Actuele stand: [werkregister](../../POGO_WERKREGISTER.md). Ontwerpdetails alleen wanneer nodig: [FO](../../POGO_FO_20261019.md), [TO](../../POGO_TO_ASSETS_20261019.md).
