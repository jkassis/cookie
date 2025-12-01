// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { IO } from './IO.js'
import { DonutProps, DonutOptions, html } from '../Donut.js'

export interface Validator {
  message: string

  isValid(value?: boolean): Promise<boolean>
}

export class SPSTButtonIO extends IO<boolean> {
  declare public a: {
    checkText?: string
    ioError?: Cash
    label: string
    onChange?: (value?: boolean) => Promise<any>
    uncheckText?: string
    validators?: Validator[]
    valueDefault?: boolean
  }

  public fieldDob!: Cash
  public hiddenDob!: Cash
  public labelDob!: Cash
  public validatorInError?: Validator

  constructor() {
    super()
  }

  public static isTrue(message = 'Required'): Validator {
    return {
      message,
      isValid: async function (value?: boolean | string, key?: boolean): Promise<boolean> {
        return value == true || value == 'true'
      }
    }
  }

  public static minChecked(num: number, ios: SPSTButtonIO[], message: string): Validator {
    return {
      message,
      isValid: async function (value?: boolean | string, key?: boolean): Promise<boolean> {
        var numChecked = 0
        for (var checkIO of ios) if (checkIO.value) numChecked++
        return numChecked >= num
      }
    }
  }

  public aSet(a: SPSTButtonIO['a']) {
    this.a = a
    this.labelSet(this.a.label)
  }


  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    var tabindexStr: string = 'tabindex="-1"'
    if (options !== undefined && options.attrs !== undefined) {
      var tabindex = options.attrs.getNamedItem('tabindex')
      if (tabindex != null) {
        tabindexStr = `tabindex='${tabindex.value}'`
        options.attrs!.removeNamedItem('tabindex')
      }
    }

    template =
      html`
<div class='spstButton IO'>
  <div class='field'>
    <div class='label' id='${this.donutId.toString()}'></div>
  </div>
  <div class='ioError'></div>
</div>`

    super.init(template, {
      ioError: '.ioError',
      fieldDob: '.field',
      labelDob: '.label'
    }, options)

    // bind handlers
    this.dobs.on('click touch', e => this.onTouch(e))
    this.dobs.on('focusout', e => this.onBlur())
    this.dobs.on('focusin', e => this.onFocus())
    this.dobs.on('keydown', e => this.onKeydown(e))

    return this.dobs
  }

  public labelSet(label: string) {
    this.labelDob.html(label)
  }

  public async onBlur(): Promise<void> { }

  public onFocus() { }

  public onKeydown(e: KeyboardEvent) {
    if (e.key.toLowerCase() == 'tab') return
    this.cancel(e)
    this.onTouch(e)
  }

  public async onTouch(e: Event) {
    this.evtStop(e)
    if (!this.value)
      this.valueSet(true)
    else
      this.valueSet(false)

    if (this.a.onChange) await this.a.onChange(this.value)
  }

  public async play() { }

  public async valueIsValidAndFinal(): Promise<boolean> {
    this.errorExists = false
    if (this.a.validators) {
      for (var validator of this.a.validators) {
        if (!(await validator.isValid(this.value))) {
          this.errorExists = true
          this.validatorInError = validator
          this.errorPlay(validator.message)
          break
        }
      }

      if (!this.errorExists) this.errorStop()
    }

    return !this.errorExists
  }

  public valueSet(value: boolean) {
    if (this.value == value) return
    this.value = value
    if (value === undefined || value === null)
      this.value = this.a.valueDefault
    if (this.value) {
      this.dobs.addClass('checked')
    } else {
      this.dobs.removeClass('checked')
    }
  }
}
