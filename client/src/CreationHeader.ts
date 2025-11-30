// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html, css } from './satori/Donut.js'
import { AddCSS } from './satori/Loader.js'

AddCSS("CreationHeader", css`
  .make-header-container {
    position: relative;
    margin: 0.5rem;
    text-align: center;
    padding: 0.5rem;
  }

  .make-header-corner-tl {
    position: absolute;
    top: 0;
    left: 0;
    width: 1rem;
    height: 1rem;
    border-top: 2px solid rgba(6, 78, 59, 0.4);
    border-left: 2px solid rgba(6, 78, 59, 0.4);
  }

  .make-header-corner-tr {
    position: absolute;
    top: 0;
    right: 0;
    width: 1rem;
    height: 1rem;
    border-top: 2px solid rgba(6, 78, 59, 0.4);
    border-right: 2px solid rgba(6, 78, 59, 0.4);
  }

  .make-header-corner-bl {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 1rem;
    height: 1rem;
    border-bottom: 2px solid rgba(6, 78, 59, 0.4);
    border-left: 2px solid rgba(6, 78, 59, 0.4);
  }

  .make-header-corner-br {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 1rem;
    height: 1rem;
    border-bottom: 2px solid rgba(6, 78, 59, 0.4);
    border-right: 2px solid rgba(6, 78, 59, 0.4);
  }

  .make-header-title {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: rgba(6, 78, 59, 0.8);
    text-transform: uppercase;
  }

  .make-header-subtitle {
    margin-top: 0.25rem;
    font-size: 0.7rem;
    letter-spacing: 0.25em;
    color: rgba(6, 78, 59, 0.6);
    text-transform: uppercase;
  }
`)

export class CreationHeader extends Donut {
  declare public a: {}

  public init(template: string, props: DonutProps, options: DonutOptions): Cash {
    template = html`
  <div class="make-header-container">
    <!-- Corner decorations -->
    <div class="make-header-corner-tl"></div>
    <div class="make-header-corner-tr"></div>
    <div class="make-header-corner-bl"></div>
    <div class="make-header-corner-br"></div>

    <!-- Side accent marks -->
    <!--
      <div class="absolute top-1/2 left-0 w-2 h-px bg-emerald-900/40 -translate-y-1/2"></div>
      <div class="absolute top-1/2 right-0 w-2 h-px bg-emerald-900/40 -translate-y-1/2"></div>
    -->

    <p class="make-header-title">
      FarmGoods Market
    </p>
    <p class="make-header-subtitle">
      - Mocktail Series -
    </p>
  </div>`

    super.init(template, {}, options)

    // bind handlers
    return this.dobs
  }
}
