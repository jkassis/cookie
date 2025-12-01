import type { LogFn } from './Logger.js'

export interface LoaderLogger {
  debug: LogFn
  error: LogFn
  info: LogFn
  trace: LogFn
  warn: LogFn
}

export declare interface InspectablePromise<T> extends Promise<T> {
  isFulfilled: () => boolean
  isPending: () => boolean
  isRejected: () => boolean
}

export var InspectablePromiseMake = function <T>(promise: Promise<T>): InspectablePromise<T> {
  // Set initial state
  var isPending = true
  var isRejected = false
  var isFulfilled = false

  // Observe the promise, saving the fulfillment in a closure scope.
  var result: InspectablePromise<T> = promise.then(
    function (v) {
      isFulfilled = true
      isPending = false
      return v
    },
    function (e) {
      isRejected = true
      isPending = false
      throw e
    }
  ) as InspectablePromise<T>

  result.isFulfilled = function (): boolean {
    return isFulfilled
  }
  result.isPending = function (): boolean {
    return isPending
  }
  result.isRejected = function (): boolean {
    return isRejected
  }
  return result
}

export function AddCSS(name: string, styles: string): void {
  // Check if a style element with the given name already exists
  let styleElement = document.getElementById(name) as HTMLStyleElement

  if (!styleElement) {
    // Create a new style element
    styleElement = document.createElement('style')
    styleElement.id = name
    document.head.appendChild(styleElement)
  }

  // Set the inner content of the style element to the provided styles
  styleElement.innerHTML = styles
}

export function AddLess(name: string, lessStyles: string): void {
  // Check if a style element with the given name already exists
  let styleElement = document.getElementById(name) as HTMLStyleElement

  if (!styleElement) {
    // Create a new style element
    styleElement = document.createElement('style')
    styleElement.id = name
    document.head.appendChild(styleElement)
  }

  // Compile the LESS code to CSS
  less.render(lessStyles)
    .then((output: any) => {
      // Set the compiled CSS to the style element
      styleElement.innerHTML = output.css
    })
    .catch((error: any) => {
      console.error('Failed to compile LESS:', error)
    })
}

export abstract class Loader {
  public assetPromiseResolves: { [k: string]: any }

  public assetPromises: { [k: string]: InspectablePromise<any> }

  public conf!: { [k: string]: any }

  public filePromises: { [k: string]: InspectablePromise<any> }

  public logger: LoaderLogger
  public multiFileDelimiter: string
  public stylesheets: HTMLStyleElement[]

  constructor(logger: LoaderLogger) {
    this.assetPromises = {}
    this.assetPromiseResolves = {}
    this.filePromises = {}
    this.logger = logger
    this.multiFileDelimiter = encodeURIComponent('\n#########BREAK#########')
    this.stylesheets = []
  }

  public assetKeyToUrl(key: string): string {
    var segments = key.split(':')
    var assetType = segments[0]
    var assetId = segments[1]

    throw new Error('method not implemented')
  }

  public pendingPromisesGet() {
    var pending: string[] = []
    var unknown: string[] = []
    for (var assetKey in this.assetPromises) {
      var promise = this.assetPromises[assetKey]
      if (promise.isPending) {
        if (promise.isPending()) {
          pending.push(assetKey)
        }
      } else unknown.push(assetKey)
    }

    return { pending, unknown }
  }

  public async require(
    keys: (string | Promise<any>)[],
    goalCallback?: (bytes: number) => void,
    progressCallback?: (bytes: number) => void
  ): Promise<any[]> {
    var assets: any[] = []

    if (keys == undefined || keys == null) return []
    if (!Array.isArray(keys)) keys = [keys]
    if (keys.length == 0) return []

    var promises: Promise<any>[] = []
    for (let i = 0; i < keys.length; i++) {
      var key = keys[i]
      if (key instanceof Promise)
        promises.push(key)
      else
        promises.push(
          this.promiseAsset(key, goalCallback, progressCallback).then((asset: any) => {
            assets[i] = asset
          })
        )
    }

    await Promise.all(promises)
      .catch(err => {
        console.log(`failed to require ${keys}`)
        console.log(err)
      })

    return assets
  }

  public transformAssetKey(key: string): string {
    return key
  }

  public abstract promiseAsset(
    key: string,
    goalCallback?: (bytes: number) => void,
    progressCallback?: (bytes: number) => void
  ): any
}
