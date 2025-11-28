// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html } from './satori/Donut.js'

export class RecipeFooter extends Donut {
  declare public a: {
    onShopListAdd: () => Promise<void>
    onShare: () => Promise<void>
    onSave: () => Promise<void>
  }

  public init(template: string, props: DonutProps, options: DonutOptions): Cash {
    template = html`
    <div>
      <!-- Message -->
      <div class="recipeFooter mt-6 border-t border-emerald-900/10 pt-3">
        <p class="text-center text-[0.7rem] tracking-[0.25em] text-emerald-900/70 uppercase">
          A Fresh Take on Coastal Living
        </p>
      </div>
    </div>`

    super.init(template, {
    }, options)

    // bind handlers
    return this.dobs
  }
}