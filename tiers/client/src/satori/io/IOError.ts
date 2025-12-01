// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html } from '../Donut.js'
import { Scroller } from './Scroller.js'

export class IOError extends Donut {
  public constructor(selector?: string) {
    super(selector)
  }

  private controller!: Controller

  declare public a: {
    fieldDob: Cash
  }

  public aSet(a: IOError['a']) {
    this.controller.fieldDob = a.fieldDob
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`<div class='ioError'></div>`
    super.init(template, props, options)

    this.controller = new Controller()
    this.controller.fieldDob = this.a.fieldDob
    this.controller.ioError = this.dobs
    this.controller.scrollingElement = this.app.scrollingElement
    return this.dobs
  }

  public play(message: string) {
    this.controller.play(message)
  }

  public stop() {
    this.controller.stop()
  }
}


export class Controller {
  private errorAnimPromise?: Promise<void>
  private errorPlayTimeout?: number

  public errorAnimateCssIn?: string
  public errorAnimateCssOut?: string
  public ioError!: Cash
  public fieldDob?: Cash
  public scrollingElement!: Cash

  public play(errorMessage: string): void {
    this.stop()
    if (this.errorPlayTimeout) window.clearTimeout(this.errorPlayTimeout)
    this.errorPlayTimeout = window.setTimeout(() => this.stop(), 20000)

    if (!this.errorAnimPromise) this.errorAnimPromise = Promise.resolve()
    var thisPromise
      = this.errorAnimPromise
      = this.errorAnimPromise.then(async () => {
        // if (errorMessage) this.ioError.html(`& xotime;${ errorMessage } `)
        if (errorMessage) this.ioError.html(`&rtrif;${errorMessage} `)
        Scroller.scrollToPlay(this.scrollingElement, this.ioError)
        if (this.ioError.css('display') == 'none') {
          this.ioError.show()
          await this.ioError.animateCss(this.errorAnimateCssIn || 'bounceIn')
        }
        if (this.fieldDob) this.fieldDob.css({ borderColor: '#ff0000' })
        if (thisPromise === this.errorAnimPromise)
          delete this.errorAnimPromise
        return
      })
  }

  public stop(): void {
    if (!this.errorPlayTimeout) return
    window.clearTimeout(this.errorPlayTimeout)
    delete this.errorPlayTimeout

    // do it
    if (this.fieldDob) this.fieldDob.css({ borderColor: '' })
    if (!this.errorAnimPromise) this.errorAnimPromise = Promise.resolve()
    var thisPromise
      = this.errorAnimPromise
      = this.errorAnimPromise.then(async () => {
        if (this.ioError.css('display') != 'none') {
          await this.ioError.animateCss(this.errorAnimateCssOut || 'bounceOut')
          this.ioError.hide()
        }
        if (thisPromise === this.errorAnimPromise)
          delete this.errorAnimPromise
      })
  }
}
