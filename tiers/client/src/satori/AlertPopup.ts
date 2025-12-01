// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html } from './Donut.js'

declare interface Job {
  alternateButtonHtml?: string
  defaultButtonHtml: string
  messageHtml: string | Donut
  reject: (err: any) => void,
  resolve: (choice: AlertResponse) => void,
  scrimClearOnExit: boolean
  scrimPlay: boolean
  syncCallback?: (choice: AlertResponse) => Promise<void>
}

export enum AlertResponse {
  Default = 'd',
  Alt = 'a',
  Skipped = 's'
}

export class AlertPopup extends Donut {
  public alternateButton!: Cash
  public defaultButton!: Cash
  public job?: Job
  public message!: Cash
  public container!: Cash
  public playing: boolean = false
  public queue!: Job[]
  public spacer!: Cash

  public alertOne() {
    if (this.playing || this.queue.length == 0) return
    this.playing = true

    var job = this.job = this.queue.shift()
    if (!job) return
    var {
      alternateButtonHtml,
      defaultButtonHtml,
      messageHtml,
      reject,
      resolve,
      scrimClearOnExit = true,
      scrimPlay = true,
      syncCallback = null,
    } = this.job!

    if (scrimPlay) this.app.scrimPlay()

    // message
    this.message.children().detach() // this is the nice way... retains event handlers in substructure
    if (typeof messageHtml == 'string')
      this.message.html(messageHtml)
    else {
      var donut = messageHtml as Donut
      this.message.append(donut.dobs)
    }

    // Default Button
    if (defaultButtonHtml) {
      this.defaultButton.show()
      this.defaultButton.html(defaultButtonHtml)
    } else {
      this.defaultButton.hide()
    }

    // Alternate Button
    if (alternateButtonHtml) {
      this.alternateButton.show()
      this.alternateButton.html(alternateButtonHtml)
      this.spacer.show()
    } else {
      this.alternateButton.hide()
      this.spacer.hide()
    }

    // transition
    this.container.animateCss('zoomIn')
    this.dobs.removeClass('hidden')
  }

  // play it now
  public alertPlay(
    messageHtml: string | Donut,
    defaultButtonHtml: string,
    alternateButtonHtml?: string,
    scrimClearOnExit: boolean = true,
    scrimPlay: boolean = true,
    syncCallback?: ((choice: AlertResponse) => Promise<void>),
    positionFixed: boolean = false
  ): Promise<AlertResponse> {
    var promise = new Promise<AlertResponse>((resolve, reject) => {
      var job: Job = {
        alternateButtonHtml,
        defaultButtonHtml,
        messageHtml,
        reject,
        resolve,
        scrimClearOnExit,
        scrimPlay,
        syncCallback,
      }
      this.queue.push(job)
      this.alertOne()
    })

    return promise
  }

  // play if the interval has passed
  public alertPlayAsNag(
    id: string,
    intervalMs: number,
    messageHtml: string,
    defaultButtonHtml: string,
    alternateButtonHtml?: string,
    scrimClearOnExit?: boolean,
    scrimPlay: boolean = true,
    syncCallback?: (choice: AlertResponse) => Promise<void>
  ): Promise<AlertResponse> {
    if (!this.willPlayNag(id, intervalMs)) return Promise.resolve(AlertResponse.Skipped)
    this.app.stor.put(`nag::${id}`, Date.now())
    return this.alertPlay(
      messageHtml,
      defaultButtonHtml,
      alternateButtonHtml,
      scrimClearOnExit,
      scrimPlay,
      syncCallback,
    )
  }

  public altButtonPlay(e: Event) {
    this.evtStop(e)

    let job = this.job!
    try {
      if (job.syncCallback) job.syncCallback(AlertResponse.Alt)
    } catch (err) {
      this.app.sentry.captureException(err)
    }
    this.resolve(AlertResponse.Alt)
  }

  public defaultButtonPlay(e: Event) {
    this.evtStop(e)

    try {
      let job = this.job!
      if (job.syncCallback) job.syncCallback(AlertResponse.Default)
    } catch (err) {
      this.app.sentry.captureException(err)
    }
    this.resolve(AlertResponse.Default)
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`
<div class='fixed p-4 z-50 w-screen h-screen max-w-screen max-h-screen flex items-center justify-center'>
  <div class='container max-h-full bg-white dark:bg-black rounded-xl shadow'>
    <div class='markdown-body message w-full max-h-[75vh] overflow-y-auto overflow-x-auto px-3 my-3'></div>
    <div class='buttons w-full px-3 my-3'>
      <div class='alternate button tall w-full' tabindex='9101'>
        <div class='copy'>Alternate</div>
      </div>
      <div class='space w-full'>&nbsp;</div>
      <div class='default button tall w-full' tabindex='9100'>
        <div class='copy'>Default</div>
      </div>
    </div>
  </div>
</div>`

    super.init(template, {
      alternateButton: '.alternate.button',
      spacer: '.buttons .space',
      defaultButton: '.default.button',
      message: '.message',
      container: '.container'
    }, options)

    this.queue = []
    this.defaultButton.on('click touch', e => this.defaultButtonPlay(e))
    this.defaultButton.on('keydown', e => this.defaultButtonPlay(e))
    this.alternateButton.on('click touch', e => this.altButtonPlay(e))
    this.alternateButton.on('keydown', e => this.altButtonPlay(e))

    return this.dobs
  }

  public async resolve(choice: AlertResponse) {
    if (!this.playing) return
    this.container.animateCss('zoomOut')
    this.playing = false
    this.dobs.addClass('hidden')

    var job = this.job!
    if (job.scrimClearOnExit && this.queue.length == 0) this.app.scrimStop()
    this.alertOne()
    job.resolve(choice)
  }

  // returns if the nag will play
  public willPlayNag(id: string, intervalMs: number): boolean {
    var key = `nag::${id}`
    var lastPlayed = this.app.stor.get(key)
    var lastPlayed = lastPlayed || 0
    var now = Date.now()
    if (now - lastPlayed < intervalMs) return false
    return true
  }
}
