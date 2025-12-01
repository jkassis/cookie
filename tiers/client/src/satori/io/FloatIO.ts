// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { TextIO } from './TextIO.js'

export class FloatIO extends TextIO<number | undefined> {
  constructor() {
    super()
  }

  public async valueTextToValue(valueText?: string): Promise<number | undefined> {
    if (valueText === undefined || valueText == '')
      return undefined
    return Number.parseFloat(valueText)
  }

  public valueToValueText(value?: number): string {
    if (value === null || value === undefined)
      return ''
    return value.toString()
  }
}
