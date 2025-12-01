import { AlertPopup, AlertResponse } from './AlertPopup.js'
import { AppStorage } from './Storage.js'
import { Cash, Element } from 'cash-dom'
import cash from 'cash-dom'
import { Donut, DonutOptions, DonutProps } from './Donut.js'
import { Router } from './Router.js'
import './CashExt'


export class App extends Donut {
  public alertPopup!: AlertPopup
  public blurAllInput!: Cash
  public conf!: { [k: string]: any }
  public stor: AppStorage
  public router: Router
  public scrimDob!: Cash
  public scrollingElement: Cash
  public sentry: typeof Sentry

  constructor() {
    super()
    this.router = new Router(this)
    this.stor = new AppStorage("main")
    this.scrollingElement = cash(document.scrollingElement || document.documentElement)

  }

  init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    this.donutFactory.init()
    super.init(template, props, options)
    return this.dobs
  }


  alert(
    messageHtml: string | Donut,
    defaultButtonHtml: string,
    alternateButtonHtml?: string,
    scrimClearOnExit: boolean = true,
    scrimPlay: boolean = true,
    syncCallback: (choice: string) => Promise<void> = async () => { },
    positionFixed: boolean = false) {
    return this.alertPopup.alertPlay(
      messageHtml,
      defaultButtonHtml,
      alternateButtonHtml,
      scrimClearOnExit,
      scrimPlay,
      syncCallback,
      positionFixed
    )
  }


  blurAllPlay(scrollTop?: number) {
    scrollTop = scrollTop || this.scrollingElement.scrollTop()
    this.blurAllInput.css('top', (scrollTop + 20) + "px")
    window.setTimeout(() => {
      this.blurAllInput.focus()
    }, 10)
  }

  scrimPlay() {
    // When the modal is shown, we want a fixed body
    var y = window.scrollY
    document.documentElement.style.top = `-${y}px`
    document.documentElement.style.position = 'fixed'
    // not sure when we needed this. doesn't seem needed now, but keeping in case...
    // document.documentElement.style.backgroundPositionY = `-${y}px`

    this.scrimDob.stop(true, true)
    this.scrimDob.css('display', 'block')
    this.scrimDob.animate({ opacity: 0.90 }, { opacity: 'easeInSine' })
  }

  scrimStop() {
    // When the modal is hidden...
    const scrollY = document.documentElement.style.top
    document.documentElement.style.position = ''
    document.documentElement.style.backgroundPositionY = ''
    document.documentElement.style.top = ''
    window.scrollTo(0, parseInt(scrollY || '0') * -1)

    this.scrimDob.stop(true, true)
    this.scrimDob.animate(
      { opacity: 0 },
      { opacity: 'easeInSine' },
      400,
      () => { this.scrimDob.hide() })
  }

  scrollToTop() {
    this.scrollingElement
      .stop(true, true)
      .animate(
        { scrollTop: 0 },
        { scrollTop: 'linear' }
      )
  }
}
