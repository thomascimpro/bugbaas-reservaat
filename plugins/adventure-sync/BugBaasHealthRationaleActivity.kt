package __PACKAGE__

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.widget.ScrollView
import android.widget.TextView

class BugBaasHealthRationaleActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val text = TextView(this).apply {
      textSize = 18f
      setTextColor(Color.rgb(237, 242, 217))
      setPadding(28, 60, 28, 40)
      text = "BugBaas · Adventure Sync\n\nMet jouw toestemming leest BugBaas de stappen en afstand van vandaag uit Health Connect. Apps zoals Google Fit kunnen hun activiteit met Health Connect delen.\n\nAlleen lopen en rennen telt. Handmatig ingevoerde metingen tellen niet. We combineren meerdere bronnen conservatief, zodat dezelfde wandeling niet dubbel meetelt. Afstand kan worden geschat uit stappen.\n\nDe eerste koppeling zet een beginstand. Met autovangst aan en toestemming voor lezen op de achtergrond synchroniseren we tijdens wandelen maximaal eenmaal per minuut voor je cocon en buddy. Zonder die toestemming halen we Health Connect bij openen op. Je stappenteller kan nieuwe metingen met vertraging aanleveren. De server bewaart alleen je dagstand van stappen, meters en meettijd, geen ruwe gezondheidsgegevens of routes.\n\nBugBaas schrijft niets naar Health Connect. Je kunt Adventure Sync in de spelinstellingen uitschakelen en de leestoegang op ieder moment intrekken in de Android-instellingen voor Health Connect."
    }
    setContentView(ScrollView(this).apply { setBackgroundColor(Color.rgb(18, 56, 47)); addView(text) })
  }
}
