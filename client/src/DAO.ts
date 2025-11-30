
import { Creation } from './Schema.js'


let creations: Record<string, Creation> = {
  "paloma": {
    id: "paloma",
    heroImg: "assets/paloma-fresca/hero.png",
    title: "Paloma Fresca",
    desc: "A fresh citrus-forward coastal mocktail inspired by long afternoons on the Malibu pier.",
    bom: [
      { title: "4 oz fresh grapefruit juice", link: "" },
      { title: "1 oz lime juice", link: "" },
      { title: "2 oz sparkling water", link: "" },
      { title: "1 tsp agave syrup", link: "" },
      { title: "Sea-salt rim", link: "" },
      { title: "Rosemary sprig or grapefruit wedge (garnish)", link: "" }
    ],
    steps: [
      "Run a lime wedge around the rim and dip the glass in sea salt.",
      "Fill the glass with ice.",
      "Add grapefruit juice, lime juice, and agave syrup.",
      "Stir gently to combine.",
      "Top with sparkling water.",
      "Garnish with rosemary sprig or grapefruit slice."
    ],
    notes: "Use pink grapefruit for a softer, sweeter profile. Swap sparkling water for tonic if you like more bite, or try smoked sea salt on the rim for an extra coastal twist."
  }
}

class DAO {
  CreationByID(id: string): Creation | undefined {
    return creations[id]
  }
}

export let dao = new DAO()