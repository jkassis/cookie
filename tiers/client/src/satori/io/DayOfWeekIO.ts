// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { TextIO, Validator as TextValidator } from './TextIO.js'
import { DateTimePartVDayOfWeek } from '@jkassis/nexttime'

var daysOfWeek: string[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export class DayOfWeekIO extends TextIO<DateTimePartVDayOfWeek> {
  constructor() {
    super()
  }

  public static isValid(blurMessage = 'Mo Tu We Th Fr Sa or Su', keypressMessage = ''): TextValidator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key) {
        const valueRegex = /^\d\d:\d\d(:\d\d)?$/
        // const valueRegex = new RegExp(`^\\d\\d\\:\\d\\d(\\:\\d\\d)?$`)
        if (!key) {
          var index = daysOfWeek.findIndex(dayOfWeek => { return dayOfWeek && dayOfWeek.toLowerCase() == value.toLowerCase() })
          return index != 0 && index != -1
        }

        return true
      }
    }
  }

  public static valueToValueText(value?: DateTimePartVDayOfWeek): string {
    if (value === undefined) return ''

    return daysOfWeek[value]
  }

  public async valueTextToValue(valueText?: string): Promise<DateTimePartVDayOfWeek | undefined> {
    if (valueText === undefined || valueText == '')
      return undefined

    var index = daysOfWeek.findIndex(dayOfWeek => { return dayOfWeek && dayOfWeek.toLowerCase() == valueText.toLowerCase() })
    return index
  }

  public valueToValueText(value: DateTimePartVDayOfWeek): string {
    return DayOfWeekIO.valueToValueText(value)
  }
}

function pad(num: number, size: number): string {
  let numString = num.toString()
  while (numString.length < size) numString = '0' + num
  return numString
}
