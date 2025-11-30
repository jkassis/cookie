// Generate a unique client identifier
export { Loader, LoadingBar } from './Loader.js'
import { Loader } from './Loader.js'
export function makeApp(sentry: typeof Sentry, loader: Loader): App {
  var app: App = new App()
  app.conf = env
  // app.api = new API()
  app.sentry = sentry
  app.loader = loader
  app.donutFactory = new DonutFactory({ app: app, conf: env, api: app.api, loader })
  return app
}

import './ErrorHandler.js'
import { CreationE2EScreen } from './CreationE2EScreen.js'
import { CreationsScreen } from './CreationsScreen.js'
import { AlertPopup } from './satori/AlertPopup.js'
import { App as Base } from './satori/App.js'
import { Cash } from 'cash-dom'
import { DonutFactory } from './satori/DonutFactory.js'
import { DonutProps, DonutOptions, html } from './satori/Donut.js'
import { RedirectRoute } from './satori/Router.js'
import { ScreenRoute } from './satori/Screen.js'
import { AddCSS } from './satori/Loader.js'

AddCSS("Main", `
  .screen {
    width: 100%;
  }
`)



class RootRedirectRoute extends RedirectRoute {
  public resolve(a: object, url: string): string {
    return CreationsScreen.URL({})
  }

  public titleGet(): string {
    return "Mocktails"
  }
}

export class App extends Base {
  // --- Properties ---
  public clientId: string = ''
  public creationE2EScreen!: CreationE2EScreen
  public creationsScreen!: CreationsScreen

  // --- Lifecycle ---
  constructor() {
    super()
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`
<div class='app w-screen h-min-screen'>
  <!-- don't sort these -->
  <input class='blurAllInput h-0 w-0 opacity-0' tabindex='-1'></input>
  <div class='alertPopup hidden'></div>
  <div class='blockedBanner hidden'>Thinking...</div>
  <div class='scrimDob fixed hidden stacking top-0 left-0 z-30 w-screen h-screen bg-white dark:bg-black'></div>

  <!-- do sort these -->
  <div style='display: none' class='creationE2EScreen screen'></div>
  <div style='display: none' class='creationsScreen screen'></div>
</div>`

    super.init(template, {
      alertPopup: ['.alertPopup', AlertPopup],
      blurAllInput: '.blurAllInput',
      scrimDob: '.scrimDob',

      creationE2EScreen: ['.creationE2EScreen', CreationE2EScreen],
      creationsScreen: ['.creationsScreen', CreationsScreen],
    }, options)


    this.clientId = crypto.randomUUID()
    this.router.routeAdd('', [], new RootRedirectRoute(this.router, this.conf))
    this.router.routeAdd('creation-e2e', [], new ScreenRoute(this, this.creationE2EScreen))
    this.router.routeAdd('creations', [], new ScreenRoute(this, this.creationsScreen))

    return this.dobs
  }

  play() {
    this.router.playFwd('')
  }
}
