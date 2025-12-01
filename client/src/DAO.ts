
import { Creation, User, UUID } from './Schema.js'


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
    tags: [
      "grapefruit",
      "rosemary"
    ],
    time: "10 min",
    steps: [
      "Run a lime wedge around the rim and dip the glass in sea salt.",
      "Fill the glass with ice.",
      "Add grapefruit juice, lime juice, and agave syrup.",
      "Stir gently to combine.",
      "Top with sparkling water.",
      "Garnish with rosemary sprig or grapefruit slice."
    ],
    notes: "Use pink grapefruit for a softer, sweeter profile. Swap sparkling water for tonic if you like more bite, or try smoked sea salt on the rim for an extra coastal twist."
  },
  "strawberry-basil-lemonade": {
    id: "strawberry-basil-lemonade",
    heroImg: "assets/strawberry-basil/hero.png",
    title: "Strawberry Basil Lemonade",
    desc: "A refreshing blend of sweet strawberries, fresh basil, and tangy lemon.",
    bom: [
      { title: "6 fresh strawberries, hulled", link: "" },
      { title: "6-8 fresh basil leaves", link: "" },
      { title: "2 oz fresh lemon juice", link: "" },
      { title: "1 oz simple syrup", link: "" },
      { title: "3 oz sparkling water", link: "" },
      { title: "Basil sprig and strawberry slice (garnish)", link: "" }
    ],
    tags: ["strawberry", "basil", "lemon"],
    time: "5 min",
    steps: [
      "Muddle strawberries and basil leaves in a shaker.",
      "Add lemon juice and simple syrup.",
      "Fill with ice and shake vigorously for 15 seconds.",
      "Strain into a glass filled with fresh ice.",
      "Top with sparkling water.",
      "Garnish with basil sprig and strawberry slice."
    ],
    notes: "For a sweeter version, add an extra 1/2 oz simple syrup. The basil adds a sophisticated herbal note."
  },
  "cucumber-mint-cooler": {
    id: "cucumber-mint-cooler",
    heroImg: "assets/cucumber-mint/hero.png",
    title: "Cucumber Mint Cooler",
    desc: "A light and hydrating drink perfect for hot summer days with cooling cucumber and mint.",
    bom: [
      { title: "4-5 cucumber slices", link: "" },
      { title: "10 fresh mint leaves", link: "" },
      { title: "1 oz lime juice", link: "" },
      { title: "3/4 oz honey syrup", link: "" },
      { title: "2 oz tonic water", link: "" },
      { title: "Cucumber ribbon and mint sprig (garnish)", link: "" }
    ],
    tags: ["cucumber", "mint"],
    time: "5 min",
    steps: [
      "Muddle cucumber slices and mint leaves gently.",
      "Add lime juice and honey syrup.",
      "Fill glass with crushed ice.",
      "Stir to combine.",
      "Top with tonic water.",
      "Garnish with cucumber ribbon and mint sprig."
    ],
    notes: "Use English cucumber for less bitterness. Honey syrup can be made by mixing equal parts honey and warm water."
  },
  "hibiscus-ginger-fizz": {
    id: "hibiscus-ginger-fizz",
    heroImg: "assets/hibiscus-ginger/hero.png",
    title: "Hibiscus Ginger Fizz",
    desc: "A vibrant ruby-red mocktail with floral hibiscus and spicy ginger notes.",
    bom: [
      { title: "2 oz hibiscus tea, chilled", link: "" },
      { title: "1 oz fresh ginger syrup", link: "" },
      { title: "1/2 oz lime juice", link: "" },
      { title: "3 oz ginger beer", link: "" },
      { title: "Dried hibiscus flower (garnish)", link: "" }
    ],
    tags: ["hibiscus", "ginger"],
    time: "5 min",
    steps: [
      "Brew hibiscus tea and chill completely.",
      "Add hibiscus tea, ginger syrup, and lime juice to glass.",
      "Fill with ice.",
      "Top with ginger beer.",
      "Stir gently.",
      "Garnish with dried hibiscus flower."
    ],
    notes: "Make ginger syrup by simmering equal parts sugar, water, and sliced ginger for 10 minutes. Adjust sweetness to taste."
  },
  "pineapple-coconut-crush": {
    id: "pineapple-coconut-crush",
    heroImg: "assets/pineapple-coconut/hero.png",
    title: "Pineapple Coconut Crush",
    desc: "A tropical paradise in a glass with sweet pineapple and creamy coconut.",
    bom: [
      { title: "3 oz fresh pineapple juice", link: "" },
      { title: "2 oz coconut cream", link: "" },
      { title: "1 oz lime juice", link: "" },
      { title: "1/2 oz vanilla syrup", link: "" },
      { title: "Pineapple wedge and toasted coconut (garnish)", link: "" }
    ],
    tags: ["pineapple", "coconut"],
    time: "5 min",
    steps: [
      "Add all ingredients to a blender with 1 cup ice.",
      "Blend until smooth and frothy.",
      "Pour into a hurricane or tiki glass.",
      "Garnish with pineapple wedge and toasted coconut.",
      "Serve immediately."
    ],
    notes: "For a lighter version, use coconut milk instead of coconut cream. Freezing pineapple chunks makes it extra refreshing."
  },
  "watermelon-mint-agua-fresca": {
    id: "watermelon-mint-agua-fresca",
    heroImg: "assets/watermelon-mint/hero.png",
    title: "Watermelon Mint Agua Fresca",
    desc: "A refreshing Mexican-inspired drink with sweet watermelon and cooling mint.",
    bom: [
      { title: "2 cups fresh watermelon chunks", link: "" },
      { title: "8-10 fresh mint leaves", link: "" },
      { title: "1 oz lime juice", link: "" },
      { title: "1/2 oz agave nectar", link: "" },
      { title: "2 oz sparkling water", link: "" },
      { title: "Watermelon wedge and mint leaf (garnish)", link: "" }
    ],
    tags: ["watermelon", "mint"],
    time: "10 min",
    steps: [
      "Blend watermelon chunks until smooth.",
      "Strain through fine mesh to remove pulp.",
      "Muddle mint leaves in glass.",
      "Add watermelon juice, lime juice, and agave.",
      "Fill with ice and top with sparkling water.",
      "Garnish with watermelon wedge and mint leaf."
    ],
    notes: "This drink is naturally sweet, so adjust agave to taste. Best served very cold on hot days."
  },
  "lavender-lemon-spritz": {
    id: "lavender-lemon-spritz",
    heroImg: "assets/lavender-lemon/hero.png",
    title: "Lavender Lemon Spritz",
    desc: "An elegant and aromatic mocktail with floral lavender and bright lemon.",
    bom: [
      { title: "1 oz lavender syrup", link: "" },
      { title: "1 oz fresh lemon juice", link: "" },
      { title: "4 oz prosecco-style sparkling water", link: "" },
      { title: "Lemon twist and lavender sprig (garnish)", link: "" }
    ],
    tags: ["lavender", "lemon"],
    time: "3 min",
    steps: [
      "Add lavender syrup and lemon juice to a champagne flute.",
      "Top with chilled sparkling water.",
      "Stir gently.",
      "Garnish with lemon twist and lavender sprig.",
      "Serve immediately."
    ],
    notes: "Make lavender syrup by steeping 2 tbsp dried lavender in 1 cup simple syrup for 15 minutes. Don't over-steep or it becomes soapy."
  },
  "spiced-apple-cider-mocktail": {
    id: "spiced-apple-cider-mocktail",
    heroImg: "assets/spiced-apple/hero.png",
    title: "Spiced Apple Cider Mocktail",
    desc: "A warm and cozy autumn drink with apple cider, cinnamon, and spices.",
    bom: [
      { title: "4 oz fresh apple cider", link: "" },
      { title: "1 cinnamon stick", link: "" },
      { title: "2 whole cloves", link: "" },
      { title: "1 star anise", link: "" },
      { title: "1/2 oz maple syrup", link: "" },
      { title: "Orange slice and cinnamon stick (garnish)", link: "" }
    ],
    tags: ["apple", "cinnamon", "autumn"],
    time: "15 min",
    steps: [
      "Warm apple cider in a small pot with spices.",
      "Simmer gently for 10 minutes.",
      "Strain into a heat-safe mug.",
      "Stir in maple syrup.",
      "Garnish with orange slice and cinnamon stick.",
      "Serve warm."
    ],
    notes: "Can be served cold over ice in summer. Add a dash of vanilla extract for extra warmth. Makes your kitchen smell amazing!"
  },
  "blood-orange-thyme-sparkler": {
    id: "blood-orange-thyme-sparkler",
    heroImg: "assets/blood-orange/hero.png",
    title: "Blood Orange Thyme Sparkler",
    desc: "A sophisticated mocktail with vibrant blood orange and earthy thyme.",
    bom: [
      { title: "3 oz fresh blood orange juice", link: "" },
      { title: "3-4 fresh thyme sprigs", link: "" },
      { title: "1/2 oz honey syrup", link: "" },
      { title: "2 oz sparkling water", link: "" },
      { title: "Blood orange wheel and thyme sprig (garnish)", link: "" }
    ],
    tags: ["blood orange", "thyme"],
    time: "5 min",
    steps: [
      "Gently muddle 2 thyme sprigs with honey syrup.",
      "Add blood orange juice and ice.",
      "Shake well for 10 seconds.",
      "Strain into a coupe glass.",
      "Top with sparkling water.",
      "Garnish with blood orange wheel and thyme sprig."
    ],
    notes: "Blood orange season is winter through spring. Regular oranges work but lack the stunning ruby color."
  },
  "mango-chili-lime-mocktail": {
    id: "mango-chili-lime-mocktail",
    heroImg: "assets/mango-chili/hero.png",
    title: "Mango Chili Lime Mocktail",
    desc: "A bold and spicy tropical drink with sweet mango, tangy lime, and a chili kick.",
    bom: [
      { title: "3 oz fresh mango puree", link: "" },
      { title: "1 oz lime juice", link: "" },
      { title: "1/2 oz agave syrup", link: "" },
      { title: "Pinch of chili powder", link: "" },
      { title: "2 oz sparkling water", link: "" },
      { title: "Tajín rim, mango slice, and lime wheel (garnish)", link: "" }
    ],
    tags: ["mango", "chili", "lime"],
    time: "7 min",
    steps: [
      "Rim glass with lime juice and dip in Tajín seasoning.",
      "Blend mango puree, lime juice, agave, and chili powder.",
      "Pour into prepared glass over ice.",
      "Top with sparkling water.",
      "Garnish with mango slice and lime wheel.",
      "Serve immediately."
    ],
    notes: "Adjust chili to your heat preference. For a smoky version, use chipotle powder instead of chili powder."
  },
  "blueberry-sage-smash": {
    id: "blueberry-sage-smash",
    heroImg: "assets/blueberry-sage/hero.png",
    title: "Blueberry Sage Smash",
    desc: "A beautiful purple mocktail with antioxidant-rich blueberries and aromatic sage.",
    bom: [
      { title: "1/2 cup fresh blueberries", link: "" },
      { title: "4-5 fresh sage leaves", link: "" },
      { title: "1 oz lemon juice", link: "" },
      { title: "3/4 oz simple syrup", link: "" },
      { title: "2 oz club soda", link: "" },
      { title: "Blueberries and sage leaf (garnish)", link: "" }
    ],
    tags: ["blueberry", "sage"],
    time: "5 min",
    steps: [
      "Muddle blueberries and sage leaves in a shaker.",
      "Add lemon juice and simple syrup.",
      "Fill with ice and shake vigorously.",
      "Double strain into a rocks glass with fresh ice.",
      "Top with club soda.",
      "Garnish with fresh blueberries and sage leaf."
    ],
    notes: "The double strain removes seeds and herb bits for a cleaner drink. Sage pairs surprisingly well with berries."
  }
}

class DAO {
  async CreationGetByID(id: string): Promise<Creation | undefined> {
    return creations[id]
  }
  async CreationsGet(pageSize: number, pageNum: number): Promise<Creation[]> {
    const allCreations = Object.values(creations)
    const start = pageNum * pageSize
    const end = start + pageSize
    return allCreations.slice(start, end)
  }

  async UserGetOrCreate(args: {
    userID: UUID,
    createParams: {
      userID: string,
      email?: string,
      nameFamily?: string,
      nameGiven?: string,
      nameAlias?: string,
      nameNick?: string,
      gender?: string,
      createdAt: string,
      lastLogin: string,
      role: string,
    }
  }): Promise<User> {
    return {
      id: args.userID,
      email: args.createParams.email,
      nameFamily: args.createParams.nameFamily,
      nameGiven: args.createParams.nameGiven,
      nameAlias: args.createParams.nameAlias,
      nameNick: args.createParams.nameNick,
      gender: args.createParams.gender,
      createdAt: args.createParams.createdAt,
      lastLogin: args.createParams.lastLogin,
      role: args.createParams.role,
    }
  }
}

export let dao = new DAO()