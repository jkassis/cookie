// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
window.JS_MD5_NO_COMMON_JS = true
window.JS_MD5_NO_NODE_JS = true

import { Cash } from 'cash-dom'
import { IO } from './IO.js'
import { DonutProps, DonutOptions, html } from '../Donut.js'

export const getDataViewFromFile = (file: File): Promise<DataView> => {
  return new Promise<DataView>(function (resolve, reject) {
    var reader = new FileReader()
    reader.onloadend = function () {
      resolve(new DataView(reader.result as ArrayBuffer))
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export const getImageFromDataURL = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    var img: HTMLImageElement = new Image()
    img.onload = () => {
      resolve(img)
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

export const getDataURLFromFile = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    var reader = new FileReader()
    reader.onload = function (e: ProgressEvent<FileReader>) {
      resolve(e.target!.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// returns
// .  -1 not defined
// .  -2 not jpeg
// see... https://github.com/blueimp/JavaScript-Load-Image/blob/master/js/load-image-exif-map.js
export const getOrientation = (view: DataView): number => {
  if (view.getUint16(0, false) != 0xFFD8) {
    return -2
  }

  const length = view.byteLength
  let offset = 2

  while (offset < length) {
    if (view.getUint16(offset + 2, false) <= 8) return -1
    const marker = view.getUint16(offset, false)
    offset += 2

    if (marker == 0xFFE1) {
      if (view.getUint32(offset += 2, false) != 0x45786966) {
        return -1
      }

      const little = view.getUint16(offset += 6, false) == 0x4949
      offset += view.getUint32(offset + 4, little)
      const tags = view.getUint16(offset, little)
      offset += 2
      for (let i = 0; i < tags; i++) {
        if (view.getUint16(offset + (i * 12), little) == 0x0112) {
          var orientation = view.getUint16(offset + (i * 12) + 8, little)
          return orientation
        }
      }
    } else if ((marker & 0xFF00) != 0xFF00) {
      break
    }
    else {
      offset += view.getUint16(offset, false)
    }
  }
  return -1
}

export const fix = (img: HTMLImageElement, orientation: number): HTMLCanvasElement => {
  // make a canvas
  var width = img.width
  var height = img.height
  var canvas = document.createElement('canvas')
  var ctx = canvas.getContext('2d')!
  canvas.width = width
  canvas.height = height

  // did we get orientation?
  if (typeof orientation == 'number' && orientation <= 8) {
    // yes. adjust canvas for it.
    if (orientation > 4) {
      canvas.width = height
      canvas.height = width
    }
    switch (orientation) {
      case 1:
        // correct
        break
      case 2:
        // horizontal mirror to fix
        ctx.translate(width, 0)
        ctx.scale(-1, 1)
        break
      case 3:
        // 180° rotate CCW to fix
        ctx.translate(width, height)
        ctx.rotate(Math.PI)
        break
      case 4:
        // vertical mirror to fix
        ctx.translate(0, height)
        ctx.scale(1, -1)
        break
      case 5:
        // vertical mirror + 90 rotate CW to fix
        ctx.rotate(0.5 * Math.PI)
        ctx.scale(1, -1)
        break
      case 6:
        // 90° rotate CW to fix
        ctx.rotate(0.5 * Math.PI)
        ctx.translate(0, -height)
        break
      case 7:
        // horizontal mirror + 90 rotate CW to fix
        ctx.rotate(0.5 * Math.PI)
        ctx.translate(width, -height)
        ctx.scale(-1, 1)
        break
      case 8:
        // 90° rotate CCW to fix
        ctx.rotate(-0.5 * Math.PI)
        ctx.translate(-width, 0)
        break
    }
  }

  // redraw the image
  ctx.drawImage(img, 0, 0, width, height)

  var minDim = Math.min(width, height)
  var sf = minDim < 2048 ? 1 : 2048 / minDim
  ctx.scale(sf, sf)

  return canvas
}

export interface Validator {
  message: string

  isValid(value: string | undefined): Promise<boolean>
}

export class ImageIO extends IO<string | undefined> {
  declare public a: {
    onChange?: (value: string) => Promise<any>
    imagePut: (ab: ArrayBuffer, fileType: string) => Promise<string>, // returns assetKey
    validators?: Validator[]
    ioError?: Cash
  }

  public fileGetAndUploadPromise?: Promise<void>
  public preview!: Cash
  public uploader!: HTMLFormElement
  public validatorInError?: Validator

  constructor() {
    super()
  }

  public static isSet(message = 'Required'): Validator {
    return {
      message,
      isValid: async function (value: string): Promise<boolean> {
        return value != null
      }
    }
  }

  public aSet(a: ImageIO['a']) {
    this.a = a
    if (a.ioError) this.errController.ioError = a.ioError
  }

  public fileGetAndUpload(e: Event) {
    if (this.fileGetAndUploadPromise)
      return this.fileGetAndUploadPromise

    this.fileGetAndUploadPromise = (async () => {
      this.preview.addClass('loading withRotation')
      this.preview.css('background-image', 'url(\'img/loading.fidget.10.png\')')
      try {
        await this.upload(e.target as HTMLInputElement)
        this.render()
        this.uploader.val('')
      } finally {
        delete this.fileGetAndUploadPromise
        this.preview.removeClass('withRotation')
      }
    })()

    return this.fileGetAndUploadPromise
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    var tabindexStr: string = 'tabindex=\'-1\''
    if (options !== undefined && options.attrs != undefined) {
      var tabindex = options.attrs.getNamedItem('tabindex')
      if (tabindex !== null) {
        tabindexStr = `tabindex='${tabindex.value}'`
        options.attrs.removeNamedItem('tabindex')
      }
    }

    template = html`
<div class='image editor'>
  <div class='bg'></div>
  <div class='preview'></div>
  <input class='uploader' type='file' accept='image/*' ${tabindexStr}> </input>
  <div class='ioError'></div>
</div>`

    super.init(template, {
      ioError: '.ioError',
      fieldDob: '.preview',
      preview: '.preview',
      uploader: '.uploader',
    }, options)
    return this.dobs
  }

  public onUploaderTouch(e: Event) {
    if (this.fileGetAndUploadPromise) e.preventDefault()
    e.stopPropagation()
  }

  public async play() { }

  public render() {
    if (this.value) {
      var assetUrl = this.loader.assetKeyToUrl(`image:${this.value}|100%|100%`)
      this.preview.css('background-image', `url('${assetUrl}')`)
    } else this.preview.css('background-image', '')
    this.preview.removeClass('loading')
  }

  public async upload(e: HTMLInputElement) {
    // get file
    if (e.files === null) return
    var file = e.files[0]
    if (!file) return

    // isValid type
    if (!/^image\//i.test(file.type)) {
      alert('<div class="h1">Invalid Image</div><div class="body">Not a valid image!</div>')
    }

    var canvasToBinaryArray1 = (canvas: HTMLCanvasElement, fileType: any): Uint8Array => {
      // rube goldberg method
      // convert it to a png dataUrl
      var dataUrl = canvas.toDataURL(fileType, 0.6)
      // var dataURI = canvas.toDataURL('image/jpeg', 0.5)

      // separate out the mime component
      var mimeString = dataUrl
        .split(',')[0]
        .split(':')[1]
        .split(';')[0]

      // convert dataUrl to a byteString
      var byteString
      if (dataUrl.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataUrl.split(',')[1])
      else byteString = unescape(dataUrl.split(',')[1])

      // convert byteString to a binaryArray
      var binaryArray = new Uint8Array(byteString.length)
      for (var i = 0; i < byteString.length; i++) {
        binaryArray[i] = byteString.charCodeAt(i)
      }

      return binaryArray
    }

    var canvasToBinaryArray2 = async (canvas: HTMLCanvasElement): Promise<ArrayBuffer | null> => {
      // canvas.toBlob not supported in Safari yet
      var blob: Blob | null = await new Promise<Blob | null>((resolve, reject) => {
        canvas.toBlob(resolve, 'image/png')
      })
      if (blob === null) return null
      var arrayBuffer: ArrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.addEventListener('loadend', () => {
          resolve(reader.result as ArrayBuffer)
        })
        reader.readAsArrayBuffer(blob!)
      })
      return arrayBuffer
    }

    // This doesn't work... it's not a png
    var canvasToBinaryArray3 = (canvas: HTMLCanvasElement) => {
      var imageData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
      var binaryArray = imageData.data.buffer
    }


    var loadWithBlueImp = (): Promise<Uint8Array> => {
      return new Promise<Uint8Array>((resolve, reject) => {
        loadImage(
          file,
          async (canvas: HTMLCanvasElement, ...args: any[]) => {
            // @ts-ignore
            if (canvas.type == 'error') {
              reject(canvas)
              return
            }
            console.log(`height: ${canvas.height}, width: ${canvas.width}`)
            let uint8Array = await canvasToBinaryArray1(canvas, file.type)
            resolve(uint8Array)
          },
          { meta: true, orientation: true, maxWidth: 2048, maxHeight: 2048, canvas: true }
        )
      })
    }

    var loadWithMine = async (): Promise<Uint8Array> => {
      var dataUrl: string = await getDataURLFromFile(file)
      var img: HTMLImageElement = await getImageFromDataURL(dataUrl)
      // var view: DataView = await getDataViewFromFile(file)
      // var orientation = getOrientation(view)
      var orientation = 1
      var canvas = fix(img, orientation)

      return await canvasToBinaryArray1(canvas, file.type)
      // var binaryArray = await canvasToBinaryArray2(canvas)
    }

    try {
      let uint8Array = await loadWithBlueImp()

      // Put binary data to the server
      var assetKey = await this.a.imagePut(uint8Array.buffer as ArrayBuffer, file.type)

      // var assetKey = await this.api.s3ImagePut(
      //   'images/ugc',
      //   binaryArray,
      //   file.type
      // )

      // set value
      this.value = assetKey
      if (!await this.valueIsValid(this.value))
        return
      if (this.a.onChange) this.a.onChange(this.value)
    } catch (err) {
      console.log(err)
      if (file.type == 'image/heic') {
        await this.app.alert(
          '<div class="h1">Upload Error</div><div class="body">Something is not right with that image. The image type is heic, which is a proprietary Apple type. Try again or try using Safari.</div>',
          'OK'
        )
      } else {
        await this.app.alert(
          '<div class="h1">Upload Error</div><div class="body">Something is not right with that image. Try again or try another image.</div>',
          'OK'
        )
      }
    }
  }

  public async valueIsValid(value: string | undefined): Promise<boolean> {
    this.errorExists = false
    if (this.a.validators) {
      for (var validator of this.a.validators) {
        if (!(await validator.isValid(value))) {
          this.errorExists = true
          this.validatorInError = validator
          this.errorPlay(validator.message)
          break
        }
      }

      if (!this.errorExists) this.errorStop()
    }

    return !this.errorExists
  }

  public async valueIsValidAndFinal() {
    if (this.fileGetAndUploadPromise) await this.fileGetAndUploadPromise
    return await this.valueIsValid(this.value)
  }

  public valueSet(value?: string) {
    this.value = value
    // https://stackoverflow.com/questions/1043957/clearing-input-type-file-using-jquery/13351234#13351234
    // this.uploader = this.uploader.replaceWith(this.uploader.val('').clone(true));

    // https://stackoverflow.com/questions/1043957/clearing-input-type-file-using-jquery/13351234#13351234

    var newUploader = this.uploader.val('').clone(true)
    this.uploader.replaceWith(newUploader)
    this.uploader = newUploader
    this.uploader.on('click touch', (e: Event) => this.onUploaderTouch(e))
    this.uploader.on('change', (e: Event) => this.fileGetAndUpload(e))
    this.render()
  }

  public async valueTextToValue(valueText?: string): Promise<string | undefined> {
    if (valueText === undefined || valueText == '')
      return undefined
  }

  public valueToValueText(value: string): string {
    return value
  }
}
