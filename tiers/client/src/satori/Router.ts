// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { App } from './App.js'
import { Screen } from './Screen.js'
import { Eventful } from './Eventful.js'
import { StyleAdd, css } from './Style.js'

StyleAdd("Router", css`
/* for Firefox */
.killscrollbar {
      scrollbar-width: none;
}

/* for Chrome */
.killscrollbar::-webkit-scrollbar {
  display: none;
}
`)

export type MW = (url: string) => () => Promise<void>
export interface Route<T extends Handler> {
  handler: T
  mws: MW[]
  pseudoPattern: string
  regexp: RegExp
}

export interface Reroute {
  action: 'fwd' | 'bwd' | 'redirect' | 'abort'
  url?: string
}

export interface Handler {
  playBwd: (a: object) => Promise<void>
  playBwdOK: (a: object) => Promise<Reroute | void>
  playFwd: (a: object) => Promise<void>
  playFwdOK: (a: object) => Promise<Reroute | void>
  render: () => void
  resolve: (a: object, url: string) => string
  stopBwd: () => Promise<void>
  stopBwdOK: () => Promise<Reroute | void>
  stopFwd: () => Promise<void>
  stopFwdOK: () => Promise<Reroute | void>
  titleGet: () => string
}

export interface ScreenHandler extends Handler {
  screen: Screen
}

interface HistoryItem {
  state: Record<string, any>
  transition: 'bwd' | 'fwd' | 'jump'
  url: string
}

/*
 * TODO
 * - kill scrollbar during page transitions
 * - blank / empty chrome > home > other page > backwards... seems like we get an extra history item... have to press back button too much
 */
export class Router extends Eventful {
  public a: {
    onRender: () => Promise<void>
  }

  public app: App
  public depth: number
  public historyItemLast?: HistoryItem
  public historyItemQueue: HistoryItem[]
  public lastRoute?: Route<ScreenHandler>
  public pathname?: string
  public playCount: number
  public playedOnce: boolean = false
  public playing: boolean = false
  public routes: Route<Handler>[]
  public routePrefix?: string
  public scrollTop: number = 0
  public windowHeight?: number
  public windowWidth?: number

  constructor(app: App) {
    super()
    this.app = app
    this.depth = (history.state && history.state.depth) || 0
    this.historyItemQueue = []
    this.a = { onRender: async () => { } }
    this.playCount = 0
    this.routes = []

    var router = this
    history.scrollRestoration = 'manual'
    window.onpopstate = function (this: WindowEventHandlers, ev: PopStateEvent): void {
      router.app.blurAllPlay() // blur inputs
      window.errorScreenStop() // clear the error screen
      router.queueNext()
    }
  }

  public static aToURLParams(a: Record<string, any>): string {
    for (var k in a) if (a[k] === undefined) delete a[k]
    if (Object.keys(a).length == 0) return ''
    var urlSearchParams = new URLSearchParams(a as URLSearchParams)
    urlSearchParams.sort()
    return urlSearchParams.toString()
  }

  public jumpPlay(url: string, replaceState: boolean = false): void {
    return this.playFwd(url, replaceState, 'jump')
  }

  public playAnimation(donut: Screen, type: string) {
    if (!donut) return

    donut.dobs.stop(true, true)

    var duration = 300

    if (type == 'righttocenter') {
      donut.dobs.css({
        position: 'relative',
        top: 0,
        left: this.windowWidth!,
        display: 'block'
      })
      donut.dobs
        .stop(true, true)
        .animate({ left: 0 }, { left: 'linear' }, duration)
        .then(() => donut.dobs.css('position', ''))
    } else if (type == 'lefttocenter') {
      donut.dobs.css({
        position: 'relative',
        top: 0,
        left: -this.windowWidth!,
        display: 'block'
      })
      donut.dobs
        .stop(true, true)
        .animate({ left: 0 }, { left: 'linear' }, duration)
        .then(() => donut.dobs.css('position', ''))
    } else if (type == 'toptocenter') {
      donut.dobs.css({
        position: 'relative',
        top: -this.windowHeight!,
        left: 0,
        display: 'block'
      })
      donut.dobs
        .stop(true, true)
        .animate({ top: 0 }, { top: 'linear' }, duration)
        .then(() => donut.dobs.css('position', ''))
    } else if (type == 'bottomtocenter') {
      donut.dobs.css({
        position: 'relative',
        top: this.windowHeight!,
        left: 0,
        display: 'block'
      })
      donut.dobs
        .stop(true, true)
        .animate({ top: 0 }, { top: 'linear' }, duration)
        .then(() => donut.dobs.css('position', ''))
    } else if (type == 'centertoleft') {
      donut.dobs.css('position', 'absolute')
      donut.dobs
        .stop(true, true)
        .animate(
          { left: -this.windowWidth! },
          { left: 'linear' },
          duration)
        .then(() => { donut.dobs.hide(); donut.css('position', '') })
    } else if (type == 'centertoright') {
      donut.dobs.css('position', 'absolute')
      donut.dobs
        .stop(true, true)
        .animate(
          { left: this.windowWidth },
          { left: 'linear' },
          duration
        )
        .then(() => { donut.dobs.hide(); donut.css('position', '') })
    } else if (type == 'centertotop') {
      donut.dobs
        .stop(true, true)
        .animate(
          { top: -this.windowHeight! },
          { top: 'linear' },
          duration,
        ).then(() => { donut.dobs.hide(); donut.css('position', '') })
    } else if (type == 'centertobottom') {
      donut.dobs
        .stop(true, true)
        .animate(
          { top: this.windowHeight },
          { top: 'linear' },
          duration)
        .then(() => { donut.dobs.hide(); donut.css('position', '') })
    } else if (type == 'fadein') {
      donut.dobs.css({
        position: 'absolute',
        top: 0,
        left: 0,
        display: 'block',
        opacity: 0
      })
      donut.dobs
        .stop(true, true)
        .animate(
          { opacity: 1 },
          { opacity: 'linear' },
          duration)
        .then(() => { donut.dobs.css('opacity', ''); donut.css('position', '') })
    } else if (type == 'fadeout') {
      donut.dobs.css({
        position: 'absolute',
        top: 0,
        left: 0,
        display: 'block',
        opacity: 1
      })
      donut.dobs
        .stop(true, true)
        .animate(
          { opacity: 0 },
          { opacity: 'linear' },
          duration)
        .then(() => {
          donut.dobs.hide()
          donut.dobs.css('opacity', '')
          donut.css('position', '')
        })
    }
  }

  public playBwd(): void {
    // history.back *does* trigger window.onpopstate, so we skip the manual this.queueNext()
    history.back()
  }

  // playFwd
  public playFwd(url: string, replaceState: boolean = false, transition: 'jump' | 'fwd' | 'bwd' = 'fwd', depthNext: number | null = null): void {
    var [pathname, params] = this.urlParse(url)
    var nextRoute = this.routeGet(pathname)
    var nextUrl = nextRoute.handler.resolve(params, url)

    if (this.playedOnce && history.state && history.state.url == nextUrl) { return }
    this.playedOnce = true
    var depth = this.depth
    if (replaceState) history.replaceState({ depth: depthNext || depth, fwdTransition: transition, url }, '', url)
    else history.pushState({ depth: depthNext || (depth + 1), fwdTransition: transition, url }, '', url)

    // history.pushState and history.replaceState does not trigger window.onpopstate, so we call queueNext ourselves
    this.queueNext()
  }

  public async playNext(): Promise<void> {
    if (this.historyItemQueue.length == 0) return
    if (this.playing) return // just return, we'll playNext at the end

    // capture next
    var next = this.historyItemQueue.shift()
    if (!next) return

    this.playing = true
    this.playCount++

    if (next.state == null) next.state = { depth: 0 }

    // it's entirely possible to transition to the same page... eg. after an abort
    // don't do anything in this case
    if (this.historyItemLast && this.historyItemLast.url == next.url) {
      this.playing = false
      return
    }

    // get number of steps fwd or bwd
    var steps: number = (next.state['depth'] - this.depth)

    // get next route
    var [pathname, nextParams] = this.urlParse(next.url)
    var nextRoute = this.routeGet(pathname) as Route<ScreenHandler> // TODO this isn't strictly true or safe (consider RedirectHandler>

    try {
      var throwReroute = (reroute: Reroute | void) => { if (reroute) throw reroute }

      // first run middleware
      for (var mw of nextRoute.mws) await mw(next.url)()

      // check that the last route is ok to stop
      if (this.lastRoute)
        if (steps >= 0) await this.lastRoute.handler.stopFwdOK().then(throwReroute)
        else await this.lastRoute.handler.stopBwdOK().then(throwReroute)

      // check that the next route is ok to play
      if (steps >= 0) await nextRoute.handler.playFwdOK(nextParams).then(throwReroute)
      else await nextRoute.handler.playBwdOK(nextParams).then(throwReroute)

      // transition the state
      // but save it in case we need to transition
      if (this.lastRoute) {
        if (steps >= 0) await this.lastRoute.handler.stopFwd()
        else await this.lastRoute.handler.stopBwd()
      }
      // For lastRoute to be recoverable... it must also be playable
      // after it throws the error. Exceptions thrown here are bugs,
      // so this should never happen, but if it does... we want the
      // user to be able to recover.
      //
      // ie. on exception... we won't get here. if the lastRoute.handler
      // is also stuck in playing == true, we won't be able to play it
      // again and that blocks the user from entering that route again
      // so all routes need to wrap their play handlers in finally where
      // they set `playing == false`
      var lastRoute = this.lastRoute
      this.lastRoute = undefined

      // transition the router state
      this.depth = next.state['depth']
      this.historyItemLast = next
      this.pathname = pathname

      // actuate the route
      if (steps >= 0) await nextRoute.handler.playFwd(nextParams)
      else await nextRoute.handler.playBwd(nextParams)

      // and next becomes last
      // history.replaceState(next.state, nextRoute.handler.titleGet(), next.url)
      document.title = nextRoute.handler.titleGet()
      nextRoute.handler.render()
      await this.playTransition(next.transition, nextRoute, lastRoute)
      this.lastRoute = nextRoute
      this.playing = false

      // if we have a next in the queue... do it.
      if (this.historyItemQueue.length > 0) {
        return this.playNext() // should this be await?
      } else {
        this.a.onRender()
      }
    } catch (err: any) {
      this.playing = false
      if (err.action == 'fwd') {
        // transition the router state
        this.depth = next.state['depth']
        this.historyItemLast = next
        this.pathname = pathname
        return this.playFwd(err.url, false, next.transition)
      } if (err.action == 'redirect') {
        return this.playFwd(err.url, true, next.transition, next.state['depth'])
      } else if (err.action == 'bwd') {
        // go to root if we are already at the top
        if (next.state['depth'] == 0) return this.playFwd('/', true, next.transition)
        else return this.playBwd()
      } else if (err.action == 'abort') {
        // reset the browser history
        history.go(-steps)
        return
        // return await this.playNext()
      }
      throw err
    }
    finally {
      // for this to be recoverable...
      // fiddling with this... seems that I added it for the router to be "recoverable"...
      // i assume that means I wanted it to recover after and error and an error dialog?!?
      // problem is that the state is wrong during a root redirect, which calls queueNext and
      // sets this.playing *before* hitting this line. commenting out for now to see what happens...
      // this.playing = false
    }
  }

  public playTransition(direction: 'jump' | 'fwd' | 'bwd', nextRoute: Route<ScreenHandler>, lastRoute?: Route<ScreenHandler>): Promise<void> {
    // play not transition if lastRoute == nextRoute. this certainly isn't ideal, but this transition
    // expects two separate dobs to animate... one going in and another going out...
    // we can't easily do that when we have only one dob
    if (lastRoute == nextRoute) { return Promise.resolve() }

    return new Promise(
      (resolve, reject) => {
        if (lastRoute && lastRoute.handler && lastRoute.handler == nextRoute.handler) resolve()

        this.windowWidth = window.innerWidth
        this.windowHeight = window.innerHeight
        this.scrollTop = this.app.scrollingElement.scrollTop()

        var duration = 300

        // calc transitions
        if (direction == 'jump') {
          this.app.scrollingElement
            .stop(true, true)
            .animate(
              { scrollTop: 0 },
              { scrollTop: 'linear' },
            )
          if (lastRoute && lastRoute.handler) {
            this.playAnimation(lastRoute.handler.screen, 'fadeout')
          }

          this.playAnimation(nextRoute.handler.screen, 'fadein')
        } else if (direction == 'fwd') {
          this.app.scrollingElement.addClass('killscrollbar')

          // do we have lastDonut?
          let lastDonut = (lastRoute && lastRoute.handler) ? lastRoute.handler.screen : undefined
          if (lastDonut) {
            // yes. it will animate up from view and off the top
            lastDonut.scrollTop = this.scrollTop
            lastDonut.dobs.css({
              'z-index': 1,
              display: 'block',
              height: this.scrollTop + this.windowHeight,
              overflow: 'hidden',
              position: 'absolute',
              top: 0,
            })
          }

          // the nextDonut will animate up from the bottom and into view
          let nextDonut = nextRoute.handler.screen
          nextDonut.scrollTop = nextDonut.scrollTop || 0 // make sure scrollTop is set
          nextDonut.dobs.css({
            'z-index': 0,
            display: 'block',
            position: 'absolute',
            top: this.scrollTop + this.windowHeight - nextDonut.scrollTop,
          })

          // now scroll to next
          this.app.scrollingElement
            .stop(true, true)
            .animate(
              { scrollTop: this.scrollTop + this.windowHeight },
              { scrollTop: 'easeInOutSine' },
              duration,
            )
            .then(() => {
              // now clear the mods to the lastDonut and hide it.
              if (lastDonut) {
                lastDonut.dobs.css({
                  'z-index': '',
                  display: 'none',
                  height: '',
                  overflow: '',
                  top: 0,
                })
              }

              // nextDonut now pinned to top
              nextDonut.dobs.css({
                'z-index': '',
                display: '',
                top: 0,
              })

              // adjust scroll top
              this.scrollTop = nextDonut.scrollTop
              this.app.scrollingElement.scrollTop(nextDonut.scrollTop)
              this.app.scrollingElement.removeClass('killscrollbar')
              resolve()
            })
        } else if (direction == 'bwd') {
          this.app.scrollingElement.addClass('killscrollbar')

          // get nextDonut
          let nextDonut = nextRoute.handler.screen
          nextDonut.scrollTop = nextDonut.scrollTop || 0 // make sure scrollTop is set

          // do we have lastDonut?
          let lastDonut = (lastRoute && lastRoute.handler) ? lastRoute.handler.screen : undefined
          if (lastDonut) {
            // yes. it will animate down from view and off the bottom
            lastDonut.scrollTop = this.scrollTop
            lastDonut.dobs.css({
              'z-index': 0,
              display: 'block',
              top: nextDonut.scrollTop + this.windowHeight - lastDonut.scrollTop
            })
            this.app.scrollingElement.scrollTop(nextDonut.scrollTop + this.windowHeight)
          }

          // the nextDonut will animate up from above and into view
          nextDonut.dobs.css({
            'z-index': 1,
            display: 'block',
            height: nextDonut.scrollTop + this.windowHeight,
            overflow: 'hidden',
            top: 0,
          })

          // todo... this should be an animation that runs through a
          // a range of values and just calls the tick function
          this.app.scrollingElement
            .stop(true, true)
            .animate(
              { scrollTop: nextDonut.scrollTop },
              { scrollTop: 'easeInOutSine' },
              duration,
              // function (val: number) {
              //   lastDonut && lastDonut.dobs.css('transform', `translateY(${val}px)`)
              //   nextDonut.dobs.css('transform', `translateY(${val}px)`)
              // },
            )
            .then(() => {
              // now clear the mods to the lastDonut and hide it.
              if (lastDonut)
                lastDonut.dobs.css({
                  'z-index': '',
                  display: 'none',
                  top: 0,
                  // transform: ''
                })

              // nextDonut now pinned to top
              nextDonut.dobs.css({
                'z-index': '',
                display: '',
                height: '',
                overflow: '',
                top: 0,
                // transform: ''
              })

              // adjust scroll top
              // this.scrollTop = nextDonut.scrollTop
              // this.app.scrollingElement.scrollTop(nextDonut.scrollTop)
              this.app.scrollingElement.removeClass('killscrollbar')
              resolve()
            })
        }
      })
  }

  // onpopstate
  // This is called when the user presses the browser
  // fwd or bak buttons. We have to code around the case where the
  // user is mashing these buttons. To do that, we always save
  // what we think is he next destination with the best info
  // we have available to determine how to visually transition.
  public queueNext(): void {
    var transition: 'fwd' | 'bwd' | 'jump' =
      (this.depth && history.state != null && this.depth > history.state['depth']) ? 'bwd' : 'fwd'

    // save the next
    var state = JSON.parse(JSON.stringify(history.state))
    var historyItem: HistoryItem = {
      url: window.location.pathname + window.location.search,
      state,
      transition
    }
    this.historyItemQueue.push(historyItem)

    // start the playback... this will guarantee that this.next gets cleared
    this.playNext()
    return
  }

  public reRender() {
    this.lastRoute?.handler.render()
  }

  public routeAdd(pseudoPattern: string, mws: MW[], handler: Handler) {
    if (handler === undefined) throw new Error('undefined handler for route $(pseudoPattern)')
    var regexp = new RegExp(`^${pseudoPattern}$`)
    this.routes.push({ pseudoPattern, regexp, mws, handler: handler })
  }

  /**
    Lifecycle of a Route Transition
    -------------------------------
    Pages can implement entry checks to determine if it is ok to enter the page (eg. check that the shopping cart as content).
    They can also implement exit checks to determine if it is ok to leave the page (eg. check that an object is saved).
    The router must perform these entry and exit checks before modifying its internal state, to allow the routes
    to abort the transition without corrupting things.

    But in a single-page app, we might be trying to transition from one page to the "same" page.
    If that page has an admission / entry "gate" or "check", we need to check those without disturbing the current
    state of the page. Furthermore, if that page does work to complete the entry check (eg. hydrate) that we are
    able to leverage that work if we actually transition to the page. We don't want to do it twice.

    The router will not make any assumptions or enforce design patterns on the internal structure of check methods.
    If a component needs to cache the work it does to perform a check, it must do that internally.

    Furthermore, page exits should not depend on which page will get actuated next, so exit checks are allowed to use
    only their existing state to perform the check.

    Finally... once the checks pass, the routes are obligated to stop and play without exception. While we do our
    best to recover the router state when exeptions happen here, we cannot guarantee that the user can dismiss
    an error and continue using the application normally without reload. There for production error handlers
    should probably force a reload when errors happen at this point.
   */
  public routeGet(pathname: string): Route<Handler> {
    if (this.routePrefix && pathname.startsWith(this.routePrefix))
      pathname = pathname.slice(this.routePrefix.length)

    var matchingRoutes: Route<Handler>[] = []
    for (var route of this.routes) if (pathname.match(route.regexp)) matchingRoutes.push(route)
    if (matchingRoutes.length == 0) throw new Error(`no matching route for ${pathname}`)
    else if (matchingRoutes.length > 1) throw new Error(`multiple matching routes for ${pathname}`)
    var nextRoute = matchingRoutes[0]
    return nextRoute
  }

  public urlParamGet(url: string, name: string): string | undefined {
    if (url == undefined) return undefined
    var indexOfQ = url.indexOf('?')
    if (indexOfQ == -1) return undefined
    var encodedParams = url.substring(indexOfQ + 1)
    if (encodedParams == '') return undefined
    var v = new URLSearchParams(encodedParams).get(name)
    if (v == 'null') return undefined
    if (v === null) return undefined
    if (v == 'undefined') return undefined
    return v
  }

  public urlParamSet(k: string, v: string): void {
    var historyItemLast = window.app.router.historyItemLast
    var root = historyItemLast.url
    var indexOfQ = historyItemLast.url.indexOf('?')
    var paramString = (indexOfQ == -1) ? '' : historyItemLast.url.substring(indexOfQ + 1)
    var root = (indexOfQ == -1) ? historyItemLast.url : historyItemLast.url.substring(0, indexOfQ)

    var urlSearchParams = new URLSearchParams(paramString)
    urlSearchParams.set(k, v)

    historyItemLast.url = root + '?' + urlSearchParams.toString()
    history.replaceState(historyItemLast.state, this.lastRoute?.handler.titleGet() || '', historyItemLast.url)
  }

  public urlParse(url: string): [path: string, a: Record<string, any>] {
    var pos = url.indexOf('?')
    var path = (pos == -1) ? url : url.substring(0, pos)
    if (path.startsWith('/')) path = path.substring(1)

    // get new params
    var a: Record<string, any> = {}
    var indexOfQ = url.indexOf('?')
    if (indexOfQ > -1) {
      var encodedParams = url.substring(indexOfQ + 1)
      if (encodedParams != '') {
        var searchParams = new URLSearchParams(encodedParams)
        searchParams.forEach((v, k) => {
          if (v == 'false') a[k] = false
          else if (v == 'true') a[k] = true
          else if (v == 'null') a[k] = null
          else if (v == 'undefined') a[k] = undefined
          else a[k] = v
        })
      }
    }
    return [path, a]
  }
}

export abstract class RedirectRoute implements Handler {
  public conf: Record<string, any>
  public router: Router

  constructor(router: Router, conf: Record<string, any>) {
    this.router = router
    this.conf = conf
  }

  public async playBwd(a: object): Promise<void> { }

  public async playBwdOK(a: object): Promise<Reroute> {
    return {
      action: 'redirect',
      url: this.resolve(a, undefined)
    }
  }

  public async playFwd(a: object): Promise<void> { }

  public async playFwdOK(a: object): Promise<Reroute> {
    return {
      action: 'redirect',
      url: this.resolve(a, undefined)
    }
  }

  public render() { }

  // resolve returns a url
  public abstract resolve(a: object, url?: string): string

  public async stop(): Promise<void> { }

  public async stopBwd(): Promise<void> {
    throw { code: 'undefined' }
  }

  public async stopBwdOK(): Promise<Reroute | undefined> { return }

  public async stopFwd(): Promise<void> {
    throw { code: 'undefined' }
  }

  public async stopFwdOK(): Promise<Reroute | undefined> { return }

  public abstract titleGet(): string
}
