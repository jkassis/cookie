// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html } from './satori/Donut.js'

export class RecipeHeader extends Donut {
  declare public a: {}

  public init(template: string, props: DonutProps, options: DonutOptions): Cash {
    template = html`
  <div class="relative m-2 text-center p-2">
    <!-- Corner decorations -->
    <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-900/40"></div>
    <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-900/40"></div>
    <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-900/40"></div>
    <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-900/40"></div>

    <!-- Side accent marks -->
    <!--
      <div class="absolute top-1/2 left-0 w-2 h-px bg-emerald-900/40 -translate-y-1/2"></div>
      <div class="absolute top-1/2 right-0 w-2 h-px bg-emerald-900/40 -translate-y-1/2"></div>
    -->

    <p class="text-xs font-semibold tracking-[0.2em] text-emerald-900/80 uppercase">
      FarmGoods Market
    </p>
    <p class="mt-1 text-[0.7rem] tracking-[0.25em] text-emerald-900/60 uppercase">
      - Mocktail Series -
    </p>
  </div>`

    super.init(template, {}, options)

    // bind handlers
    return this.dobs
  }
}