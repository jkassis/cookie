// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html } from './Donut.js'

export interface ParameterizedDocDonut<T> extends Donut {
  a: Record<string, any>
}

export class List<B extends ParameterizedDocDonut<T>, BP extends Record<string, any>, T> extends Donut {
  declare public a: {
    item: {
      a?: BP
      class: { new(): B }
      docSet: (donut: B, doc: T) => void
      options?: { [k: string]: any }
      render: (donut: B) => Promise<void>
    }
    docs: T[]
  }

  public itemDonuts: B[]
  public listDob!: HTMLElement

  constructor() {
    super()
    this.itemDonuts = []
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`
<div class='list'></div>`
    super.init(template, props, options)

    this.a.docs = []
    this.listDob = this.dobs.get(0) as HTMLElement
    return this.dobs
  }

  public itemDonutGet(i: number): B {
    if (this.itemDonuts[i]) return this.itemDonuts[i]

    // Make it
    var donut: B = this.donutFactory.donutBake<B>(this.a.item.class, undefined, undefined, this.a.item.options)

    // Copy props
    if (this.a.item.a)
      for (var key of Object.keys(this.a.item.a))
        donut.a[key] = this.a.item.a[key]

    // Append to list
    this.listDob.append(donut.dobs.get(0) as HTMLElement)
    this.itemDonuts[i] = donut
    return donut
  }

  public refresh() {
    let i = 0
    for (; i < this.a.docs.length; i++) {
      const itemDonut = this.itemDonutGet(i)
      itemDonut.render()
    }
  }

  public render(): Promise<void[]> {
    var promises: Promise<void>[] = []
    var docs = this.a.docs

    // make donuts
    let i = 0
    for (; i < docs.length; i++) {
      const itemDonut = this.itemDonutGet(i)
      const j = i
      this.a.item.docSet(itemDonut, docs[j])
      itemDonut.dobs.show()
      promises.push(this.a.item.render(itemDonut))
    }
    for (; i < this.itemDonuts.length; i++)
      this.itemDonuts[i].dobs.hide()

    return Promise.all(promises)
  }

  public async valueIsValidAndFinal() {
  }
}
