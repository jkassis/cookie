// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { App } from './App.js'
import { Handler, Reroute } from './Router.js'
import { Donut } from './Donut.js'

export class ScreenRoute implements Handler {
  public app: App
  public screen: Screen

  constructor(app: App, screen: Screen) { this.app = app; this.screen = screen }

  public playBwd(a: object): Promise<void> { return this.screen.playBwd(a) }

  public playBwdOK(a: object): Promise<Reroute | void> { return this.screen.playBwdOK(a) }

  public playFwd(a: object): Promise<void> { return this.screen.playFwd(a) }

  public playFwdOK(a: object): Promise<Reroute | void> { return this.screen.playFwdOK(a) }

  public render() { this.screen.render() }

  public resolve(a: object, url: string): string { return url }

  public stopBwd(): Promise<void> { return this.screen.stopBwd() }

  public stopBwdOK(): Promise<Reroute | void> { return this.screen.stopBwdOK() }

  public stopFwd(): Promise<void> { return this.screen.stopFwd() }

  public stopFwdOK(): Promise<Reroute | void> { return this.screen.stopFwdOK() }

  public titleGet(): string { return this.screen.titleGet() }
}


export abstract class Screen extends Donut {
  public play(a: any): Promise<void> { return Promise.resolve() }

  public playBwd(a: any): Promise<void> { return this.play(a) }

  public playBwdOK(a: any): Promise<Reroute | void> { return Promise.resolve() }

  public playFwd(a: any): Promise<void> { return this.play(a) }

  public playFwdOK(a: any): Promise<Reroute | void> { return Promise.resolve() }

  public stop(): Promise<void> { return Promise.resolve() }

  public stopBwd(): Promise<void> { return this.stop() }

  public stopBwdOK(): Promise<Reroute | void> { return Promise.resolve() }

  public stopFwd(): Promise<void> { return this.stop() }

  public stopFwdOK(): Promise<Reroute | void> { return Promise.resolve() }

  public titleGet(): string { return 'Change Me!' }
}
