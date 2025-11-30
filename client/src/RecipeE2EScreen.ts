import { App } from './Main.js'
import { Cash } from 'cash-dom'
import { DonutProps, DonutOptions, html } from './satori/Donut.js'
import { RecipeActions } from './RecipeActions.js'
import { RecipeFooter } from './RecipeFooter.js'
import { RecipeHeader } from './RecipeHeader.js'
import { Router } from './satori/Router.js'
import { Screen } from './satori/Screen.js'

import { AddCSS, AddLess } from './satori/Loader.js'



AddCSS("RecipeE2EScreen", `
  .recipe-container {
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

  .recipe-hero {
    width: 100%;
    aspect-ratio: 4/3;
  }

  .recipe-hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .recipe-content {
    padding: 1.25rem 1.5rem 1.5rem;
    max-width: 42rem;
    margin-left: auto;
    margin-right: auto;
    flex: 1;
  }

  .recipe-title-section {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .recipe-title {
    font-size: 1.875rem;
    line-height: 2.25rem;
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    letter-spacing: -0.025em;
    color: rgb(6, 78, 59);
  }

  .recipe-description {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.625;
    color: rgb(51, 65, 85);
    font-style: italic;
  }

  .recipe-ingredients-box {
    padding: 1rem;
    margin-bottom: 1.25rem;
    background-color: #F7F4EA;
    border-radius: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid #EAE6E4;
  }

  .recipe-section-title {
    font-size: 1.5rem;
    line-height: 2rem;
    color: rgb(30, 41, 59);
    text-align: center;
    margin-bottom: 1rem;
  }

  .recipe-ingredients-list {
    font-size: 0.875rem;
    line-height: 1.625;
    color: rgb(30, 41, 59);
  }

  .recipe-ingredients-list ul {
    list-style-type: disc;
    list-style-position: inside;
  }

  .recipe-ingredients-list ul li {
    margin-bottom: 0.25rem;
  }

  .recipe-directions {
    margin-bottom: 1.25rem;
  }

  .recipe-directions ol {
    margin-top: 0.75rem;
    list-style-type: decimal;
    list-style-position: inside;
    font-size: 0.875rem;
    line-height: 1.625;
    color: rgb(30, 41, 59);
  }

  .recipe-directions ol li {
    margin-bottom: 0.25rem;
  }

  .recipe-notes {
    margin-bottom: 1.5rem;
  }

  .recipe-notes p {
    margin-top: 0.75rem;
    font-size: 0.75rem;
    line-height: 1.625;
    color: rgb(51, 65, 85);
  }

  .recipe-actions-fixed {
    position: fixed;
    bottom: 0;
  }
`)


export class RecipeE2EScreen extends Screen {
  private recipeFooter?: RecipeFooter
  declare public a: {}
  declare public app: App

  public static URL(a: RecipeE2EScreen['a']) {
    return `recipeE2E?${Router.aToURLParams(a)}`
  }

  init(template: string, props: DonutProps, options: DonutOptions): Cash {
    // html annotation intentionally left out
    var template = html`
    <div class="recipe-container">
      <div class="recipeHeader"></div>

      <!-- Edge-to-edge hero image -->
      <div class="recipe-hero">
        <img src="assets/paloma-fresca/hero.png" alt="Paloma Fresca mocktail with grapefruit and rosemary" />
      </div>

      <!-- Content -->
      <div class="recipe-content">

        <!-- Title + Description -->
        <div class="recipe-title-section">
          <h1 class="recipe-title">
            Paloma Fresca
          </h1>
          <p class="recipe-description">
            A fresh citrus-forward coastal mocktail inspired by long afternoons on the Malibu pier.
          </p>
        </div>

        <!-- Ingredients -->
        <div class="recipe-ingredients-box">
          <h2 class="recipe-section-title">Ingredients</h2>
          <div class="recipe-ingredients-list">
            <ul>
              <li>4 oz fresh grapefruit juice</li>
              <li>1 oz lime juice</li>
              <li>2 oz sparkling water</li>
              <li>1 tsp agave syrup</li>
              <li>Sea-salt rim</li>
              <li>Rosemary sprig or grapefruit wedge (garnish)</li>
            </ul>
          </div>
        </div>

        <!-- Directions -->
        <div class="recipe-directions">
          <h2 class="recipe-section-title">Directions</h2>
          <ol>
            <li>Run a lime wedge around the rim and dip the glass in sea salt.</li>
            <li>Fill the glass with ice.</li>
            <li>Add grapefruit juice, lime juice, and agave syrup.</li>
            <li>Stir gently to combine.</li>
            <li>Top with sparkling water.</li>
            <li>Garnish with rosemary sprig or grapefruit slice.</li>
          </ol>
        </div>

        <!-- Notes -->
        <div class="recipe-notes">
          <h2 class="recipe-section-title">Notes</h2>
          <p>
            Use pink grapefruit for a softer, sweeter profile. Swap sparkling water for tonic if you
            like more bite, or try smoked sea salt on the rim for an extra coastal twist.
          </p>
        </div>

        <!-- Footer brand line -->
        <div class="recipeFooter"></div>
      </div>

      <div class='recipeActions recipe-actions-fixed'></div>
    </div>`

    super.init(template, {
      recipeHeader: [".recipeHeader", RecipeHeader],
      recipeFooter: [".recipeFooter", RecipeFooter],
      recipeActions: [".recipeActions", RecipeActions],
    }, options)

    return this.dobs
  }
}
