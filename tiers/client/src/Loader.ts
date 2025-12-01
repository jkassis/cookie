import {
  Loader as CoreLoader,
  AddLess,
  AddCSS,
  InspectablePromiseMake
} from './satori/Loader.js'
export { AddCSS, AddLess } from './satori/Loader.js'

// see https://github.com/axios/axios
const requestConfigDefault: RequestConfig = {
  'headers': { 'Content-Type': 'application/json' },
  'responseType': 'text',
}

var responseTransform = function <T>(
  type: string,
  goalCallback?: (bytes: number) => void,
  progressCallback?: (bytes: number) => void
): (Response: Response) => Promise<T> {
  return async (response: Response): Promise<T> => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
    } else if (response.body === null) {
      throw new Error('Response body is null. This may be due to a CORS issue or the server not returning a body.')
    }

    // Step 1: obtain a reader
    const reader = response.body.getReader()

    // Step 2: get total length
    const contentLengthStr = response.headers.get('Content-Length')!
    var contentLength = parseInt(contentLengthStr)
    if (isNaN(contentLength)) contentLength = 0
    goalCallback && goalCallback(contentLength)

    // Step 3: read the data
    let receivedLength = 0 // received that many bytes at the moment
    const chunks: Uint8Array[] = [] // array of received binary chunks (comprises the body)
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      chunks.push(value)
      receivedLength += value.length

      progressCallback && progressCallback(value.length)
    }

    // Step 4: concatenate chunks into single Uint8Array
    const chunksAll = new Uint8Array(receivedLength) // (4.1)
    let position = 0
    for (const chunk of chunks) {
      chunksAll.set(chunk, position) // (4.2)
      position += chunk.length
    }

    // Step 5: decode into a string
    const result = new TextDecoder('utf-8').decode(chunksAll)

    if (type == 'text' || type == 'text/plain') {
      return result as unknown as T
    } else if (type == 'json' || type == 'text/json') {
      return JSON.parse(result) as unknown as T
    } else {
      throw new Error('unknown response type ' + type)
    }
  }
}

declare interface ThemeGetResponse {
  data: {
    docs: {
      toReturn: object[]
    }
  }
}

export declare interface RequestConfig {
  timeout?: string
  headers?: { [k: string]: string }
  responseType: string
  params?: object
}

export class Loader extends CoreLoader {
  loadingAnim: HTMLElement | null
  mergedStylesheet: any
  mergedStylesheets: string = ''
  themes: { [k: string]: any }


  static getParameterByName(name: string, url: string) {
    if (!url) url = window.location.href
    name = name.replace(/[[\]]/g, '\\$&')
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url)
    if (!results) return null
    if (!results[2]) return ''
    return decodeURIComponent(results[2].replace(/\+/g, ' '))
  }

  constructor() {
    super(console)
    this.themes = {}
    this.loadingAnim = document.getElementById('loadingAnim')
  }


  promisePost<T>(
    url: string,
    data?: object,
    config: RequestConfig = requestConfigDefault,
    goalCallback?: (bytes: number) => void,
    progressCallback?: (bytes: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: config.headers,
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data) // body data type must match "Content-Type" header
      }).then(responseTransform(config.responseType, goalCallback, progressCallback))
        .then(resolution => resolve(resolution as T))
        .catch(error => {
          if (error && error.response) reject(error.response)
          else reject(error)
        })
    })
  }

  promiseDelete<T>(
    url: string,
    data?: object,
    config: RequestConfig = requestConfigDefault,
    goalCallback?: (bytes: number) => void,
    progressCallback?: (bytes: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      var myConfig: RequestConfig = Object.assign({}, config) as RequestConfig
      myConfig.params = Object.assign({}, data)

      fetch(url, {
        method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: config.headers,
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      }).then(responseTransform(config.responseType, goalCallback, progressCallback))
        .then(value => resolve(value as T))
        .catch(error => {
          if (error && error.response) reject(error.response)
          else reject(error)
        })
    })
  }

  promiseGet<T>(
    url: string,
    data?: Record<string, any>,
    config: RequestConfig = requestConfigDefault,
    goalCallback?: (bytes: number) => void,
    progressCallback?: (bytes: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      var query = ''
      if (data)
        for (var key in data) {
          if (data[key] == undefined) continue
          var arg = encodeURIComponent(data[key])
          query += `${key}=${arg}&`
        }

      return fetch(`${url}${query ? `?${query}` : ''}`, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'default', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: config.headers,
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      }).then(responseTransform(config.responseType, goalCallback, progressCallback))
        .then(resolution => resolve(resolution as T))
        .catch(error => {
          if (error && error.response) reject(error.response)
          else reject(error)
        })
    })
  }

  promiseSleep(duration: number): Promise<void> {
    return new Promise((resolve, reject) => { setTimeout(resolve, duration) })
  }

  promiseAsset(
    key: string,
    goalCallback?: (bytes: number) => void,
    progressCallback?: (bytes: number) => void
  ) {
    key = this.transformAssetKey(key)

    // Already requested the asset?
    var inspectableAssetPromise = this.assetPromises[key]
    if (inspectableAssetPromise) return inspectableAssetPromise

    var assetPromise: Promise<any>
    var filePromise: Promise<any> | undefined

    // Already requested the file?
    var url = this.assetKeyToUrl(key)

    var segments = key.split(':')
    var assetType = segments[0]
    var assetId = segments[1]

    // Make a new one.
    if (assetType == 'less') {
      filePromise = this.filePromises[url]
      if (!filePromise)
        filePromise = this.promiseGet<string>(url, undefined, undefined, goalCallback, progressCallback).then(rawData => { this.appendMergedStylesheet(rawData) })
      assetPromise = filePromise
    } else if (assetType == 'module') {
      if (this.conf.RUN_MODE == 'prod') {
        // in prod we do this so that the loading bar is accurate
        filePromise = this.filePromises[url]
        if (!filePromise)
          filePromise = this.promiseGet<string>(url, undefined, undefined, goalCallback, progressCallback).then((rawData: string) => {
            const dataUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(rawData)
            return import(dataUri)
          })
        assetPromise = filePromise
      } else {
        // but since we haven't found a technique to get loading progress and sourcemapping, we do this in dev...
        assetPromise = import(url)
      }
    } else if (assetType == 'script-ext') {
      filePromise = this.filePromises[url]
      if (!filePromise)
        filePromise = this.promiseGet<string>(url, undefined, undefined, goalCallback, progressCallback)
          // @ts-ignore
          // filePromise = this.promiseGet<string>(url, undefined, { mode: 'no-cors' }, goalCallback, progressCallback)
          .then(rawData => this.promiseLoadScript(rawData))
      assetPromise = filePromise
    } else if (assetType == 'script-tag') {
      assetPromise = this.assetPromises[key]
      if (!assetPromise) {
        assetPromise = new Promise<any>((resolve, reject) => {
          var s = document.createElement('script')
          // Hack for better Safari Visibility
          //s.src = `data:application/javascript;utf8, ${encodeURIComponent(file)}`;
          s.crossOrigin = 'anonymous'
          s.src = url
          s.type = 'text/javascript'
          s.onload = resolve
          s.onerror = reject
          document.head.append(s)
        })
      }
    } else if (assetType == 'script') {
      if (false) {
        assetPromise = new Promise((resolve, reject) => {
          var s = document.createElement('script')
          s.type = 'text/javascript'
          s.src = url
          s.onload = resolve
          document.head.append(s)
        })
      } else {
        filePromise = this.filePromises[url]
        if (!filePromise) {
          filePromise = this.promiseGet<string>(url, undefined, undefined, goalCallback, progressCallback).then(rawData => {
            var files = rawData.split(/#########BREAK#########/g)
            files.forEach(file => this.promiseLoadScript(file))
          })
        }
        assetPromise = filePromise
      }
    } else if (assetType == 'css') {
      assetPromise = this.promiseGet<string>(url, undefined, undefined, goalCallback, progressCallback).then(rawData => {
        AddLess(url, rawData)
        return rawData
      })
    } else if (assetType == 'template') {
      filePromise = this.filePromises[url]
      if (!filePromise) {
        filePromise = this.promiseGet(url, undefined, undefined, goalCallback, progressCallback).then(rawData => {
          var foundAssets: Record<string, any> = {}
          if (url.endsWith('_Mod.html')) {
            var regex = /###TEMPLATESTART###(.+?)###TEMPLATESTART###((.|\n)+?)###TEMPLATEEND######TEMPLATEEND###/g
            var match
            while ((match = regex.exec(rawData as string)) !== null) {
              foundAssets[`template:${match[1]}`] = match[2]
            }
          } else {
            foundAssets[key] = rawData
          }
          return foundAssets
        })
      }

      assetPromise = filePromise.then(foundAssets => {
        return foundAssets[key]
      })
    } else if (assetType == 'font') {
      var [family, style, weight, local] = assetId.split('|')

      var rule = `font-family: ${family}; font-style: ${style}; font-weight: ${weight}; src: local('${local}'), url('${url}') format('truetype');`
      var styleElement = document.createElement('style')
      // styleElement.type = 'text/css'
      styleElement.setAttribute('rel', 'stylesheet')
      // styleElement.rel = 'stylesheet'
      styleElement.title = 'dynamicSheet'
      styleElement.setAttribute('title', 'dynamicSheet')
      styleElement.innerHTML = styleElement.innerHTML + '@font-face {' + rule + '}'
      document.head.appendChild(styleElement)

      // do this to prioritize font loading
      var preload = document.createElement('link')
      preload.rel = 'preload'
      preload.href = url
      preload.type = 'font/truetype'
      preload.as = 'font'
      preload.crossOrigin = 'anonymous'
      document.head.appendChild(styleElement)

      assetPromise = Promise.resolve()
    } else {
      throw new Error('no handler found to load asset "' + key + '"')
    }

    assetPromise = assetPromise.catch(function (err) {
      console.error(`error loading ${key}`)
      console.error(err)
    })

    if (assetPromise)
      this.assetPromises[key] = InspectablePromiseMake(assetPromise)
    if (filePromise)
      this.filePromises[url] = InspectablePromiseMake(filePromise)
    return assetPromise
  }

  promiseLoadScript(file: string) {
    var isModule = file.match(/\/\/ MODULE\n/)
    var sourceUrlMatch = file.match(/sourceURL=(\S+)/)

    var s = document.createElement('script')
    // Hack for better Safari Visibility
    //s.src = `data:application/javascript;utf8, ${encodeURIComponent(file)}`;
    if (isModule) {
      s.text = `${file.slice(10)}\n`
      s.setAttribute('type', 'module')
      s.crossOrigin = 'anonymous'
      if (sourceUrlMatch) {
        console.log(sourceUrlMatch[1])
        s.setAttribute('src', sourceUrlMatch[1])
      }
    } else {
      s.crossOrigin = 'anonymous'
      s.text = file
      s.type = 'text/javascript'
      if (sourceUrlMatch) {
        console.log(sourceUrlMatch[1])
        s.setAttribute('file', sourceUrlMatch[1])
      }
    }

    document.head.append(s)
  }

  appendMergedStylesheet(rawData: string) {
    var files = rawData.split('/** THIS IS A CSS BREAK **/')
    for (var file of files) {
      var filenameMatch = file.match(/\* FILE:(\S+?) \*/)
      var style = document.createElement('style') as HTMLStyleElement
      // style.type = 'text/css'
      style.setAttribute('type', 'text/css')
      if (filenameMatch) style.setAttribute('file', filenameMatch[1])

      // if (style.styleSheet) {
      //   style.styleSheet.cssText = rawData
      // } else {
      style.appendChild(document.createTextNode(file))
      // }
      document.head.append(style)
      this.stylesheets.push(style)
    }
  }

  // async themePlayByStoreUUID(
  //   storeUUID: string,
  //   useCache: boolean = true,
  //   reload: boolean = false,
  //   goalCallback?: (bytes: number) => void,
  //   progressCallback?: (bytes: number) => void
  // ): Promise<boolean> {
  //   if (!useCache) {
  //     delete this.themes[storeUUID]
  //     this.themeStoreUUID = null
  //   }

  //   if (this.themeStoreUUID == storeUUID && !reload) return
  //   this.themeStoreUUID = storeUUID

  //   // Get theme
  //   var theme = this.themes[storeUUID]
  //   if (!theme) {
  //     await this.promisePost<object>(
  //       `${this.conf.API_SERVER_BASEURL_EXT}/themeGet`,
  //       { storeUUID },
  //       { headers: { 'Content-Type': 'application/json' }, responseType: 'json' },
  //       goalCallback,
  //       progressCallback,
  //     ).then((response: ThemeGetResponse) => {
  //       theme = response.data.docs.toReturn[0]
  //     })
  //   }

  //   if (!this.mergedStylesheets) {
  //     await this.promiseGet<string>(
  //       `/less?v=${theme.version}&mod=base`,
  //       undefined,
  //       undefined,
  //       goalCallback,
  //       progressCallback
  //     ).then(stylesheet => { this.mergedStylesheets = stylesheet })
  //   }

  //   // Start the switch
  //   this.themes[storeUUID] = theme
  //   this.conf.THEME = theme

  //   // Switch the background
  //   if (this.conf.THEME.thmBgImage)
  //     document.documentElement.style.backgroundImage = `url('${this.assetKeyToUrl(`image:${this.conf.THEME.thmBgImage}`)}')`
  //   else
  //     document.documentElement.style.backgroundColor = this.conf.THEME.thmBgClr

  //   // Save oldStylesheets
  //   var oldStylesheets = this.stylesheets
  //   this.stylesheets = []

  //   // Substitute with theme values
  //   var substitutions = {
  //     ASSET_SERVER_CDN_BASEURL: this.conf['ASSET_SERVER_CDN_BASEURL']
  //   }

  //   for (var key in theme) {
  //     if (!key.startsWith('thm')) continue
  //     if (key.includes('Clr') ||
  //       key.includes('Color') ||
  //       key.includes('Img') ||
  //       key.includes('Image') ||
  //       key.includes('Logo') ||
  //       key.includes('Icon')) {
  //       substitutions[key] = theme[key]
  //     }
  //   }

  //   // for (var key in theme.color) substitutions[`\#${key}`] = theme.color[key]
  //   // for (var key in theme.img) substitutions[key] = theme.img[key]

  //   function replaceAll(str, mapObj) {
  //     var re = new RegExp(Object.keys(mapObj).join('|'), 'gi')
  //     return str.replace(re, function (matched) {
  //       return mapObj[matched]
  //     })
  //   }

  //   var mergedStylesheetsWithSubs = replaceAll(this.mergedStylesheets, substitutions)

  //   // Swap stylesheets
  //   this.appendMergedStylesheet(mergedStylesheetsWithSubs)
  //   oldStylesheets.forEach(ss => ss.remove())
  // }

  transformAssetKey(key: string) {
    return key.replace('com.gt.merch.', '').replace('com.gt.zowie.', '')
  }

  assetKeyToUrl(key: string) {
    var segments = key.split(':')
    var assetType = segments[0]
    var assetId = segments[1]

    if (assetType == 'script-ext' || assetType == 'script-tag') {
      return segments.slice(1).join(':')
    }
    if (assetType == 'script') {
      return `${this.conf.ASSET_SERVER_CDN_BASEURL}${this.conf.APP_URL_PATH_BASE}/code?v=${this.conf.VERSION}&mod=boot&delimiter=${this.multiFileDelimiter}${this.conf.COMPILE ? '&compile=true' : ''}`
    }
    if (assetType == 'module') {
      return segments.slice(1).join(':')
    }
    if (assetType == 'less') {
      return `${this.conf.ASSET_SERVER_CDN_BASEURL}${this.conf.APP_URL_PATH_BASE}/less?v=${this.conf.THEME.version}&storeUUID=${this.conf.THEME.storeUUID}&mod=base`
    }
    if (assetType == 'template') {
      var assetPath: string = assetId.replace(/\./g, '/') + '.html'
      return `${this.conf.ASSET_SERVER_CDN_BASEURL}${this.conf.APP_URL_PATH_BASE}/${assetPath}?v=${this.conf.VERSION}`
    }
    if (assetType == 'css') {
      var assetPath: string = assetId.replace(/\./g, '/')
      return assetPath + '.css'
    }
    if (assetType == 'font') {
      var [family, style, weight, local, ttfFile] = assetId.split('|')
      return `${this.conf.ASSET_SERVER_CDN_BASEURL}${this.conf.APP_URL_PATH_BASE}/font/${ttfFile}?v=${this.conf.VERSION}`
    }
    if (assetType == 'image') {
      var subSegments = assetId.split('|')
      var path = subSegments[0]
      var maxW = subSegments[1]
      var maxH = subSegments[2]

      let maxWNum, maxHNum: number
      if (maxW) {
        if (maxW.indexOf('%') > -1) {
          var w = window.innerWidth
          maxWNum = (parseInt(maxW.substring(0, maxW.length - 1)) / 100) * (w - (w % 100)) + 100
        } else
          maxWNum = parseInt(maxW)
      } else
        maxWNum = Number.MAX_SAFE_INTEGER

      if (maxH) {
        if (maxH && maxH.indexOf('%') > -1) {
          var h = window.innerHeight
          maxHNum = (parseInt(maxH.substring(0, maxH.length - 1)) / 100) * (h - (h % 100)) + 100
        } else
          maxHNum = parseInt(maxH)
      } else
        maxHNum = Number.MAX_SAFE_INTEGER


      return `${this.conf.IMAGE_SERVER_URL}?src=${encodeURIComponent(path)}&maxW=${maxW}&maxH=${maxH}`
    }

    return key
  }

  getCookie(name: string) {
    var nameEQ = name + '='
    var ca = document.cookie.split(';')
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i]
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length)
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length)
      }
    }
    return null
  }

  cookie(key: string, value: string, attributes: Record<string, any>) {
    throw 'Loader.cookie: unexpected call'
    var result
    if (typeof document === 'undefined') {
      return
    }

    // Write
    if (arguments.length > 1) {
      attributes = Object.assign({ path: '/' }, attributes)

      if (typeof attributes.expires === 'number') {
        var expires = new Date()
        expires.setMilliseconds(
          expires.getMilliseconds() + attributes.expires * 864e5
        )
        attributes.expires = expires
      }

      // We're using "expires" because "max-age" is not supported by IE
      attributes.expires = attributes.expires
        ? attributes.expires.toUTCString()
        : ''

      value = JSON.stringify(value)

      key = encodeURIComponent(String(key))

      var stringifiedAttributes = ''
      for (var attributeName in attributes) {
        if (!attributes[attributeName]) {
          continue
        }
        stringifiedAttributes += '; ' + attributeName
        if (attributes[attributeName] === true) {
          continue
        }
        stringifiedAttributes += '=' + attributes[attributeName]
      }
      return (document.cookie = key + '=' + value + stringifiedAttributes)
    }

    // Read

    if (!key) {
      result = {}
    }

    // To prevent the for loop in the first place assign an empty array
    // in case there are no cookies at all. Also prevents odd result when
    // calling "get()"
    var cookies = document.cookie ? document.cookie.split('; ') : []
    var rdecode = /(%[0-9A-Z]{2})+/g

    var i = 0
    for (; i < cookies.length; i++) {
      var parts = cookies[i].split('=')
      var cookie = parts.slice(1).join('=')

      // if (!this.json && cookie.charAt(0) === '"') {
      //   cookie = cookie.slice(1, -1)
      // }

      var name = parts[0].replace(rdecode, decodeURIComponent)
      cookie = cookie.replace(rdecode, decodeURIComponent)

      cookie = JSON.parse(cookie)

      if (key === name) {
        result = cookie
        break
      }

      if (!key) {
        result[name] = cookie
      }
    }

    return result
  }

  loadingAnimPlay() {
    if (this.loadingAnim === null) return
    this.loadingAnim.className = 'pulse'
  }

  loadingAnimStop() {
    if (this.loadingAnim === null) return
    this.loadingAnim.className = 'hide'
  }
}

export class LoadingBar {
  catchUpIntervalMs: number = 2500
  element: HTMLElement
  loadGoalBytes: number = 0
  loadProgressBytes: number = 0
  loadProgressBytesToShow: number = 0
  loadProgressDelta: number = 0
  opacityCycleMs: number = 2200
  opacityStop: number = .33
  playing: boolean = false
  startTimeMs: number = 0
  stepIntervalMs: number = 15
  stepTimeMs: number = 0
  stepWrapper: (number: number) => void

  constructor(element: HTMLElement) {
    this.element = element
    this.stepWrapper = (timestamp: number) => this.step(timestamp)
  }

  play(): LoadingBar {
    if (this.playing) return this
    this.playing = true
    this.startTimeMs = Date.now()
    window.requestAnimationFrame(this.stepWrapper)
    return this
  }

  step(timestamp: number) {
    if (!this.playing) return
    if ((timestamp - this.stepTimeMs) < this.stepIntervalMs)
      return window.requestAnimationFrame(this.stepWrapper)

    this.stepTimeMs = timestamp

    if (this.loadProgressBytesToShow < this.loadProgressBytes) {
      this.loadProgressBytesToShow += this.loadProgressDelta
      var pctComplete = .1 + .9 * this.loadProgressBytesToShow / this.loadGoalBytes
      this.element.style.width = pctComplete * 100 + '%'
    }
    var timeDeltaMs = Date.now() - this.startTimeMs
    if (timeDeltaMs > 120000) {
      console.log('Loading Bar timed out')
      this.stop() // This is a safeguard to kill the anim if there is a loading problem
    }
    var radiansElapsed = 6.28319 * timeDeltaMs / this.opacityCycleMs
    var opacity = 1 - (1 - this.opacityStop) * Math.sin(radiansElapsed)
    this.element.style.opacity = opacity as any as string

    window.requestAnimationFrame(this.stepWrapper)
  }

  reset(loadGoalBytes: number): LoadingBar {
    this.opacityStop = .33
    this.opacityCycleMs = 2200
    this.catchUpIntervalMs = 2500
    this.loadGoalBytes = loadGoalBytes
    this.loadProgressBytes = 0
    this.loadProgressBytesToShow = 0
    this.loadProgressDelta = 0
    this.stepIntervalMs = 15
    this.playing = false
    this.stepTimeMs = 0
    return this
  }

  stop() {
    if (!this.playing) return
    this.playing = false
    console.log(`LoadingBar loaded ${this.loadProgressBytes} on stop`)
    this.element.style.display = 'none'
  }

  goalAdd(bytes: number) {
    this.loadGoalBytes += bytes
  }

  progressAdd(bytes: number) {
    this.loadProgressBytes += bytes
    this.loadProgressDelta = (this.loadProgressBytes - this.loadProgressBytesToShow) / this.catchUpIntervalMs * this.stepIntervalMs
  }
}
