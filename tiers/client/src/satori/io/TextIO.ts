// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
const utilKeys = [
  'Delete',
  'Backspace',
  'ArrowLeft',
  'ArrowUp',
  'ArrowRight',
  'ArrowDown',
  'Shift',
  'Tab',
  'Meta'
]

const nonModifierKeys = [
  'ArrowLeft',
  'ArrowUp',
  'ArrowRight',
  'ArrowDown',
  'Shift',
  'Fn',
  'Tab',
  'Alt',
  'Meta',
  'Control'
]

const PasteKey = '<paste>'

import { Cash } from 'cash-dom'
import { IO } from './IO.js'
import { DonutProps, DonutOptions, html } from '../Donut.js'
import { DateTime } from '@jkassis/luxon'

export declare interface Autocompleters {
  bwd: Array<{ pattern: RegExp, replacer: (substring: string, ...args: any[]) => string }>
  fwd: Array<{ pattern: RegExp, replacer: (substring: string, ...args: any[]) => string }>,
}

export interface Validator<T> {
  blurMessage: string
  keypressMessage: string

  isValid(value?: T, key?: boolean): Promise<boolean>
}

abstract class BaseTextIO<T> extends IO<T> {
  public static isEmpty(value: string) {
    return value === undefined || value === '' || value === null
  }

  public static isOnly(pattern: RegExp, value: string) {
    return value.match(pattern)
  }

  public static isSet(blurMessage: string = 'Required', keypressMessage: string = 'Required'): Validator<any> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value, key) {
        if (key) return true
        return !TextIO.isEmpty(value)
      }
    }
  }

  public static isUtilKey(key: string) {
    return utilKeys.includes(key)
  }

  public static isValidABAAccountNumber(
    blurMessage = 'Invalid Account Number',
    keypressMessage = 'Numbers Only'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key) {
        const validChars = '0-9'
        const charsRegExp = new RegExp(`^[${validChars}@]*$`)
        const minLength = 6
        const maxLength = 20
        if (key) {
          if (!TextIO.isOnly(charsRegExp, value)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(charsRegExp, value)) return false
          if (!TextIO.longerThanOrEqual(value, maxLength + 1)) return false
          if (!TextIO.shorterThanOrEqual(value, minLength - 1)) return false
        }

        return true
      }
    }
  }

  public static isValidABARoutingNumber(
    blurMessage = 'Invalid Routing Number',
    keypressMessage = 'Numbers Only'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key) {
        const validChars = '0-9'
        const charsRegExp = new RegExp(`^[${validChars}@]*$`)
        const minLength = 9
        const maxLength = 9
        if (key) {
          if (!TextIO.isOnly(charsRegExp, value)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(charsRegExp, value)) return false
          if (!TextIO.longerThanOrEqual(value, maxLength + 1)) return false
          if (!TextIO.shorterThanOrEqual(value, minLength - 1)) return false
        }

        return true
      }
    }
  }

  public static isValidCCCvc(
    blurMessage = 'Three Digit CVC Code',
    keypressMessage = 'Three Digit CVC Code'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value: string = '', key: boolean): Promise<boolean> {
        const charsRegex = /^[\d]*$/
        const minLength = 3
        const maxLength = 3

        if (key) {
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
          if (TextIO.shorterThanOrEqual(value, minLength - 1)) return false
        }

        return true
      }
    }
  }

  public static isValidCCExpDate(
    blurMessage = 'Exp: MM/YY',
    keypressMessage = 'Exp: MM/YY'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value: string = '', key: boolean): Promise<boolean> {
        const pattern = /^(\d\d)\/?(\d{2}|\d{4})$/

        if (key) {
          return true
        } else {
          if (!TextIO.isOnly(pattern, value)) return false
          var matches = value.match(pattern)!
          // matches.groups

          var now = DateTime.local()
          var thisYear = now.year
          var thisMonth = now.month + 1
          var year = parseInt(matches[2])
          if (year < 100) {
            year = year + (thisYear - thisYear % 100)
          }

          if (year < thisYear || year > (thisYear + 10)) {
            return false
          }

          var month = parseInt(matches[1])
          if (month == 0 || month > 12) {
            return false
          }

          if (year == thisYear && month < thisMonth) {
            return false
          }
        }

        return true
      }
    }
  }

  public static isValidCCExpMonth(
    blurMessage = 'Exp Month from 01 to 12',
    keypressMessage = 'Exp Month from 01 to 12'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value: string = '', key: boolean): Promise<boolean> {
        const charsRegex = /^[\d]*$/
        const minLength = 2
        const maxLength = 2

        if (key) {
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
          if (TextIO.shorterThanOrEqual(value, minLength - 1)) return false
          var month = Number.parseInt(value)
          if (month < 1 || month > 12) {
            return false
          }
        }

        return true
      }
    }
  }

  public static isValidCCExpYear(
    blurMessage = 'Exp Year Two Digits',
    keypressMessage = 'Exp Year Two Digits'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value: string = '', key: boolean): Promise<boolean> {
        const charsRegex = /^[\d]*$/
        const minLength = 2
        const maxLength = 2

        if (key) {
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
          if (TextIO.shorterThanOrEqual(value, minLength - 1)) return false
        }

        return true
      }
    }
  }

  public static isValidCCNumber(
    blurMessage = 'Card Number',
    keypressMessage = '13 - 19 Digits'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value: string = '', key: boolean): Promise<boolean> {
        const charsRegex = /^[\d]*$/
        const minLength = 13
        const maxLength = 19

        if (key) {
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
          if (TextIO.shorterThanOrEqual(value, minLength - 1)) return false
        }

        return true
      }
    }
  }

  public static isValidChallengeSecret(
    blurMessage = '5 Alphanumerics',
    keypressMessage = '5 Alphanumerics'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key?): Promise<boolean> {
        const charsRegex = /^[\w\d\s]*$/
        const minLength = 5
        const maxLength = 5

        if (value) value = value.replace(/\s/g, '')

        if (key) {
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
          if (TextIO.shorterThanOrEqual(value, minLength - 1)) return false
        }

        return true
      }
    }
  }

  public static isValidColor(
    blurMessage = '#RRGGBB',
    keypressMessage = 'Hex Red Green Blue'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key) {
        const hexDigit = 'A-Fa-f0-9'
        const charsRegExp = new RegExp(`^[#${hexDigit}@]*$`)
        const valueRegex = new RegExp(`^#[${hexDigit}]{6}$`)

        if (key) {
          if (!TextIO.isOnly(charsRegExp, value)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(valueRegex, value)) return false
        }

        return true
      }
    }
  }

  public static isValidCustomURL(
    blurMessage = 'Invalid Hostname',
    keypressMessage = 'Lowercase, Numbers, and Dashes Only'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key) {
        const validChars = '0-9a-z\\-.'
        const charsRegExp = new RegExp(`^[${validChars}@]*$`)
        const nameChars = '0-9a-z\\-'
        const valueRegex = new RegExp(
          `^[${nameChars}]+(\\.[${nameChars}]+){1,3}$`
        )

        if (key) {
          if (!TextIO.isOnly(charsRegExp, value)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(valueRegex, value)) return false
        }

        return true
      }
    }
  }

  public static isValidDate(
    blurMessage = 'yyyy-mm-dd',
    keypressMessage = 'Only Digits and Dashes'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key) {
        const validChars = '0-9\\-'
        const charsRegExp = new RegExp(`^[${validChars}@]*$`)
        const valueRegex = /^\d\d\d\d-\d\d-\d\d$/

        if (key) {
          if (!TextIO.isOnly(charsRegExp, value)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(valueRegex, value)) return false
        }

        return true
      }
    }
  }

  public static isValidEin(
    blurMessage = '00-0000000',
    keypressMessage = 'digits and dashes only'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key) {
        const validChars = '0-9\\-'
        const charsRegExp = new RegExp(`^[${validChars}@]*$`)
        const valueRegex = /^\d\d-\d\d\d\d\d\d\d$/
        if (key) {
          if (!TextIO.isOnly(charsRegExp, value)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(valueRegex, value)) return false
        }

        return true
      }
    }
  }

  public static isValidEmail(
    blurMessage = 'Invalid Email Format',
    keypressMessage = 'Invalid Character'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key) {
        // TODO does this support all valid emails formats
        const chars = '\\.A-Za-z0-9_\\-\\.@'
        const charsRegex = new RegExp(`^[${chars}]*$`)
        const valueRegex = new RegExp(`^[${chars}]+@[${chars}]+$`)

        if (key) {
          if (!TextIO.isOnly(charsRegex, value)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(valueRegex, value)) return false
        }

        return true
      }
    }
  }

  public static isValidGTEQFloat(
    blurMessage = 'Enter a number greater than OVERRIDE.',
    keypressMessage = 'Enter a number greater than OVERRIDE.',
    min: number,
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value: string = '', key: boolean): Promise<boolean> {
        if (!key) {
          var num = parseFloat(value)
          if (num < min) return false
        }

        return true
      }
    }
  }

  public static isValidHostname(
    blurMessage = 'Invalid Hostname',
    keypressMessage = 'Lowercase, Numbers, and Dashes Only'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key) {
        const validChars = '0-9a-z\\-'
        const charsRegExp = new RegExp(`^[${validChars}@]*$`)
        const nameChars = '0-9a-z\\-'
        const valueRegex = new RegExp(`^[${nameChars}]+$`)

        if (key) {
          if (!TextIO.isOnly(charsRegExp, value)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(valueRegex, value)) return false
        }

        return true
      }
    }
  }

  public static isValidName(
    blurMessage = 'Invalid Name',
    keypressMessage = 'Letters Only'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key) {
        const validChars = '\\.0-9A-Za-z\\(\\)\\,\\$\\&\\\'\\’\\t \\-'
        const charsRegExp = new RegExp(`^[${validChars}@]*$`)
        const minLength = 2
        const maxLength = 2
        if (key) {
          if (!TextIO.isOnly(charsRegExp, value)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(charsRegExp, value)) return false
          if (!TextIO.longerThanOrEqual(value, maxLength + 1)) return false
        }

        return true
      }
    }
  }

  public static isValidPhone(
    blurMessage = 'Digits Only • 15 Max',
    keypressMessage = 'Digits only • 15 Max'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key) {
        const charsRegex = /^[+\d\s()._\-)]*$/
        const minLength = 10
        const maxLength = 16

        value = value.replace(/[\s()._-]/g, '')

        if (key) {
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
          if (TextIO.shorterThanOrEqual(value, minLength - 1)) return false
        }

        return true
      }
    }
  }

  public static isValidPosFloat(
    blurMessage = 'Enter positive number with optional decimal.',
    keypressMessage = 'Enter positive number with optional decimal.'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value: string = '', key?: boolean) {
        const charsRegex = /^[\d.]*$/
        value = String(value)

        if (key) {
          if (!TextIO.isOnly(charsRegex, value)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(charsRegex, value)) return false
        }

        return true
      }
    }
  }

  public static isValidPosInteger(
    blurMessage = 'Enter a positive number. No fractions.',
    keypressMessage = 'Enter a positive number. No fractions.'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value: string = '', key: boolean): Promise<boolean> {
        const charsRegex = /^[\d]*$/
        value = String(value)

        if (key) {
          if (!TextIO.isOnly(charsRegex, value)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(charsRegex, value)) return false
        }

        return true
      }
    }
  }

  public static isValidRangeFloat(
    blurMessage = 'Enter a number in range.',
    keypressMessage = 'Enter a number in range.',
    min: number,
    max: number
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value: string = '', key: boolean): Promise<boolean> {
        if (!key) {
          var num = parseFloat(value)
          if (num < min || num > max) return false
        }

        return true
      }
    }
  }

  public static isValidSearch(
    blurMessage = 'Letters or Numbers Only',
    keypressMessage = 'Letters or Numbers Only'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key) {
        const validChars = 'A-Za-z0-9:#.@+\'\\t \\-'
        const charsRegExp = new RegExp(`^[${validChars}@]*$`)

        if (key) {
          if (!TextIO.isOnly(charsRegExp, value)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(charsRegExp, value)) return false
        }

        return true
      }
    }
  }

  public static isValidSsn(
    blurMessage = '###-##-####',
    keypressMessage = 'Only Digits and Dashes'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value = '', key) {
        const validChars = '0-9\\-'
        const charsRegExp = new RegExp(`^[${validChars}@]*$`)
        const valueRegex = /^\d\d\d-\d\d-\d\d\d\d$/

        if (key) {
          if (!TextIO.isOnly(charsRegExp, value)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(valueRegex, value)) return false
        }

        return true
      }
    }
  }

  public static isValidZip(
    blurMessage = 'Zips look like 94403',
    keypressMessage = 'Zips look like 94403'
  ): Validator<string> {
    return {
      blurMessage,
      keypressMessage,
      isValid: async function (value: string = '', key: boolean): Promise<boolean> {
        const charsRegex = /^[\d]*$/
        const minLength = 5
        const maxLength = 5

        if (key) {
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
        } else {
          if (TextIO.isEmpty(value)) return true
          if (!TextIO.isOnly(charsRegex, value)) return false
          if (TextIO.longerThanOrEqual(value, maxLength + 1)) return false
          if (TextIO.shorterThanOrEqual(value, minLength - 1)) return false
        }

        return true
      }
    }
  }

  public static longerThanOrEqual(value: string, limit: number) {
    if (!value) return false
    return value.length >= limit
  }

  public static shorterThanOrEqual(value: string, limit: number) {
    if (!value) return false
    return value.length <= limit
  }
}

export interface TextOptions extends DonutOptions {
  iconUrl?: string
  tabindex: string
}

export abstract class TextIO<T> extends BaseTextIO<T> {
  private autocompleters?: Autocompleters
  private eventPromise?: Promise<void>
  private focus: boolean = false
  private initialized: boolean = false
  private validatorThatFailed?: Validator<string>
  private valueTextLast?: string

  declare public a: {
    ioError?: Cash
    onBlur?: (e: FocusEvent, value?: T) => Promise<any>
    onChange?: (value?: T) => Promise<any>
    onClick?: (value?: T) => void
    onFocus?: (value?: T) => void
    onKeyup?: (key: string, value?: T) => Promise<any>
    placeholder?: string
    validators?: Validator<string>[]
  }
  public copyDob!: Cash
  public placeholderDob!: Cash
  public tagStr!: string
  public valueText?: string

  constructor() {
    super()
    this.a = {}
  }

  public aSet(a: TextIO<T>['a']) {
    this.a = a
    this.placeholderSet(a.placeholder)
    if (a.ioError) this.errController.ioError = a.ioError
    this.errController.ioError.hide()
    // this.copyDob.attr('placeholder', placeholder)
  }

  public cancel(e: Event) {
    // evt.stopPropagation()
    // evt.preventDefault()
  }

  public fieldOnFocus() {
    this.copyDob.trigger('focus')
  }

  public init(template: string, props: DonutProps, options: TextOptions): Cash {

    if (!options.attrs) {
      options.attrs = new NamedNodeMap()
    }

    var tabindex = options.attrs.getNamedItem('tabindex')
    if (tabindex === undefined)
      throw 'stub element must have tabindex attribute'

    options.attrs.removeNamedItem('tabindex')
    var tabindexStr: string = (tabindex && tabindex.value) ? `tabindex=${tabindex.value}` : ''

    var type = (options && options.attrs && options.attrs.getNamedItem('type')) || undefined
    var typeStr: string = ''
    if (type) {
      typeStr = `type='${type.value}'`
      options.attrs.removeNamedItem('type')
    }

    var autocomplete = (options && options.attrs && options.attrs.getNamedItem('autocomplete')) || undefined
    var autocompleteStr: string = ''
    if (autocomplete) {
      autocompleteStr = `autocomplete='${autocomplete.value}'`
      options.attrs.removeNamedItem('autocomplete')
    }

    var autocapitalize = (options && options.attrs && options.attrs.getNamedItem('autocapitalize')) || undefined
    var autocapitalizeStr: string = ''
    if (autocapitalize) {
      autocapitalizeStr = `autocapitalize='${autocapitalize.value}'`
      options.attrs.removeNamedItem('autocapitalize')
    }

    var autocorrect = (options && options.attrs && options.attrs.getNamedItem('autocorrect')) || undefined
    var autocorrectStr: string = 'autocorrect=\'off\''
    if (autocorrect) {
      autocorrectStr = `autocorrect='${autocorrect.value}'`
      options.attrs.removeNamedItem('autocorrect')
    }

    var spellcheck = (options && options.attrs && options.attrs.getNamedItem('spellcheck')) || undefined
    var spellcheckStr: string = 'spellcheck=\'off\''
    if (spellcheck) {
      spellcheckStr = `inputmode='${spellcheck.value}'`
      options.attrs.removeNamedItem('spellcheck')
    }

    var name = (options && options.attrs && options.attrs.getNamedItem('name')) || undefined
    var nameStr: string = ''
    if (name) {
      nameStr = `name='${name.value}'`
      options.attrs.removeNamedItem('name')
    }

    var inputmode = (options && options.attrs && options.attrs.getNamedItem('inputmode')) || undefined
    var inputmodeStr: string = ''
    if (inputmode) {
      inputmodeStr = `inputmode='${inputmode.value}'`
      options.attrs.removeNamedItem('inputmode')
    }

    var step = (options && options.attrs && options.attrs.getNamedItem('step')) || undefined
    var stepStr: string = ''
    if (step) {
      stepStr = `step='${step.value}'`
      options.attrs.removeNamedItem('step')
    }

    var pattern = (options && options.attrs && options.attrs.getNamedItem('pattern')) || undefined
    var patternStr: string = ''
    if (pattern) {
      patternStr = `pattern='${pattern.value}'`
      options.attrs.removeNamedItem('pattern')
    }

    var maxlength = (options && options.attrs && options.attrs.getNamedItem('maxlength')) || undefined
    var maxlengthStr: string = ''
    if (maxlength) {
      maxlengthStr = `maxlength='${maxlength.value}'`
      options.attrs.removeNamedItem('maxlength')
    }

    var minlength = (options && options.attrs && options.attrs.getNamedItem('minlength')) || undefined
    var minlengthStr: string = ''
    if (minlength) {
      minlengthStr = `minlength='${minlength.value}'`
      options.attrs.removeNamedItem('minlength')
    }

    var id = (options && options.attrs && options.attrs.getNamedItem('id')) || undefined
    var idStr: string = ''
    if (id) {
      idStr = `id='${id.value}'`
      options.attrs.removeNamedItem('id')
    } else {
      idStr = `id='${this.donutId}'`
    }

    var tag = (options && options.attrs && options.attrs.getNamedItem('tag')) || undefined
    this.tagStr = 'input'
    if (tag) {
      this.tagStr = tag.value
      options.attrs.removeNamedItem('tag')
    }

    var icon = ''
    if (options.iconUrl) {
      icon = `<image class='icon' src='${options.iconUrl}'></image>`
    }

    template = html`
<div class='text IO'>
  <div class="field${icon ? ' with-icon' : ''} ${this.tagStr == 'textarea' ? 'textarea' : ''}">
    ${icon}
    <div class='placeholder'>&nbsp;</div>
    <${this.tagStr} class='copy hide' ${idStr} ${patternStr} ${typeStr} ${inputmodeStr} ${stepStr} ${maxlengthStr}
      ${minlengthStr} ${nameStr} ${tabindexStr} ${autocompleteStr} ${autocorrectStr} ${autocapitalizeStr}
      ${spellcheckStr}></${this.tagStr}>
  </div>
  <div class='ioError'></div>
</div>`

    super.init(template, {
      fieldDob: '.field',
      copyDob: '.copy',
      ioError: '.ioError',
      placeholderDob: '.placeholder'
    }, options)

    this.copyDob.on('click touch', e => this.onClick(e))
    this.copyDob.on('keyup', e => this.onKeyup(e))
    this.copyDob.on('paste', e => this.onPaste(e))
    this.dobs.on('click touch', e => this.fieldOnFocus())
    this.dobs.on('focusin', e => this.onFocus())
    this.dobs.on('focusout', e => this.onBlur(e))

    return this.dobs
  }

  public async onBlur(e: FocusEvent): Promise<void> {
    if (!this.eventPromise) this.eventPromise = Promise.resolve()
    this.eventPromise = this.eventPromise.then(async () => {
      if (!this.focus) return
      this.focus = false
      await this.submit()
      if (this.a.onBlur) await this.a.onBlur(e, this.value)
      if (this.valueTextIsEmpty()) {
        this.placeholderDob.removeClass('hide')
        this.copyDob.addClass('hide')
      }
    })
    return this.eventPromise
  }

  public onClick(e: Event) {
    if (this.a.onClick) this.a.onClick(this.value)
  }

  public onFocus(): Promise<void> {
    if (!this.eventPromise) this.eventPromise = Promise.resolve()
    this.eventPromise = this.eventPromise.then(async () => {
      if (this.focus) return
      this.focus = true
      this.valueTextLast = this.valueToValueText(this.value)
      this.copyDob.val(this.valueTextLast)

      if (this.a.onFocus) this.a.onFocus(this.value)
      // disable the placeholder text
      this.placeholderDob.addClass('hide')
      this.copyDob.removeClass('hide')
    })

    return this.eventPromise
  }

  public async onKeyup(e: KeyboardEvent) {
    this.cancel(e)

    if (!this.eventPromise) this.eventPromise = Promise.resolve()
    this.eventPromise = this.eventPromise.then(async () => {
      var valueText = this.copyDob.val() as string

      if (e.key == 'Delete' || e.key == 'Backspace') {
        if (this.autocompleters && this.autocompleters.bwd) {
          for (var ac of this.autocompleters.bwd)
            valueText = valueText.replace(ac.pattern, ac.replacer)
          this.copyDob.val(valueText)
        }
      } else if (e.key == 'Enter' && this.tagStr != 'textarea') {
        await this.submit()
        if (this.a.onKeyup) await this.a.onKeyup(e.key, this.value)
        return
      } else {
        if (this.autocompleters && this.autocompleters.fwd) {
          for (var ac of this.autocompleters.fwd)
            valueText = valueText.replace(ac.pattern, ac.replacer)
          this.copyDob.val(valueText)
        }
      }

      this.resize()

      // run a validation unless the key is a tab
      // this prevents failed validations when tabbing into a field
      if (nonModifierKeys.includes(e.key)) {
        return
      }
      await this.valueTextIsValid(valueText, true)
      this.valueText = valueText

      // do the external keyup
      if (this.a.onKeyup) await this.a.onKeyup(e.key, this.value)
    })
  }

  public async onPaste(e: ClipboardEvent) {
    if (e.clipboardData == null) return
    const val = e.clipboardData.getData('text')

    this.resize()

    // this prevents failed validations when tabbing into a field
    if (!await this.valueTextIsValid(val, true)) return
    this.valueText = val

    if (this.a.onKeyup) await this.a.onKeyup(PasteKey, this.value)
  }

  public placeholderSet(placeholder?: string) {
    if (placeholder == null || placeholder == undefined)
      placeholder = '&nbsp;'
    this.placeholderDob.html(placeholder)
  }

  public async play() { }

  public resize() {
    if (this.tagStr != 'textarea')
      return

    var field = this.copyDob.get(0)!

    // Reset field height
    field.style.height = 'inherit'

    // Get the computed styles for the element
    var computed = window.getComputedStyle(field)

    // Calculate the height
    var height = parseInt(computed.getPropertyValue('border-top-width'), 10)
      + parseInt(computed.getPropertyValue('padding-top'), 10)
      + field.scrollHeight
      + parseInt(computed.getPropertyValue('padding-bottom'), 10)
      + parseInt(computed.getPropertyValue('border-bottom-width'), 10)

    field.style.height = height + 'px'
  }

  // this is external so that enter can submit
  public async submit() {
    // is the valueText valid?
    await this.valueTextIsValid(this.valueText)
    if (this.errorExists) {
      // no... don't even try to convert it to a value...
      // in fact... reset it to the value on focus
      var value = await this.valueTextToValue(this.valueTextLast)
      this.valueSet(value)

      // and leave any errors currently presented
      return
    }

    // stop / clear any errors currently on screen
    this.errorStop()

    // do nothing if it hasn't changed
    if (this.valueText != this.valueTextLast) {
      // this little loop allows input classes to modify the input on blur
      try {
        var value = await this.valueTextToValue(this.valueText)
        this.valueSet(value)
        if (this.a.onChange) await this.a.onChange(this.value)
        this.valueTextLast = this.valueText
      } catch (err: any) {
        if (err.message != undefined) {
          this.errorExists = true
          this.errorPlay(err.message)
          return
        }

        throw err
      }
    }
  }

  public async valueIsValid(value: T, keypress?: boolean): Promise<boolean> {
    var valueText = this.valueToValueText(value)
    return this.valueTextIsValid(valueText)
  }

  public async valueIsValidAndFinal(suppressErrorMessages = false): Promise<boolean> {
    // wait for any events to finish
    if (this.eventPromise) await this.eventPromise

    // valueText should be in sync so we just shortcut to valueTextIsValid
    return await this.valueTextIsValid(this.valueText, false, suppressErrorMessages)
  }

  public valueSet(value: T | undefined) {
    this.initialized = true
    this.value = value
    this.valueTextSet(this.valueToValueText(value))
  }

  public valueTextHasChanged(): boolean {
    return this.valueText != this.valueTextLast
  }

  public valueTextIsEmpty(): boolean {
    return this.valueText === undefined || this.valueText === null || this.valueText == ''
  }

  public async valueTextIsValid(value?: string, keypress?: boolean, suppressErrorMessages?: boolean): Promise<boolean> {
    this.errorExists = false
    if (this.a.validators) {
      for (var validator of this.a.validators) {
        if (!(await validator.isValid(value, keypress))) {
          this.errorExists = true
          this.validatorThatFailed = validator
          if (!suppressErrorMessages)
            if (keypress) this.errorPlay(validator.keypressMessage)
            else this.errorPlay(validator.blurMessage)
          break
        }
      }

      if (!this.errorExists) this.errorStop()
    }

    return !this.errorExists
  }

  public valueTextSet(valueText: string) {
    this.valueText = valueText
    if (this.valueTextIsEmpty()) {
      this.placeholderDob.removeClass('hide')
      this.copyDob.addClass('hide')
    } else {
      this.placeholderDob.addClass('hide')
      this.copyDob.removeClass('hide')
    }
    this.copyDob.val(this.valueText)
  }

  public abstract valueTextToValue(valueText?: string): Promise<T | undefined>
  public abstract valueToValueText(value?: T): string
}
