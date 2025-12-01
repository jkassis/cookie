// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { DonutProps, DonutOptions, html } from '../Donut.js'
import { IO } from './IO.js'

const checkTextDefault = '&#10004;'
const uncheckTextDefault = ''

export interface Validator {
  message: string
  isValid(value: boolean): Promise<boolean>
}

export class CheckIO extends IO<boolean> {
  declare public a: {
    checkText?: string
    ioError?: Cash
    label?: string
    onChange?: (value: boolean) => Promise<any>
    uncheckText?: string
    validators?: Validator[]
    valueDefault?: boolean
  }

  public copyDob!: Cash
  public fieldDob!: Cash
  public hiddenDob!: Cash
  public inputDob!: Cash
  public label!: Cash
  public validatorInError!: Validator

  constructor() {
    super()
  }

  public static isTrue(message = 'Required'): Validator {
    return {
      message,
      isValid: async function (value: boolean | string, key?: boolean): Promise<boolean> {
        return value == true || value == 'true'
      }
    }
  }

  public static minChecked(num: number, checkIOs: CheckIO[], message: string): Validator {
    return {
      message,
      isValid: async function (value: boolean | string, key?: boolean): Promise<boolean> {
        var numChecked = 0
        for (var checkIO of checkIOs) if (checkIO.value) numChecked++
        return numChecked >= num
      }
    }
  }

  public aSet(a: CheckIO['a']) {
    this.a = a
    this.labelSet(this.a.label)
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions) {
    var tabindexStr: string = 'tabindex="-1"'
    if (options !== undefined && options.attrs !== undefined) {
      var tabindex = options.attrs.getNamedItem('tabindex')
      if (tabindex != undefined) {
        tabindexStr = `tabindex='${tabindex.value}'`
        options.attrs!.removeNamedItem('tabindex')
      }
    }

    template =
      html`
<div class='check IO'>
  <div class="field">
    <input type="checkbox" ${tabindexStr}></input>
    <div class='copy' id='${this.donutId.toString()}'></div>
  </div>
  <div class="label"></div>
  <div class="ioError"></div>
</div>`

    super.init(template, {
      inputDob: 'input',
      copyDob: '.copy',
      ioError: '.ioError',
      fieldDob: '.field',
      hiddenDob: 'input',
      label: '.label'
    }, options)

    this.inputDob.on('focus', () => this.fieldDob.focus())

    // bind handlers
    this.dobs.on('click touch', e => this.onTouch(e))
    this.copyDob.on('blur', e => this.onBlur())
    this.copyDob.on('focus', e => this.onFocus())
    this.copyDob.on('keydown', e => this.onKeydown(e))

    return this.dobs
  }

  public labelSet(label?: string) {
    if (label)
      this.label.html(label)
    else
      this.label.html('')
    this.label.css('display', 'block')
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

    this.inputDob.focus()
    if (this.a.onChange) await this.a.onChange(this.value!)
  }

  public async play() { }

  public async valueIsValidAndFinal(): Promise<boolean> {
    this.errorExists = false
    if (this.a.validators) {
      for (var validator of this.a.validators) {
        if (!(await validator.isValid(this.value!))) {
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
      this.copyDob.html(this.a.checkText || checkTextDefault)
      this.dobs.addClass('checked')
    } else {
      this.copyDob.html(this.a.uncheckText || uncheckTextDefault)
      this.dobs.removeClass('checked')
    }
  }
}
