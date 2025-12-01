// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { DateTime } from '@jkassis/luxon'
import { Donut, DonutProps, DonutOptions, html } from './Donut.js'

export class InstallPrompt extends Donut {
  public pane!: Cash

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`
<div class='installPrompt screen'>
  <div class="headroom">&nbsp;</div>
  <div class="pane">
    <div class="close">X</div>
    <div class="iconStrip"> <img class="icon" src="/static/img/app-icon-144x144.png"></img> </div>
    <div class="h1">Install FarmGoods</div>
    <div class="message">Install this application on your home screen for quick and easy access when you're on the go.
    </div>
    <div class="footer">
      <div class="content"> Just tap &nbsp;&nbsp;<img class="share icon" src="/static/img/share.png"></img>&nbsp;&nbsp;then 'Add
        to Home Screen' </div>
    </div>
  </div>
</div>`

    super.init(template, {
      pane: '.pane'
    }, options)

    this.pane.on('click touch', () => {
      this.stop()
    })

    return this.dobs
  }

  public promptPlay(
    messageHtml: string,
    defaultButtonHtml: string,
    alternateButtonHtml: string,
    scrimClearOnExit: boolean = true
  ) {
    var needsToSeePrompt = () => {
      if (this.app.conf.STANDALONE) {
        return false
      }
      // let isApple = ['iPhone', 'iPad', 'iPod'].includes(navigator.platform);
      // if (!isApple)
      //   return false;

      let lastPrompt = this.app.stor.get('lastSeenPrompt')
      if (!lastPrompt) return true

      lastPrompt = DateTime.fromMillis(lastPrompt)
      const today = DateTime.local()
      const duration = today.diff(lastPrompt, 'days')
      return duration.days > 14
    }

    if (!needsToSeePrompt()) return

    this.app.scrollingElement.scrollTop(0)
    this.app.scrimPlay()
    this.dobs.css('display', 'flex')
    this.app.stor.put('lastSeenPrompt', Date.now())
  }

  public async stop() {
    this.dobs.hide()
    this.app.scrimStop()
  }
}
