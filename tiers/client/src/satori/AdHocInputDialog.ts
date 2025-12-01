import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html } from './Donut.js'
import { FloatIO } from './io/FloatIO.js'
import { IntIO } from './io/IntIO.js'
import { StringIO } from './io/StringIO.js'

export class AdHocInputDialog extends Donut {
  declare public a: {}

  public float?: number
  public floatIO!: FloatIO
  public int?: number
  public intIO!: IntIO
  public string?: string
  public stringIO!: StringIO

  constructor() {
    super()
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`
<div class="adHocInputDialog dialog screen">
  <div class="floatIO" tabindex="9000"></div>
  <div class="intIO" inputmode="numeric" tabindex="9001"></div>
  <div class="stringIO IO" tabindex="9002"></div>
</div>`

    super.init(template, {
      floatIO: ['.floatIO', FloatIO],
      intIO: ['.intIO', IntIO],
      stringIO: ['.stringIO', StringIO]
    }, options)

    this.floatIO.aSet({
      onBlur: async (e, v) => { if (v !== undefined && v !== null) { this.float = v } }
    })
    this.intIO.aSet({
      onBlur: async (e, v) => { if (v !== undefined && v !== null) { this.int = v } }
    })
    this.stringIO.aSet({
      onBlur: async (e, v) => { if (v !== undefined && v !== null) { this.string = v } },
      placeholder: 'Phone or Email'
    })
    return this.dobs
  }

  public reset() {
    this.string = undefined
    this.stringIO.valueSet(undefined)
    this.stringIO.hide()

    this.int = undefined
    this.intIO.valueSet(undefined)
    this.intIO.hide()

    this.float = undefined
    this.floatIO.valueSet(undefined)
    this.floatIO.hide()
  }
}
