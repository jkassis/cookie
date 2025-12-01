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
import { dao } from './DAO.js'
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
import { Auth } from './satori/Auth.js'
import { User } from './Schema.js'

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
  public user?: User
  public auth?: Auth

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

  async play() {
    // Auth
    var clientID = "zjbEhoSNgyjDqU2WQLyn7r68CYVlaiS4"
    var domainID = "dev-fb3206n2zfz32rjn.us.auth0.com"
    this.auth = new Auth(clientID, domainID, () => this.onAuth())
    this.auth.accessToken = this.stor.get('accessToken')
    this.auth.profile = this.stor.get('profile')
    if (true || this.conf.mode == 'dev') {
      this.auth.accessToken = 'asdf'
      this.auth.profile = {
        name: 'Jeremy Kassis',
        nickname: "Jer",
        picture: "",
        user_id: "ñhFKMbÛ4s",
        username: "jkassis",
        given_name: "Jeremy",
        family_name: "Kassis",
        email: "jkassis@gmail.com",
        email_verified: false,
        clientID: "asdffdsa",
        gender: "m",
        locale: 'dk',
        identities: [],
        created_at: new Date().toUTCString(),
        updated_at: new Date().toUTCString(),
        sub: "",
        user_metadata: "",
        app_metadata: "",
      }
    }
    if (this.auth.accessToken) {
      await this.onAuth()
    }

    await this.router.playFwd("")
  }

  async onAuth() {
    this.stor.put('accessToken', this.auth!.accessToken)
    this.stor.put('profile', this.auth!.profile)
    await this.userGet()
    this.render()
  }

  async userGet() {
    var p = this.auth!.profile!
    var res = await dao.UserGetOrCreate({
      userID: this.auth!.profile!.user_id,
      createParams: {
        userID: this.auth!.profile!.user_id,
        email: p.email,
        nameFamily: p.family_name,
        nameGiven: p.given_name,
        gender: p.gender,
        createdAt: p.created_at,
        lastLogin: p.updated_at,
        role: "user",
      }
    })
    this.user = res
  }
}
