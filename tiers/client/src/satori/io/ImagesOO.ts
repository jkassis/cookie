import { Cash } from 'cash-dom'
import { DonutProps, DonutOptions, html } from '../Donut.js'
import { Donut } from '../Donut.js'
import { List } from '../List.js'
import { ImageThumbnailOO } from './ImageThumbnail.js'

export interface Validator {
  message: string

  isValid(value: string[]): Promise<boolean>
}

export class ImagesOO extends Donut {
  declare public a: {
    defaultImgUrl: string
    value: string[]
    valueIdx: number
  }

  public imageOO!: Cash
  public thumbs!: Cash
  public thumbsList!: List<ImageThumbnailOO, ImageThumbnailOO['a'], string>

  public imageRender() {
    if (this.a.value && this.a.value.length)
      this.imageOO.css('background-image', `url('${this.loader.assetKeyToUrl(`image:${this.a.value[this.a.valueIdx]}|100%|100%`)}')`)
    else
      this.imageOO.css('background-image', `url('${this.a.defaultImgUrl}')`)
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`
<div class='imagesOO'>
  <div class='image OO'></div>

  <div class='thumbs'>
    <div class='list'>
      <div class='option'></div>
      <div class='option'></div>
      <div class='option'></div>
    </div>
  </div>
</div>`

    super.init(template, {
      imageOO: '.image.OO',
      thumbs: '.thumbs',
      thumbsList: ['.thumbs .list', List],
    }, options)

    this.thumbsList.a = {
      docs: [],
      item: {
        class: ImageThumbnailOO,
        docSet: (donut: ImageThumbnailOO, doc: string) => donut.a.key = doc,
        render: async (donut: ImageThumbnailOO) => donut.render(),
        a: {
          key: undefined,
          onClick: async (imageThumbnailOO: ImageThumbnailOO) => {
            var valueIdx = this.a.value.findIndex(url => url == imageThumbnailOO.a.key)
            this.a.valueIdx = valueIdx
            this.imageRender()
            this.thumbsRender()
          },
        }
      }
    }

    return this.dobs
  }

  public async play(a: ImagesOO['a']): Promise<void> {
    this.a = a
    this.thumbsList.a.docs = this.a.value
    this.thumbsRender()
  }

  public render() {
    this.imageRender()
    this.thumbsRender()
  }

  public async thumbsRender() {
    this.thumbs.showIf(this.a.value.length > 1 || this.a.valueIdx > 0)
    await this.thumbsList.render()
    for (var childDonut of this.thumbsList.itemDonuts) {
      if (childDonut.a.key == this.a.value[this.a.valueIdx])
        childDonut.dobs.addClass('selected')
      else
        childDonut.dobs.removeClass('selected')
    }
  }
}
