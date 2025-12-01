// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { CheckIO } from './CheckIO.js'
import { Donut, DonutProps, DonutOptions, html } from '../Donut.js'

export class MoveOptsIO extends Donut {
  declare public a: {
    onChange: (opt: string) => Promise<void>
  }

  public oneDayIO!: CheckIO
  public standardIO!: CheckIO

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`
<div class='moveOpts IO'>
  <div class='1d IO'></div>
  <div class='st IO'></div>
</div>`

    super.init(template, {
      oneDayIO: ['.1d.IO', CheckIO],
      standardIO: ['.st.IO', CheckIO]
    }, options)

    // bind handlers
    this.oneDayIO.aSet({
      onChange: () => this.a.onChange('1d'),
      checkText: '1d'
    })
    this.standardIO.aSet({
      onChange: () => this.a.onChange('st'),
      checkText: 'st'
    })

    return this.dobs
  }

  public isValid() {
    return this.oneDayIO.value || this.standardIO.value
  }

  public async valueIsValidAndFinal() {
    return this.isValid()
  }

  public valueSet(value: string) {
    if (!value) return
    this.oneDayIO.valueSet(value.includes('1d'))
    this.standardIO.valueSet(value.includes('st'))
  }
}
