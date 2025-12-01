import { Cash } from 'cash-dom'
import { DonutProps, DonutOptions, html } from '../Donut.js'
import { Donut } from '../Donut.js'

export class ImageThumbnailOO extends Donut {
  declare public a: {
    key: string | undefined
    onClick: (b: ImageThumbnailOO) => Promise<void>
  }

  public imageThumbnailOO!: Cash

  constructor() {
    super()
    this.a = {} as ImageThumbnailOO['a']
  }

  public async hydrate() {
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`
<div class=\'imageThumbnail OO\'></div>`

    super.init(template, {}, options)

    this.dobs.on('click touch', () => this.a.onClick(this))
    return this.dobs
  }

  public render() {
    this.dobs.css('background-image', `url('${this.loader.assetKeyToUrl(`image:${this.a.key}|100%|100%`)}')`)
  }
}
