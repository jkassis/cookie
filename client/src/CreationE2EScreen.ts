import { App } from './Main.js'
import { Cash } from 'cash-dom'
import { DonutProps, DonutOptions, html, css } from './satori/Donut.js'
import { MakeActions } from './CreationActions.js'
import { MakeFooter } from './CreationFooter.js'
import { MakeHeader } from './CreationHeader.js'
import { Router } from './satori/Router.js'
import { Screen } from './satori/Screen.js'
import { Creation, Step, Ingredient } from './Schema.js'
import { AddCSS } from './satori/Loader.js'
import { dao } from './DAO.js'




AddCSS("CreationE2EScreen", css`
  .creation-e2e-container {
    width: 100%;
    background-color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    border: 1px solid rgb(226, 232, 240);
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding-bottom: 5rem;
  }

  .creation-e2e-hero {
    width: 100%;
    aspect-ratio: 4/3;
  }

  .creation-e2e-hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .creation-e2e-content {
    padding: 1.25rem 1.5rem 1.5rem;
    max-width: 42rem;
    margin-left: auto;
    margin-right: auto;
    flex: 1;
  }

  .creation-e2e-title-section {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .creation-e2e-title {
    font-size: 1.875rem;
    line-height: 2.25rem;
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    letter-spacing: -0.025em;
    color: rgb(6, 78, 59);
  }

  .creation-e2e-desc {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.625;
    color: rgb(51, 65, 85);
    font-style: italic;
  }

  .creation-e2e-bom-box {
    padding: 1rem;
    margin-bottom: 1.25rem;
    background-color: #F7F4EA;
    border-radius: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid #EAE6E4;
  }

  .creation-e2e-section-title {
    font-size: 1.5rem;
    line-height: 2rem;
    color: rgb(30, 41, 59);
    text-align: center;
    margin-bottom: 1rem;
  }

  .creation-e2e-bom {
    font-size: 0.875rem;
    line-height: 1.625;
    color: rgb(30, 41, 59);
  }

  .creation-e2e-bom ul {
    list-style-type: disc;
    list-style-position: inside;
  }

  .creation-e2e-bom ul li {
    margin-bottom: 0.25rem;
  }

  .creation-e2e-steps{
    margin-bottom: 1.25rem;
  }

  .creation-e2e-steps ol {
    margin-top: 0.75rem;
    list-style-type: decimal;
    list-style-position: inside;
    font-size: 0.875rem;
    line-height: 1.625;
    color: rgb(30, 41, 59);
  }

  .creation-e2e-steps ol li {
    margin-bottom: 0.25rem;
  }

  .creation-e2e-notes {
    margin-bottom: 1.5rem;
  }

  .creation-e2e-notes p {
    margin-top: 0.75rem;
    font-size: 0.75rem;
    line-height: 1.625;
    color: rgb(51, 65, 85);
  }

  .creation-e2e-actions-fixed {
    position: fixed;
    bottom: 0;
  }
`)




export class CreationE2EScreen extends Screen {
  public static URL(a: CreationE2EScreen['a']) {
    return `creation-e2e?${Router.aToURLParams(a)}`
  }
  declare public a: { id: string }
  declare public app: App


  private creation!: Creation
  private title!: Cash
  private desc!: Cash
  private heroImg!: Cash
  private bom!: Cash
  private steps!: Cash
  private notes!: Cash
  private makeFooter!: Cash

  init(template: string, props: DonutProps, options: DonutOptions): Cash {
    // html annotation intentionally left out
    var template = html`
    <div class="creation-e2e-container">
      <div class="makeHeader"></div>

      <!-- Edge-to-edge hero image -->
      <div class="creation-e2e-hero">
        <img class="creation-e2e-hero-img" src="" alt="" />
      </div>

      <!-- Content -->
      <div class="creation-e2e-content">

        <!-- Title + Desc -->
        <div class="creation-e2e-title-section">
          <h1 class="creation-e2e-title"></h1>
          <p class="creation-e2e-desc"></p>
        </div>

        <!-- BOM -->
        <div class="creation-e2e-bom-box">
          <h2 class="creation-e2e-section-title">Ingredients</h2>
          <div class="creation-e2e-bom">
            <ul class="creation-e2e-bom-list"></ul>
          </div>
        </div>

        <!-- Steps -->
        <div class="creation-e2e-steps">
          <h2 class="creation-e2e-section-title">Steps</h2>
          <ol class="creation-e2e-steps-list"></ol>
        </div>

        <!-- Notes -->
        <div class="creation-e2e-notes">
          <h2 class="creation-e2e-section-title">Notes</h2>
          <p class="creation-e2e-notes-p"></p>
        </div>

        <!-- Footer brand line -->
        <div class="makeFooter"></div>
      </div>

      <div class='makeActions creation-e2e-actions-fixed'></div>
    </div>`

    super.init(template, {
      makeHeader: [".makeHeader", MakeHeader],
      makeFooter: [".makeFooter", MakeFooter],
      makeActions: [".makeActions", MakeActions],
      title: ".creation-e2e-title",
      desc: ".creation-e2e-desc",
      heroImg: ".creation-e2e-hero-img",
      bom: ".creation-e2e-bom-list",
      steps: ".creation-e2e-steps-list",
      notes: ".creation-e2e-notes-p"
    }, options)

    return this.dobs
  }

  async play(a: CreationE2EScreen['a']) {
    this.a = a
    let creation = dao.CreationByID(this.a.id)
    if (creation == undefined) {
      throw new Error('does not exist')
    }
    this.creation = creation
  }

  render() {
    // Populate the UI with the data
    this.title.text(this.creation.title)
    this.desc.text(this.creation.desc)
    this.heroImg.attr('src', this.creation.heroImg)
    this.heroImg.attr('alt', this.creation.title)
    this.notes.text(this.creation.notes)

    // Populate BOM
    this.bom.empty()
    this.creation.bom.forEach(ingredient => {
      const li = ingredient.link
        ? `<li><a href="${ingredient.link}" target="_blank">${ingredient.title}</a></li>`
        : `<li>${ingredient.title}</li>`
      this.bom.append(li)
    })

    // Populate Steps
    this.steps.empty()
    this.creation.steps.forEach(step => {
      this.steps.append(`<li>${step}</li>`)
    })
  }
}
