// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html } from '../Donut.js'
import { IO } from './IO.js'
import { TextIO, Validator } from './TextIO.js'

export abstract class SearchIO<T = string> extends Donut {
  public abstract InputClass: typeof Donut
  declare public a: {
    onBlur?: (value: T | undefined) => Promise<any>
    onChange?: () => Promise<any>
    onFocus?: () => Promise<any>
    onIntentButton?: () => Promise<any>
    placeholder: string
    submitAuto: boolean
    submitButtonRender?: boolean
  }

  public clearButton!: Cash
  public intentButton!: Cash
  public lastChangeTs: number = Date.now()
  public locateButton!: Cash
  public submitAutoTimeout?: number
  public submitButton!: Cash
  abstract validators?: Validator<string>[]
  public valueIO!: TextIO<T>

  constructor() {
    super()
  }

  public aSet(a: SearchIO<T>['a']) {
    if (!a.placeholder) a.placeholder = 'Search'
    this.a = a

    this.valueIO.aSet({
      onBlur: (e: FocusEvent, v: T | undefined): Promise<any> => {
        if (this.blurToSelf(e)) {
          return Promise.resolve()
        }
        if (this.a.onBlur == undefined) {
          return Promise.resolve()
        }
        return this.a.onBlur(this.valueIO.value)
      },
      onChange: () => this.onChange(),
      onFocus: () => this.a.onFocus && this.a.onFocus(),
      onKeyup: (k: string, v?: T) => this.onKeyup(k, v),
      placeholder: this.a.placeholder,
      validators: this.validators
    })
  }

  public blurToSelf(event: FocusEvent): boolean {
    if (!event.relatedTarget) return false
    return this.dobs.get(0)!.contains(event.relatedTarget as HTMLElement)
  }

  public async clear(e: Event) {
    this.evtStop(e)
    this.valueIO.valueSet(undefined)
    this.valueIO.placeholderDob.trigger('click')
    this.clearButton.hide()
    if (this.a.onChange) await this.a.onChange()
  }

  public clearButtonKeydown(evt: KeyboardEvent): void {
    if (evt.shiftKey) return
    if (evt.key == 'Tab') return
    this.clear(evt)
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = template ||
      html`
<div class='search IO'>
  <div class='pane'>
    <div class='value IO' inputmode='search' tabindex="${IO.tabIndexNext().toString()}" autocapitalize='off' autocomplete='off'>
    </div>
    <div class='submit icon' tabindex="${IO.tabIndexNext().toString()}"></div>
    <div class='clear icon' tabindex="${IO.tabIndexNext().toString()}"></div>
    <div class='intent icon' tabindex="${IO.tabIndexNext().toString()}"></div>
  </div>
</div>`

    super.init(template, {
      intentButton: '.intent.icon',
      submitButton: '.submit.icon',
      clearButton: '.clear.icon',
      valueIO: ['.value.IO', this.InputClass]
    }, options)

    this.valueIO.errController.ioError.css('display', 'none')

    this.a.submitButtonRender = true

    this.submitButton.on('click touch', e => this.submitButtonPlay(e))
    this.submitButton.on('keydown', e => this.submitButtonKeydown(e))

    this.clearButton.on('click touch', e => this.clear(e))
    this.clearButton.on('keydown', e => this.clearButtonKeydown(e))

    this.intentButton.on('click touch', e => this.intentButtonPlay(e))
    this.intentButton.on('keydown', e => this.intentButtonKeydown(e))

    this.valueIO.errController.errorAnimateCssIn = 'fadeInRight'
    this.valueIO.errController.errorAnimateCssOut = 'fadeOutRight'

    return this.dobs
  }

  public intentButtonKeydown(evt: KeyboardEvent): void {
    if (evt.shiftKey) return
    if (evt.key == 'Tab') return
    this.intentButtonPlay(evt)
  }

  public async onChange(): Promise<void> {
    this.submitButton.hide()

    // clear the automaticUpdateTimeout
    if (this.submitAutoTimeout) {
      window.clearTimeout(this.submitAutoTimeout)
      delete this.submitAutoTimeout
    }

    if (this.a.onChange) await this.a.onChange()
  }

  public async onKeyup(key: string, value?: T) {
    // Clear the submitAutoTimou
    if (this.submitAutoTimeout) {
      window.clearTimeout(this.submitAutoTimeout)
      delete this.submitAutoTimeout
    }

    // manage the clear button
    if (this.valueIO.valueTextIsEmpty())
      this.clearButton.hide()
    else {
      this.clearButton.show()
    }

    // manage the submit button
    this.submitButton.hide()
    if (this.valueIO.valueTextHasChanged()) {
      if (key != 'Enter' || this.valueIO.tagStr == 'textarea') {
        if (this.a.submitButtonRender) this.submitButton.show()
        if (this.a.submitAuto)
          this.submitAutoTimeout = window.setTimeout(() => this.valueIO.submit(), 1000)
      }
    }
  }

  public async play() { }

  public submitButtonKeydown(evt: KeyboardEvent): void {
    if (evt.shiftKey) return
    if (evt.key == 'Tab') return
    this.onChange()
  }

  public submitButtonPlay(e: Event): Promise<void> {
    return this.onChange()
  }

  public valueGet(): T | undefined {
    return this.valueIO.value
  }

  public valueSet(value: T) {
    this.valueIO.valueSet(value)
    if (this.valueIO.valueTextIsEmpty())
      this.clearButton.hide()
    else
      this.clearButton.show()

    this.submitButton.hide()
  }

  public abstract intentButtonPlay(e: Event): Promise<void>
}
