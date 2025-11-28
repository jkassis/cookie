import { App } from './Main.js'
import { Cash } from 'cash-dom'
import { DonutProps, DonutOptions, html } from './satori/Donut.js'
import { RecipeActions } from './RecipeActions.js'
import { RecipeFooter } from './RecipeFooter.js'
import { RecipeHeader } from './RecipeHeader.js'
import { Router } from './satori/Router.js'
import { Screen } from './satori/Screen.js'

import { AddCSS, AddLess } from './satori/Loader.js'



AddCSS("RecipeE2EScreen", `

`)


export class RecipeE2EScreen extends Screen {
  private recipeFooter?: RecipeFooter
  declare public a: {}
  declare public app: App

  public static URL(a: RecipeE2EScreen['a']) {
    return `recipeE2E?${Router.aToURLParams(a)}`
  }

  init(template: string, props: DonutProps, options: DonutOptions): Cash {
    // html annotation intentionally left out
    var template = html`
    <div
      class="w-full bg-white/95 shadow-xl overflow-hidden font-serif border border-slate-200 flex flex-col min-h-screen pb-20">
      <div class="recipeHeader"></div>

      <!-- Edge-to-edge hero image -->
      <div class="w-full aspect-[4/3]">
        <img src="assets/paloma-fresca/hero.png" alt="Paloma Fresca mocktail with grapefruit and rosemary"
          class="w-full h-full object-cover" />
      </div>

      <!-- Content -->
      <div class="px-6 pt-5 pb-6 max-w-2xl mx-auto flex-1">

        <!-- Title + Description -->
        <div class="mb-6 text-center">
          <h1 class="text-3xl font-serif tracking-tight text-emerald-900">
            Paloma Fresca
          </h1>
          <p class="mt-2 text-sm leading-relaxed text-slate-700 italic">
            A fresh citrus-forward coastal mocktail inspired by long afternoons on the Malibu pier.
          </p>
        </div>

        <!-- Ingredients -->
        <div class="p-4 mb-5 bg-[#F7F4EA] rounded-2xl shadow-lg border border-[#EAE6E4]">
          <h2 class="text-2xl text-slate-800 text-center mb-4">Ingredients</h2>
          <div class="text-sm leading-relaxed text-slate-800">
            <ul class="list-disc list-inside space-y-1">
              <li>4 oz fresh grapefruit juice</li>
              <li>1 oz lime juice</li>
              <li>2 oz sparkling water</li>
              <li>1 tsp agave syrup</li>
              <li>Sea-salt rim</li>
              <li>Rosemary sprig or grapefruit wedge (garnish)</li>
            </ul>
          </div>
        </div>

        <!-- Directions -->
        <div class="mb-5">
          <h2 class="text-2xl text-slate-800 text-center mb-4">Directions</h2>
          <ol class="mt-3 list-decimal list-inside space-y-1 text-sm leading-relaxed text-slate-800">
            <li>Run a lime wedge around the rim and dip the glass in sea salt.</li>
            <li>Fill the glass with ice.</li>
            <li>Add grapefruit juice, lime juice, and agave syrup.</li>
            <li>Stir gently to combine.</li>
            <li>Top with sparkling water.</li>
            <li>Garnish with rosemary sprig or grapefruit slice.</li>
          </ol>
        </div>

        <!-- Notes -->
        <div class="mb-6">
          <h2 class="text-2xl text-slate-800 text-center mb-4">Notes</h2>
          <p class="mt-3 text-xs leading-relaxed text-slate-700">
            Use pink grapefruit for a softer, sweeter profile. Swap sparkling water for tonic if you
            like more bite, or try smoked sea salt on the rim for an extra coastal twist.
          </p>
        </div>

        <!-- Footer brand line -->
        <div class="recipeFooter"></div>
      </div>

      <div class='recipeActions fixed bottom-0'></div>
    </div>`

    super.init(template, {
      recipeHeader: [".recipeHeader", RecipeHeader],
      recipeFooter: [".recipeFooter", RecipeFooter],
      recipeActions: [".recipeActions", RecipeActions],
    }, options)

    return this.dobs
  }
}
