// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { TextIO } from './TextIO.js'

export class StringIO extends TextIO<string | undefined> {
  constructor() {
    super()
  }

  public async valueTextToValue(valueText?: string): Promise<string | undefined> {
    if (valueText == undefined || valueText == '') return undefined
    return valueText
  }

  public valueToValueText(value?: string): string {
    if (value === undefined) return ''
    return value
  }
}
