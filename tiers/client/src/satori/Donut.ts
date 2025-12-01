// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
var donutId = 0

import { API } from './API.js'
import { App } from './App.js'
import { Cash } from 'cash-dom'
import { DonutFactory } from './DonutFactory.js'
import { Loader } from './Loader.js'

export declare interface DonutOptions {
  attrs?: NamedNodeMap
}
export declare type DonutProp = string | [string, typeof Donut, DonutOptions?]
export declare interface DonutProps {
  [k: string]: DonutProp
}

declare type Signals = { [k: string]: Array<(value?: any | PromiseLike<any>) => void> }

export function html(strings: TemplateStringsArray, ...args: string[]): string {
  var out = ""
  strings.forEach((s, i) => { out += s; if (i < args.length) out += args[i] })
  return out
}

export function css(strings: TemplateStringsArray, ...args: string[]): string {
  var out = ""
  strings.forEach((s, i) => { out += s; if (i < args.length) out += args[i] })
  return out
}


export class Donut {
  public selector?: string
  public a: {}

  public api!: API
  public app!: App
  public dobs!: Cash
  public donutFactory!: DonutFactory
  public donutId: number
  public loader!: Loader
  public scrollTop: number = 0
  public signals?: Signals
  public stopping: boolean = false

  constructor(selector?: string) {
    this.selector = selector
    this.donutId = donutId++
    this.a = {}
  }

  // public static first(arr) {
  //   return arr[0]
  // }

  // public static optionAttr(options: DonutOptions, optionAttrKey: string, optionAttrDefault: string) {
  //   var optionAttrValue: string
  //   var optionAttrAttr = (options && options.attrs && options.attrs.getNamedItem(optionAttrKey))
  //   if (optionAttrAttr) {
  //     optionAttrValue = optionAttrAttr.value
  //     options.attrs?.removeNamedItem(optionAttrKey)
  //   }
  //   return optionAttrValue || (options && options[optionAttrKey]) || optionAttrDefault
  // }

  public attr(name: string, value: string) {
    this.dobs.attr(name, value)
  }

  // creates fake attrs
  public attrsMake(attrs: { [k: string]: any }): any {
    return {
      getNamedItem(k: string): any {
        return attrs[k]
      },
      removeNamedItem(k: string): any {
        delete attrs[k]
      }
    }
  }

  public config(config: object) {
    Object.assign(this, config)
  }

  public css(k: string, v: any) {
    this.dobs.css(k, v)
  }

  public dinkInit(id: string,
    dinkDob: Cash,
    controlledDob: Cash,
    closed?: boolean,
    callback?: () => Promise<void>) {
    var fn = () => this.dinkPlay(id, dinkDob, controlledDob, true, undefined, callback)
    dinkDob.on('click touch', fn)
    this.dinkPlay(id, dinkDob, controlledDob, false, closed, callback)
  }

  public dinkIsClosed(id: string) {
    var storageId = `donut_${this.donutId}:dink_${id}`
    return this.app.stor.get(storageId)
  }

  public dinkPlay(id: string,
    dinkDob: Cash,
    controlledDob: Cash,
    toggle = true,
    closed?: boolean,
    callback?: () => Promise<void>): Promise<void> {
    var storageId = `${id}.Dink`
    var closed = closed !== null ? closed : this.app.stor.get(storageId) as boolean
    if (toggle) closed = !closed
    if (closed) {
      dinkDob.addClass('closed')
      dinkDob.removeClass('open')
      controlledDob.hide()
    } else {
      dinkDob.addClass('open')
      dinkDob.removeClass('closed')
      controlledDob.show()
    }
    this.app.stor.put(storageId, closed)
    return callback ? callback() : Promise.resolve()
  }

  // public elemFirst(arr) {
  //   return arr[0]
  // }

  public async evtStop(e: Event) {
    if (!e) return
    e.stopPropagation()
    e.preventDefault()
  }

  public hide(): Donut {
    this.dobs.hide()
    return this
  }

  public hideIf(cond: boolean): Donut {
    if (cond)
      this.dobs.hide()
    else
      this.dobs.show()

    return this
  }

  public html(html: string) {
    this.dobs.html(html)
  }

  // Lifecycle Methods
  public init(template?: string, properties?: DonutProps, options?: DonutOptions): Cash {
    if (template === undefined || typeof template != 'string')
      throw new Error('Cannot call base Donut.Init with an undefined template')
    this.dobs = this.donutFactory.dobsMakeFromTemplate(template.trim())

    // apply attrs
    if (options && options.attrs) {
      for (var i = 0; i < options.attrs.length; i++) {
        var attr = options.attrs[i]

        // add classes
        if (attr.name == 'class') {
          this.dobs.addClass(attr.value)
        }

        // set all other attrs
        else {
          this.dobs.attr(attr.name, attr.value)
        }
      }
      delete options.attrs
    }

    // Link properties to dobs
    for (var prop in properties) {
      // spec is either a string identifying a path to a jquery element
      // or an array ['.asdf], Component] with a path and a component
      var spec = properties[prop]

      // the property is a vanilla jQuery element
      if (!Array.isArray(spec)) {
        var elem: Cash = this.dobs.find(spec)
        if (elem.length == 0) {
          console.error(`${this.constructor.name} template is missing '${prop}': '${spec}'`)
        }
        (this as any)[prop] = elem
        continue
      }

      // the property is a component that we need to bake first
      // the stub will be the parent element
      var stub = this.dobs.find(spec[0]).first()
      if (!stub || stub.length == 0) {
        console.error(`${this.constructor.name} template is missing '${prop}': ['${spec[0]}', ${spec[1].name}]`)
      } else if (stub.length == 1) {
        var subComponent = this.donutFactory.donutBake(spec[1], stub.find('[replace]'), stub, spec[2])
          ; (this as any)[prop] = subComponent
        var stubElement = stub.get(0)!
        stubElement.parentNode!.replaceChild(subComponent.dobs.get(0)!, stubElement)
      } else {
        throw new Error(`malformed property spec: ${spec}`)
      }
    }

    return this.dobs
  }

  // This method mixes static methods of the target class in with the current class
  // but i haven't figured out what this is good for yet.
  //
  // Here is an example of a mixin class. Note that methods are static.
  //
  // class Mixin {
  //    static async foo() {
  //      // Do something... 'this' resolves correctly.
  //      return this.foo;
  // }
  //
  public mixIn(clazz: any) {
    var keys = Object.keys(clazz)
    for (var key of Object.getOwnPropertyNames(clazz)) {
      var value = clazz[key]
      if (typeof value != 'function') {
        continue
      }
      if ((this as any)[key]) {
        throw new Error(
          `mixing ${key} into ${typeof this}, but ${key} already exists`
        )
      }
      (this as any)[key] = value
    }
  }

  public random(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  public randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min)
  }

  public render(): void { }

  public show(): Donut {
    this.dobs.show()
    return this
  }

  public showIf(cond: boolean): Donut {
    if (cond)
      this.dobs.show()
    else
      this.dobs.hide()

    return this
  }

  public signalSend(k: string): number {
    if (!this.signals)
      return 0
    if (!this.signals[k])
      return 0
    var waiters = this.signals[k]
    delete this.signals[k]
    for (var resolve of waiters)
      resolve()

    return waiters.length
  }

  public signalWait(k: string): Promise<void> {
    if (!this.signals)
      this.signals = {}
    if (!this.signals[k]) {
      this.signals[k] = []
    }

    return new Promise<void>((resolve, reject) => {
      this.signals![k].push(resolve)
    })
  }

  // this is a method for testing
  public sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  public splice(key: string, index: number, value: any) {
    var obj: any, propKey: string | undefined
    var segments = key.split('.')
    while (segments.length > 1) {
      propKey = segments.shift()
      obj = (this as any)[propKey!]
      if (obj === undefined) {
        obj = {}
      } else if (typeof obj != 'object') {
        throw new Error('splicing into into a non-object property')
      }
    }

    propKey = segments.shift()
    var arr = (this as any)[propKey!]
    if (arr === undefined) {
      arr = (this as any)[propKey!] = []
    } else if (!Array.isArray(arr)) {
      throw new Error('splicing into into a non-array property')
    }

    arr[index] = value
  }

  public text(text: string) {
    this.dobs.text(text)
  }
}
