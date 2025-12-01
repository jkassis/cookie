// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { SearchIO } from './SearchIO.js'
import { StringIO } from './StringIO.js'
import { TextIO, Validator } from './TextIO.js'

export class TextSearchIO extends SearchIO<string> {
  public InputClass: typeof StringIO
  validators?: Validator<string>[]

  constructor() {
    super()
    this.InputClass = StringIO
    this.validators = [TextIO.isValidSearch()]
  }

  public async intentButtonPlay(e: Event): Promise<void> {
    this.evtStop(e)
    if (this.a.onChange) this.a.onChange()
  }
}
