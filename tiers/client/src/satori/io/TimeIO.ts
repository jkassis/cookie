// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { TextIO, Validator as TextValidator } from './TextIO.js'

export interface Time {
  h: number
  m: number
  s: number
}

export class TimeIO extends TextIO<Time> {
  constructor() {
    super()
  }

  public static isValid(
    blurMessage = 'HH:MM',
    keypressMessage = 'hours, mins, secs'
  ): TextValidator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (valueText = '', key) {
        const valueRegex = /^\d?\d:\d?\d(:\d?\d)?$/
        // const valueRegex = new RegExp(`^\\d\\d\\:\\d\\d(\\:\\d\\d)?$`)
        if (!key) {
          if (TextIO.isEmpty(valueText)) return true
          if (!TextIO.isOnly(valueRegex, valueText)) return false
          try {
            var value = await TimeIO.valueTextToValue(valueText)
            if (value === undefined) return false
            if (value.h < 1 || value.h > 24) return false
            if (value.m < 0 || value.m > 59) return false
            if (value.s < 0 || value.s > 59) return false
          } catch (err) {
            return false
          }
        }

        return true
      }
    }
  }

  public static async valueTextToValue(valueText?: string): Promise<Time | undefined> {
    if (valueText === undefined || valueText == '')
      return undefined

    var hour: number, minute: number, second: number
    if (valueText.includes(':')) {
      var parts = valueText.split(':')
      hour = parts[0] ? Number.parseInt(parts[0]) : 0
      minute = parts[1] ? Number.parseInt(parts[1]) : 0
      second = parts[2] ? Number.parseInt(parts[2]) : 0
    } else {
      throw new Error("invalid value")
    }

    return { h: hour, m: minute, s: second }
  }

  public static valueToValueText(value: Time): string {
    if (value === null || value === undefined)
      return ''

    var h, m, s: number
    if (value.s != null)
      h = 0; m = 0; s = value.s
    if (value.m != null)
      h = 0; m = value.m
    if (value.h != null)
      h = value.h

    if (h == undefined && m == undefined && s == undefined) return ''

    var parts: String[] = []
    if (h)
      parts.push(h.toString().padStart(2, '0'))
    if (m)
      parts.push(m.toString().padStart(2, '0'))
    if (s) parts.push(s.toString().padStart(2, '0'))
    return parts.join(':')
  }

  public valueTextToValue(valueText: string): Promise<Time | undefined> {
    return TimeIO.valueTextToValue(valueText)
  }

  public valueToValueText(value: Time): string {
    return TimeIO.valueToValueText(value)
  }
}

