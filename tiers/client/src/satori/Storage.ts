// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
export class CookieStorage implements Storage {
  public cache: { [k: string]: any }

  public length: number = 0

  constructor() {
    // init the cache
    this.cache = {}
    var cs = document.cookie.split(';')
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i]

      // trim leading whitespace
      while (c.charAt(0) == ' ') c = c.substring(1, c.length)

      // get key
      var eqIdx = c.indexOf('=')
      var key = c.substring(0, eqIdx)

      // get value
      var value = decodeURIComponent(c.substring(eqIdx + 1, c.length))

      // set the cache
      this.cache[key] = value
    }
  }

  public clear(): void {
    this.cache = {}
    this.save()
  }

  public getItem(key: string): string | null {
    return this.cache[key]
  }

  public key(index: number): string | null {
    return this.keys()[index]
  }

  public keys() {
    return Object.keys(this.cache)
  }

  public removeItem(key: string): void {
    delete this.cache[key]
    this.save()
  }

  public save() {
    var parts: string[] = []
    for (var key in this.cache)
      parts.push(`${key}=${encodeURIComponent(this.cache[key])}`)
    document.cookie = parts.join(';') + '; expires=; path=/'
  }

  // setItem returns true if key is changed
  public setItem(key: string, value: string): void {
    this.cache[key] = value
    this.save()
  }
}

export class AppStorage {
  public ls: Storage
  public prefix: string
  public space: string
  public usingLocalStorage: boolean = false

  constructor(space: string = 'default') {
    this.space = space

    // try localstorage
    try {
      var x = 'asdf' + Date.now()
      localStorage.setItem(x, x)
      var y = localStorage.getItem(x)
      localStorage.removeItem(x)
      if (x !== y) {
        throw new Error()
      }
      this.ls = localStorage
      this.usingLocalStorage = true
    } catch (exception) {
      // make up a polyfill
      console.log(exception)
      this.ls = new CookieStorage()
    }

    this.prefix = 'fg'

    return this
  }

  /**
   * @memberOf Client
   */
  public clear() {
    var keys = this.usingLocalStorage ? Object.keys(this.ls) : this.ls.keys()
    var prefix = `${this.prefix}::${this.space}`
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      if (key.indexOf(prefix) == 0) this.ls.removeItem(key)
    }
  }

  /**
   * @memberOf Client
   */
  public get(key: string): any {
    key = `${this.space}__${key}`
    var value = this.ls.getItem(`${this.prefix}::${key}`)
    if (value == 'undefined' || value == 'null' || value === undefined || value === null)
      return undefined
    else {
      return JSON.parse(value)
    }
  }

  /**
   * @memberOf Client
   * returns true if changed
   */
  public put(key: string, value: any): boolean {
    let current = this.get(key)
    if (current == value) return false

    let spaceKey = `${this.space}__${key}`
    var sval = JSON.stringify(value)
    this.ls.setItem(`${this.prefix}::${spaceKey}`, sval)
    return true
  }


  /**
   * @memberOf Client
   * returns true if changed
   */
  public remove(key: string): void {
    let spaceKey = `${this.space}__${key}`
    this.ls.removeItem(`${this.prefix}::${spaceKey}`)
  }
}
