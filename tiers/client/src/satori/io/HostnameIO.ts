// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { StringIO } from './StringIO.js'
import { Validator } from './TextIO.js'

export class HostnameIO extends StringIO {
  declare public a: {
    ioError?: Cash
    hostnameAvailable: (value: string) => Promise<boolean>
    onBlur?: (e: FocusEvent, value?: string) => Promise<any>
    onChange?: (value?: string) => Promise<any>
    onClick?: (value?: string) => void
    onEnterKeyPress?: () => Promise<any>
    onFocus?: (value?: string) => void
    onKeydown?: (value: string) => Promise<any>
    placeholder?: string
    validators?: Validator<string>[]
  }

  public resolved: boolean = true
  public valueOriginal: string = ''

  constructor() {
    super()
  }

  public aSet(a: HostnameIO['a']) {
    super.aSet(a)
  }

  public async valueIsValidAndFinal() {
    // if not valid... return not valid or final
    if (!(await super.valueIsValid(this.valueText)))
      return false

    // it's valid... is this the original value?
    if (this.valueOriginal == await this.valueTextToValue(this.valueText))
      return true

    var hostnameAvailable = await this.a.hostnameAvailable(this.value!)
    if (!hostnameAvailable) {
      this.errorExists = true
      this.errorPlay('Not available')
      return false
    }

    return true
  }

  public async valueTextToValue(valueText?: string): Promise<string | undefined> {
    if (valueText === undefined || valueText == '')
      return undefined
    return valueText
  }

  public valueToValueText(value?: string): string {
    if (value === undefined) return ''
    return value
  }
}
