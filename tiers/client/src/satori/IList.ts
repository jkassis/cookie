// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import cash from 'cash-dom'
import { Cash, Element } from 'cash-dom'
import { List, ParameterizedDocDonut } from './List.js'

export class VIList<B extends ParameterizedDocDonut<T>, BP extends Record<string, any>, T> {
  // public a: {}

  public hasMore: boolean = false
  public list: List<B, BP, T>
  public page0Loaded: boolean = false
  public pageGet: (i: number) => Promise<T[]>
  public pageNext: number = 0
  public pageNextPlaying: boolean = false
  public scrollEvtListener: EventListener = (evt: Event) => { this.scroll(evt as UIEvent) }
  public scroller!: (e: Event) => void
  public scrollingElement: Cash

  constructor(scrollingElement: Cash, list: List<B, BP, T>, pageGet: (i: number) => Promise<T[]>) {
    this.scrollingElement = scrollingElement
    this.list = list
    this.pageGet = pageGet
  }

  public init() {
    return this
  }

  public async pageNextGet(): Promise<void> {
    this.page0Loaded = true
    if (this.pageNextPlaying || !this.hasMore) return
    this.pageNextPlaying = true

    var result = await this.pageGet(this.pageNext)
    this.pageNextPlaying = false
    if (result.length == 0) {
      this.hasMore = false
      return
    }
    this.pageNext++
    this.list.a.docs.splice(this.list.a.docs.length, 0, ...result)
    this.list.render()
  }

  public async play(): Promise<void> {
    // this.client.scrollingElement.scroll(this.scroller)
    window.addEventListener('scroll', this.scrollEvtListener)
  }

  public render() {
    this.list.render()
  }

  public async reset(): Promise<void> {
    this.pageNext = 0
    this.hasMore = true
    this.page0Loaded = false
    if (this.list.a.docs && this.list.a.docs.length) {
      this.list.a.docs = []
      await this.list.render()
    } else {
      this.list.a.docs = []
    }
  }

  public scroll(evt: UIEvent) {
    if ((this.scrollingElement.scrollTop() + 2 * window.innerHeight) < document.body.clientHeight) {
      return
    }

    this.pageNextGet()
  }

  public stop() {
    window.removeEventListener('scroll', this.scrollEvtListener)
  }
}

export class HIList<B extends ParameterizedDocDonut<T>, BP extends Record<string, any>, T> extends VIList<B, BP, T> {
  public async play(): Promise<void> {
    // this.client.scrollingElement.scroll(this.scroller)
    this.scrollingElement.get(0)!.addEventListener('scroll', this.scrollEvtListener)
  }

  public scroll(evt: UIEvent) {
    var scrollWidth = this.scrollingElement.get(0)!.scrollWidth
    var scrollLeft = this.scrollingElement.get(0)!.scrollLeft
    if ((scrollWidth - scrollLeft) < (2 * document.body.clientWidth)) {
      console.log('getting another page')
      this.pageNextGet()
    }
  }

  public stop() {
    this.scrollingElement.get(0)!.removeEventListener('scroll', this.scrollEvtListener)
  }
}
