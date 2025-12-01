import { Cash } from 'cash-dom'
import { Donut } from '../Donut.js'
import { DonutProps, DonutOptions, html } from '../Donut.js'
import { ImageIO } from './ImageIO.js'
import { ImageThumbnailOO } from './ImageThumbnail.js'
import { List } from '../List.js'

export interface Validator {
  message: string

  isValid(value: string[]): Promise<boolean>
}

export class ImagesIO extends Donut {
  declare public a: {
    onChange?: () => Promise<any>
    imagePut: (ab: ArrayBuffer, fileType: string) => Promise<string>
    validators: Validator[]
  }

  public errorExists: boolean = false
  public imageAddBtn!: Cash
  public imageBwdBtn!: Cash
  public imageDelBtn!: Cash
  public imageFwdBtn!: Cash
  public imageIO!: ImageIO
  public thumbs!: Cash
  public thumbsList!: List<ImageThumbnailOO, ImageThumbnailOO['a'], string>
  public validatorInError?: Validator
  public value: string[] = []
  public valueIdx: number = 0

  public static hasN(message: string = 'Required', n: number = 1): Validator {
    return {
      message,
      isValid: async function (values: string[]): Promise<boolean> {
        return (values != null && values.length >= n)
      }
    }
  }

  public aSet(a: ImagesIO['a']) {
    this.a = a
    if (!this.a.validators) {
      this.a.validators = []
    }
  }

  public buttonsRender(): void {
    this.imageAddBtn.showIf(this.value.length > 0)
    this.imageDelBtn.showIf(this.value != null && this.value[this.valueIdx] != undefined)
    this.imageFwdBtn.showIf(this.value.length > 1)
    this.imageBwdBtn.showIf(this.value.length > 2)
  }

  public imageAdd(e: Event): void {
    this.evtStop(e)
    if (this.imageIO.fileGetAndUploadPromise) return
    this.imageAddBtn.animateCss('bounceIn')

    this.valueIdx = this.value.length
    this.imageIO.valueSet(this.value[this.valueIdx])
    this.buttonsRender()
    this.thumbsRender()
  }

  public imageBwd(e: Event): void {
    this.evtStop(e)
    if (this.imageIO.fileGetAndUploadPromise) return
    this.imageBwdBtn.animateCss('bounceIn')

    var valueIdxStart = this.valueIdx
    var valueIdxEnd = this.valueIdx - 1
    if (valueIdxEnd < 0) valueIdxEnd = this.value.length - 1

    var tmp = this.value[valueIdxEnd]
    this.value[valueIdxEnd] = this.value[valueIdxStart]
    this.value[valueIdxStart] = tmp
    this.valueIdx = valueIdxEnd

    this.render()
    this.buttonsRender()
    this.thumbsRender()
  }

  public imageDel(e: Event): void {
    this.evtStop(e)
    if (this.imageIO.fileGetAndUploadPromise) return
    this.imageDelBtn.animateCss('bounceIn')

    this.value.splice(this.valueIdx, 1)
    if (this.valueIdx > 0 && this.valueIdx >= this.value.length)
      this.valueIdx = this.value.length - 1

    this.imageIO.valueSet(this.value[this.valueIdx])
    this.buttonsRender()
    this.thumbsRender()
  }

  public imageFwd(e: Event): void {
    this.evtStop(e)
    if (this.imageIO.fileGetAndUploadPromise) return
    this.imageFwdBtn.animateCss('bounceIn')

    var valueIdxStart = this.valueIdx
    var valueIdxEnd = this.valueIdx + 1
    if (valueIdxEnd >= this.value.length) valueIdxEnd = 0

    var tmp = this.value[valueIdxEnd]
    this.value[valueIdxEnd] = this.value[valueIdxStart]
    this.value[valueIdxStart] = tmp
    this.valueIdx = valueIdxEnd

    this.render()
    this.buttonsRender()
    this.thumbsRender()
  }

  public imageIOOnChange(v: string) {
    this.value[this.valueIdx] = v
    this.buttonsRender()
    this.thumbsRender()
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    var tabindexStr: string = 'tabindex=\'-1\''
    if (options !== undefined && options.attrs !== undefined) {
      var tabindex = options.attrs.getNamedItem('tabindex')
      if (tabindex != null) {
        tabindexStr = `tabindex='${tabindex.value}'`
        options.attrs.removeNamedItem('tabindex')
      }
    }

    template = html`
<div class='images editor'>
  <div class='editGroup'>
    <div class='imageIO' ${tabindexStr}></div>
    <div class='imageBwdBtn'><span>&#9660;</span></div>
    <div class='imageFwdBtn'><span>&#9660;</span></div>
    <div class='imageDelBtn'><span>⌫</span></div>
    <div class='imageAddBtn'><span>+</span></div>
  </div>
  <div class='thumbs'>
    <div class='list'>
      <div class='option'></div>
      <div class='option'></div>
      <div class='option'></div>
    </div>
  </div>
</div>`

    super.init(template, {
      imageBwdBtn: '.imageBwdBtn',
      imageFwdBtn: '.imageFwdBtn',
      imageAddBtn: '.imageAddBtn',
      imageDelBtn: '.imageDelBtn',
      imageIO: ['.imageIO', ImageIO],
      thumbs: '.thumbs',
      thumbsList: ['.thumbs .list', List],
    }, options)

    this.imageIO.a = {
      onChange: async v => this.imageIOOnChange(v),
      imagePut: (ab: ArrayBuffer, fileType: string) => { return this.a.imagePut(ab, fileType) },
    }

    this.imageAddBtn.on('click touch', e => this.imageAdd(e))
    this.imageBwdBtn.on('click touch', e => this.imageBwd(e))
    this.imageDelBtn.on('click touch', e => this.imageDel(e))
    this.imageFwdBtn.on('click touch', e => this.imageFwd(e))
    this.thumbsList.a = {
      docs: [],
      item: {
        docSet: (donut: ImageThumbnailOO, doc: string) => donut.a.key = doc,
        class: ImageThumbnailOO,
        render: async (donut: ImageThumbnailOO) => donut.render(),
        a: {
          key: undefined,
          onClick: async (imageThumbnailOO: ImageThumbnailOO) => {
            var valueIdx = this.value.findIndex(url => url == imageThumbnailOO.a.key)
            this.valueIdx = valueIdx
            this.render()
          },
        }
      }
    }

    return this.dobs
  }

  public async play(): Promise<void> {
    this.valueIdx = 0
    this.thumbsList.a.docs = this.value
  }

  public render() {
    this.imageIO.valueSet(this.value[this.valueIdx])
    this.imageIO.render()
    this.buttonsRender()
    this.thumbsRender()
  }

  public async thumbsRender() {
    this.thumbs.showIf(this.value.length > 1 || this.valueIdx > 0)
    await this.thumbsList.render()
    for (var childDonut of this.thumbsList.itemDonuts) {
      if (childDonut.a.key == this.value[this.valueIdx])
        childDonut.dobs.addClass('selected')
      else
        childDonut.dobs.removeClass('selected')
    }
  }

  public async valueIsValidAndFinal(): Promise<boolean> {
    var imageIOIsValidAndFinal = await this.imageIO.valueIsValidAndFinal()

    this.errorExists = false
    if (this.a.validators) {
      for (var validator of this.a.validators) {
        if (!(await validator.isValid(this.value))) {
          this.errorExists = true
          this.validatorInError = validator
          this.imageIO.errorPlay(validator.message)
          break
        }
      }

      if (!this.errorExists) this.imageIO.errorStop()
    }

    return !this.errorExists
  }

  public valueSet(value: string[]) {
    this.value = value
    this.valueIdx = 0
    this.imageIO.valueSet(this.value[this.valueIdx])
    this.buttonsRender()
    this.thumbsRender()
  }
}
