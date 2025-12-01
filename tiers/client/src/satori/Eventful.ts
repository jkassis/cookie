// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { } from './Util.js'
export type EventHandler = ((...args: any[]) => Promise<void>) | ((...args: any[]) => void)
export class Hub { }
export class Eventful {
  public handlers?: Record<string, EventHandler[]>
  public handlersById?: Record<string, EventHandler>

  constructor() { }

  // do(fn, ...staticArgs) {
  //   if (!fn) throw new Error('no function to do')
  //   return (...dynamicArgs) => {
  //     return fn.apply(this, [...staticArgs, ...dynamicArgs])
  //   }
  // }
  public go(event: string, ...staticArgs: any[]): (...dynamicArgs: any) => Promise<any[]> {
    return (...dynamicArgs) => {
      var promises: (Promise<void> | void)[] = []
      if (this.handlers && this.handlers[event])
        this.handlers[event].forEach(function (handler) { promises.push(handler(...staticArgs, ...dynamicArgs)) })
      return Promise.all(promises)
    }
  }

  public off(event: string, handlerId: string) {
    if (!this.handlers) this.handlers = {}
    if (!this.handlersById) this.handlersById = {}

    var handler = this.handlersById[handlerId]

    var events = event.split(/\s+/)
    for (event of events) {
      if (!this.handlers[event]) continue
      if (handler) {
        var index = this.handlers[event].indexOf(handler)
        if (index == -1) continue
        this.handlers[event].splice(index, 1)
      } else {
        this.handlers[event] = []
      }
    }
  }

  // event handling services
  public on(event: string, handler: EventHandler, handlerId?: string) {
    if (!this.handlers) this.handlers = {}
    if (!this.handlersById) this.handlersById = {}

    if (handlerId) this.handlersById[handlerId] = handler

    var events = event.split(/\s+/)
    for (event of events) {
      if (!this.handlers[event]) {
        this.handlers[event] = []
      }

      this.handlers[event].push(handler)
    }
  }

  public onAll(handlers: { [k: string]: EventHandler }) {
    for (var [key, value] of Object.entries(handlers)) {
      this.on(key, value)
    }
  }
}
