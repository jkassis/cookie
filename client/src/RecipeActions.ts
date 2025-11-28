// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html } from './satori/Donut.js'

export class RecipeActions extends Donut {
  declare public a: {
    onShopListAdd: () => Promise<void>
    onShare: () => Promise<void>
    onSave: () => Promise<void>
  }

  private shopListAddButton?: Cash
  private shareButton?: Cash
  private saveButton?: Cash

  public init(template: string, props: DonutProps, options: DonutOptions): Cash {
    template = html`
    <div class="flex justify-center gap-3 w-full pt-3 p-3 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
    <button
      class="saveButton h-full rounded bg-white border border-emerald-900/40 px-4 py-2.5 text-xs font-semibold tracking-wide text-emerald-900 active:bg-emerald-50 active:border-emerald-900 active:scale-95 transition-all duration-200 shadow-sm">
      Save
    </button>
    <button
      class="shareButton h-full rounded bg-white border border-emerald-900/40 px-4 py-2.5 text-xs font-semibold tracking-wide text-emerald-900 active:bg-emerald-50 active:border-emerald-900 active:scale-95 hover:background-emerald-900 transition-all duration-200 shadow-sm">
      Share
    </button>
    <button
      class="shopListAddButton h-full rounded bg-emerald-900 text-emerald-50 px-4 py-2.5 text-sm font-semibold tracking-wide active:bg-emerald-800 active:scale-95 transition-all duration-200 shadow-md">
      Add to Shop List
    </button>
    </div>`

    super.init(template, {
      shopListAddButton: '.shopListAddButton',
      shareButton: '.shareButton',
      saveButton: '.saveButton',
    }, options)

    // bind handlers
    this.shopListAddButton!.on('click touch', () => this.a.onShopListAdd())
    this.shareButton!.on('click touch', () => this.a.onShare())
    this.saveButton!.on('click touch', () => this.a.onSave())
    return this.dobs
  }
}