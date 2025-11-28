import '../../ErrorHandler.js'
import type * as loadImage from 'blueimp-load-image'
import type Sentry from '@sentry/browser'
import type { App } from './App.js'

declare global {
  var errorScreenStop: () => void

  const less: any
  var JS_MD5_NO_COMMON_JS: boolean
  var JS_MD5_NO_NODE_JS: boolean
  var Sentry: Sentry
  var app: App
  var env: { [k: string]: any }
  var errorScreenPlay: (error: any) => void
  var handleError: (error: any) => Promise<boolean>
  var loadImage: loadImage
  var loader: any
}
