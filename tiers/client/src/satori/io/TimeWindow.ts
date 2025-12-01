// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html } from '../Donut.js'
import { msPer } from '../Const.js'

export class TimeWindowIO extends Donut {
  declare public a: {
    windowMs: number
    windowMsOptions: number[]
    onChange: () => Promise<void>
  }

  public desc!: Cash
  public lessButton!: Cash
  public moreButton!: Cash

  public static DurationMsToText(durationMs: number): string {
    if (durationMs < msPer.minute) return `${durationMs / msPer.second}s<br/>window`
    else if (durationMs < msPer.hour) return `${durationMs / msPer.minute}m<br/>window`
    else if (durationMs < msPer.day) return `${durationMs / msPer.hour}h<br/>window`
    else if (durationMs < msPer.week) return `${durationMs / msPer.day}d<br/>window`
    else throw { code: 'invalid.durationMs' }
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`
<div class='timeWindow IO'>
  <div class="lessButton IO">
    <div class="copy">less</div>
  </div>
  <div class="desc OO"></div>
  <div class="moreButton IO">
    <div class="copy">more</div>
  </div>
</div>`

    super.init(template, {
      lessButton: '.lessButton.IO',
      moreButton: '.moreButton.IO',
      desc: '.desc.OO',
    }, options)

    // bind handlers
    this.lessButton.on('click touch', e => this.less(e))
    this.moreButton.on('click touch', e => this.more(e))
    return this.dobs
  }

  public async isValid() {
    return true
  }

  public async less(e: Event) {
    this.evtStop(e)
    this.lessButton.animateCss('bounceIn')

    var sortedOptions = this.a.windowMsOptions.sort((a, b) => a > b ? -1 : 1)
    var i = sortedOptions.findIndex(o => o < this.a.windowMs)
    if (i == -1) return
    this.a.windowMs = sortedOptions[i]
    this.render()
    await this.a.onChange()
  }

  public async more(e: Event) {
    this.evtStop(e)
    this.moreButton.animateCss('bounceIn')

    var sortedOptions = this.a.windowMsOptions.sort((a, b) => a < b ? -1 : 1)
    var i = sortedOptions.findIndex(o => o > this.a.windowMs)
    if (i == -1) return
    this.a.windowMs = sortedOptions[i]
    this.render()
    await this.a.onChange()
  }

  public async play(): Promise<void> {
    return
  }

  public render() {
    this.desc.html(TimeWindowIO.DurationMsToText(this.a.windowMs))
  }
}
