// import { AccountScreen } from './AccountScreen.js'
import { AddCSS, Loader } from './Loader.js'
import { App } from './Main.js'
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html, css } from './satori/Donut.js'

AddCSS("ScreenHead", css`
  .screenHead {
    position: relative;
    text-align: center;
    padding: 0.5rem;
    background-color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
  }

  .screenHead .site {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: rgba(6, 78, 59, 0.8);
    text-transform: uppercase;
    text-align: center;
  }

  .screenHead .subsite {
    margin-top: 0.25rem;
    font-size: 0.7rem;
    letter-spacing: 0.25em;
    color: rgba(6, 78, 59, 0.6);
    text-transform: uppercase;
    text-align: center;
  }

  .screenHead .accountButton {
    cursor: pointer;
  }
`)

export class ScreenHead extends Donut {
  declare public a: {}
  declare public app: App

  accountButton!: Cash

  constructor() {
    super()
  }

  init(template: string, props: DonutProps, options: DonutOptions): Cash {
    var template = html`
    <div class="screenHead">
      <!-- Corner decorations -->
      <!-- <div class="corner-tl"></div>
              <div class="corner-tr"></div>
              <div class="corner-bl"></div>
              <div class="corner-br"></div> -->

      <div style="display: flex; align-items: center; justify-content: center;">
        <div style="flex: 1; text-align: center;">
          <p class="site">FarmGoods Market</p>
          <p class="subsite">- Mocktail Series -</p>
        </div>

        <button type="submit" class="accountButton border-2 border-gray-200 flex w-9 h-9
                    bg-transparent items-center justify-center rounded-lg p-2" style="flex-shrink: 0;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-gray-200">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
      </div>
    </div>`
    super.init(template, {
      accountButton: '.accountButton',
    }, options)


    this.accountButton.on('click touch', e => this.app.auth!.play()) // This one directly triggers login
    this.dobs.on('click touch', e => this.app.router.playFwd("/"))
    return this.dobs
  }
}
