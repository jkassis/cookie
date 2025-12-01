// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { IO } from './IO.js'
import { Cash } from 'cash-dom'
import { CheckIO } from './CheckIO.js'
import { DonutProps, DonutOptions, html } from '../Donut.js'

export interface Validator {
  message: string
  isValid(value: Days): boolean
}

export type Days = [boolean, boolean, boolean, boolean, boolean, boolean, boolean]
export class DaysIO extends IO<Days> {
  public friIO!: CheckIO
  public monIO!: CheckIO
  public satIO!: CheckIO
  public sunIO!: CheckIO
  public thuIO!: CheckIO
  public tueIO!: CheckIO
  public wedIO!: CheckIO

  public static isSet(blurMessage = 'Required'): Validator {
    return {
      message: blurMessage,
      isValid: function (value: Days) {
        return value.reduce((result, member) => {
          return result || member
        }, false)
      }
    }
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`
<div class='days IO'>
  <div class="field">
    <div class='sun IO' tabindex='${IO.tabIndexNext().toString()}'></div>
    <div class='mon IO' tabindex='${IO.tabIndexNext().toString()}'></div>
    <div class='tue IO' tabindex='${IO.tabIndexNext().toString()}'></div>
    <div class='wed IO' tabindex='${IO.tabIndexNext().toString()}'></div>
    <div class='thu IO' tabindex='${IO.tabIndexNext().toString()}'></div>
    <div class='fri IO' tabindex='${IO.tabIndexNext().toString()}'></div>
    <div class='sat IO' tabindex='${IO.tabIndexNext().toString()}'></div>
  </div>
  <div class="error"></div>
</div>
				`

    super.init(template, {
      fieldDob: '.field',
      ioError: '.ioError',
      sunIO: ['.sun.IO', CheckIO],
      monIO: ['.mon.IO', CheckIO],
      tueIO: ['.tue.IO', CheckIO],
      wedIO: ['.wed.IO', CheckIO],
      thuIO: ['.thu.IO', CheckIO],
      friIO: ['.fri.IO', CheckIO],
      satIO: ['.sat.IO', CheckIO]
    }, options)

    // bind handlers
    this.sunIO.aSet({
      onChange: async v => this.value![0] = v,
      label: 'Su'
    })
    this.monIO.aSet({
      onChange: async v => this.value![1] = v,
      label: 'Mo'
    })
    this.tueIO.aSet({
      onChange: async v => this.value![2] = v,
      label: 'Tu'
    })
    this.wedIO.aSet({
      onChange: async v => this.value![3] = v,
      label: 'We'
    })
    this.thuIO.aSet({
      onChange: async v => this.value![4] = v,
      label: 'Th'
    })
    this.friIO.aSet({
      onChange: async v => this.value![5] = v,
      label: 'Fr'
    })
    this.satIO.aSet({
      onChange: async v => this.value![6] = v,
      label: 'Sa'
    })

    return this.dobs
  }

  public async valueIsValidAndFinal(): Promise<boolean> {
    return true
  }

  public valueSet(value: Days) {
    if (!value) return
    this.value = value
    this.sunIO.valueSet(value[0])
    this.monIO.valueSet(value[1])
    this.tueIO.valueSet(value[2])
    this.wedIO.valueSet(value[3])
    this.thuIO.valueSet(value[4])
    this.friIO.valueSet(value[5])
    this.satIO.valueSet(value[6])
  }

  public async valueTextToValue(valueText?: string): Promise<Days | undefined> {
    throw new Error("unsuppoted")
  }

  public valueToValueText(value: Days) {
    return ''
  }
}
