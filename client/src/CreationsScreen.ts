import { AddCSS } from './satori/Loader.js'
import { App } from './Main.js'
import { Cash } from 'cash-dom'
import { Creation, Step, Ingredient } from './Schema.js'
import { CreationBrief } from './CreationBrief.js'
import { CreationHeader } from './CreationHeader.js'
import { DonutProps, DonutOptions, html, css } from './satori/Donut.js'
import { List } from './satori/List.js'
import { Router } from './satori/Router.js'
import { Screen } from './satori/Screen.js'
import { VIList } from './satori/IList.js'
import { dao } from './DAO.js'
import { CreationE2EScreen } from './CreationE2EScreen.js'


AddCSS("CreationsScreen", css`
.creationsScreen .creations-screen-list {
  background-color: #f5f1ed;
  width: 100%;
}

.creationsScreen .creations-screen-list > * {
  margin-bottom: 1rem;
}

.creationsScreen .creations-screen-list > *:last-child {
  margin-bottom: 0;
}
`)

export class CreationsScreen extends Screen {
  public static URL(a: CreationsScreen['a']) {
    return `creations?${Router.aToURLParams(a)}`
  }
  declare public a: {}
  declare public app: App

  private iList!: VIList<CreationBrief, CreationBrief['a'], Creation>
  private list!: List<CreationBrief, CreationBrief['a'], Creation>

  init(template: string, props: DonutProps, options: DonutOptions): Cash {
    var template = html`
<div class='creationsScreen'>
  <div class='screenHeader'></div>
  <div class='creations-screen-list'></div>
</div>`

    super.init(template, {
      list: ['.creations-screen-list', List],
      creationHeader: ['.screenHeader', CreationHeader],
    }, options)

    this.list.a = {
      docs: [],
      item: {
        class: CreationBrief,
        docSet: (donut: CreationBrief, doc: Creation) => donut.a.creation = doc,
        a: {
          creation: {} as Creation,
          onClick: async (c: Creation) => {
            this.app.router.playFwd(CreationE2EScreen.URL({ id: c.id }))
          },
        },
        render: (donut: CreationBrief) => donut.play(donut.a.creation).then(() => donut.render()),
      }
    }

    this.iList = new VIList<CreationBrief, CreationBrief['a'], Creation>(
      this.app.scrollingElement,
      this.list,
      p => this.listPageGet(p)
    ).init()

    return this.dobs
  }

  async play(a: CreationsScreen['a']) {
    await this.iList.play()
    this.iList.reset()
    this.iList.pageNextGet()
  }

  async stop() {
    this.iList.stop()
  }

  render() {
  }

  public listPageGet(page: number): Promise<Creation[]> {
    return dao.CreationsGet(20, page)
  }
}
