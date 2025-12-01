// import { AccountScreen } from './AccountScreen.js'
import { AddCSS, Loader } from './Loader.js'
import { App } from './Main.js'
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html, css } from './satori/Donut.js'

AddCSS("ScreenHead", css`
  .menu-text-shadow {
    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.3);
  }

  @keyframes vCollapseAnim {
    from {
      max-height: 100px;
      opacity: 1;
    }
    to {
      max-height: 0px;
      opacity: 0;
    }
  }

  @keyframes vExpandAnim {
    from {
      max-height: 0px;
      opacity: 0;
    }
    to {
      max-height: 100px;
      opacity: 1;
    }
  }

  .vCollapseAnim {
    animation: vCollapseAnim 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
  }

  .vExpandAnim {
    animation: vExpandAnim 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
  }`)

export class ScreenHead extends Donut {
  declare public a: {}
  declare public app: App

  accountButton!: Cash
  loginButton!: Cash
  signinButton!: Cash

  constructor() {
    super()
  }

  init(template: string, props: DonutProps, options: DonutOptions): Cash {
    var template = html`
<div class="menu w-full bg-blue-400 py-2 px-2 sm:py-4 sm:px-8 sm:rounded-b-2xl  ">
  <div class="w-full mt-auto mr-auto mb-auto ml-auto grid grid-cols-[auto_1fr_auto]">
    <!-- Brand vvv -->
    <img src="./assets/brand-5.png" class="brand cursor-pointer max-w-[50px]" />

    <!-- Main Menu vvv -->
    <div class="flex flex-col items-end">
      <div class="grid h-full grid-flow-col auto-cols-auto gap-x-3 text-gray-200 font-medium px-3" fontfamily="Raleway">
        <a href="#" class="menu-text-shadow h-full flex items-center justify-center cartButton">Cart</a>
        <a href="#" class="menu-text-shadow h-full flex items-center justify-center messengerButton">Messenger</a>
        <a href="#" class="menu-text-shadow max-sm:hidden h-full flex items-center justify-center blogButton">News</a>
        <a href="#" class="menu-text-shadow max-sm:hidden h-full flex items-center justify-center aboutButton">About</a>
        <div class="subMenuBarDob sm:hidden h-[50px] w-[50px] flex items-center justify-end"> <i
            class="fas fa-bars text-white"></i> </div>
      </div>
    </div>
    <!-- Main Menu ^^^ -->

    <!-- Account Buttons vvv -->
    <div class="items-center flex">
      <button fontfamily="Arial" type="submit"
        class="accountButton border-2 border-gray-200 flex w-full h-9 text-gray-200
                            bg-transparent items-center justify-center text-center rounded-lg text-lg font-normal px-3">
        Account</button>
      <button fontfamily="Arial" type="submit"
        class="signinButton border-2 border-gray-200 flex w-full h-9 text-gray-200
                            bg-transparent items-center justify-center text-center rounded-lg text-lg font-normal px-3">Sign&nbsp;in</button>
      <button fontfamily="Arial" type="submit" class="loginButton hover:bg-blue-900 hover:border-blue-900 border-2 flex
                            border-blue-700 w-full h-9 text-white bg-blue-700 items-center justify-center text-center rounded-lg
                            text-lg font-normal px-3">New&nbsp;Patient</button>
    </div>



    <!-- Sub Menu vvv -->
    <div></div>
    <div class="subMenu max-h-0 overflow-clip flex flex-col items-end">
      <div class="grid grid-cols-1 text-gray-200 font-medium px-3" style="grid-auto-rows: 40px;" fontfamily="Raleway">
        <a href="#" class="menu-text-shadow flex items-center justify-end blogButton">News</a>
        <a href="#" class="menu-text-shadow flex items-center justify-end aboutButton">About</a>
      </div>
    </div>
    <div></div>
    <!-- Sub Menu ^^^ -->
  </div>
</div>
`
    super.init(template, {
      aboutButton: '.aboutButton',
      accountButton: '.accountButton',
      blogButton: '.blogButton',
      brand: '.brand',
      messengerButton: '.messengerButton',
      loginButton: '.loginButton',
      cartButton: '.cartButton',
      signinButton: '.signinButton',
      subMenu: '.subMenu',
      subMenuBarDob: '.subMenuBarDob',
    }, options)


    // this.accountButton.on('click touch', e => this.goto(AccountScreen.URL({})))
    this.loginButton.on('click touch', e => this.app.auth.play()) // This one directly triggers login
    this.signinButton.on('click touch', e => this.app.auth.play()) // This one also directly triggers signin

    this.accountButton.on('click touch', e => this.app.router.playFwd(AccountScreen.URL({})))
    this.loginButton.on('click touch', e => this.app.auth.play())
    this.signinButton.on('click touch', e => this.app.auth.play())
    return this.dobs
  }

  render() {
    if (this.app.auth.profile != null) {
      this.accountButton.show()
      this.loginButton.hide()
      this.signinButton.hide()
    } else {
      this.accountButton.hide()
      this.loginButton.show()
      this.signinButton.show()
    }
  }

  // Method to handle forward navigation and ensure sub-navigation is closed
  goto(url: string) {
    this.subNavClose() // Close the sub-navigation
    this.app.router.playFwd(url) // Perform forward navigation
  }

  subMenuToggle() {
    if (this.subMenuVisible) {
      if (this.subMenuTimeout) {
        window.clearTimeout(this.subMenuTimeout)
        this.subMenuTimeout = undefined
      }
      this.subMenuVisible = false
      this.subMenu.removeClass("vExpandAnim")
      this.subMenu.addClass("vCollapseAnim")
    } else {
      this.subMenuTimeout = window.setTimeout(() => this.subMenuToggle(), 10000)
      this.subMenuVisible = true
      this.subMenu.removeClass("vCollapseAnim")
      this.subMenu.addClass("vExpandAnim")
    }
  }
}
