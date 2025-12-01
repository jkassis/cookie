// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { API } from './API.js'
import { App } from './App.js'
import { Cash, Selector, Context } from 'cash-dom'
import cash from 'cash-dom'
import { Donut, DonutOptions, html } from './Donut.js'
import { Loader } from './Loader.js'

export declare interface DobServices {
  api: API
  app: App
  conf: { [k: string]: any }

  loader: Loader
}

export declare interface DonutClass<T extends Donut> {
  new(): T
}

export class DonutFactory {
  public factoryElement!: HTMLElement
  public factoryCash!: Cash
  public services: DobServices

  constructor(services: DobServices) {
    this.services = services
  }

  public dobsMakeFromTemplate(template: string): Cash {
    try {
      this.factoryElement.innerHTML = template
    } catch (err) {
      console.error(`bad Template...`)
      console.log(template)
    }
    return this.factoryCash.contents() as Cash
  }

  donutBake<T extends Donut>(
    clazz: DonutClass<T>,
    transclusions?: Cash,
    stub?: Cash,
    options?: DonutOptions): T {

    if (!clazz) {
      throw new Error('clazz.not.specified')
    }

    // create the component
    var donut: T = new clazz()

    // inject services into the new component
    Object.assign(donut, this.services)
    donut.donutFactory = this

    // validate that the donut has an init fn
    if (!donut.init) {
      console.log('clazz.lacks.init.fn')
      console.log(`clazz is ${clazz}`)
      throw new Error('clazz.lacks.init.fn')
    }

    // do we have a stub
    if (stub !== undefined) {
      // yes. do we have attributes
      var stubAttrs = stub.get(0)!.attributes
      if (stubAttrs) {
        // yes. forward / merge the html attributes with the options object
        if (!options) {
          options = { attrs: stubAttrs }
        } else {
          options['attrs'] = stubAttrs
        }
      }
    }

    // template and children are options passed by components
    donut.init(undefined, undefined, options)

    // handle transclusions
    if (transclusions) {
      for (var transclusion of transclusions) {
        var replaceSelector = cash(transclusion).attr('replace')
        if (!replaceSelector) throw new Error(`could not find transclusionReplaceSelector: ${replaceSelector}`)
        donut.dobs.find(replaceSelector).replaceWith(transclusion)
      }
    }

    return donut
  }

  public init() {
    this.factoryCash = cash(document.createElement('div'))
    this.factoryElement = this.factoryCash.get(0)!
  }
}
