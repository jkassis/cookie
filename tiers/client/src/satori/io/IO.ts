// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html } from '../Donut.js'
import { Controller as ErrController } from './IOError.js'

var tabIndex: number = 0

export abstract class IO<T> extends Donut {
  public errController = new ErrController()
  public ioError!: Cash
  public errorExists: boolean = false
  public value?: T

  public static tabIndexNext(): number {
    return tabIndex++
  }

  public cancel(evt: Event) {
    if (evt) this.evtStop(evt)
  }

  public errorPlay(errorMessage: string): void {
    this.errController.play(errorMessage)
  }

  public errorStop(): void {
    this.errController.stop()
  }

  public hide(): Donut {
    this.dobs.css('display', 'none')
    this.errController.ioError.css('display', 'none')
    return this
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    super.init(template, props, options)
    this.errController = new ErrController()
    this.errController.fieldDob = this.dobs
    this.errController.ioError = this.ioError
    this.errController.scrollingElement = this.app.scrollingElement
    return this.dobs
  }

  public async play(): Promise<void> { }

  public show(): Donut {
    this.dobs.css('display')
    this.errController.ioError.css('display')
    return this
  }
}
