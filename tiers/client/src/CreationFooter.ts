// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html, css } from './satori/Donut.js'
import { AddCSS } from './satori/Loader.js'

AddCSS("CreationFooter", css`
  .make-footer-container {
    margin-top: 1.5rem;
    border-top: 1px solid rgba(6, 78, 59, 0.1);
    padding-top: 0.75rem;
  }

  .make-footer-message {
    text-align: center;
    font-size: 0.7rem;
    letter-spacing: 0.25em;
    color: rgba(6, 78, 59, 0.7);
    text-transform: uppercase;
  }
`)

export class CreationFooter extends Donut {
  declare public a: {
    onShopListAdd: () => Promise<void>
    onShare: () => Promise<void>
    onSave: () => Promise<void>
  }

  public init(template: string, props: DonutProps, options: DonutOptions): Cash {
    template = html`
    <div>
      <!-- Message -->
      <div class="make-footer-container">
        <p class="make-footer-message">
          A Fresh Take on Coastal Living
        </p>
      </div>
    </div>`

    super.init(template, {
    }, options)

    // bind handlers
    return this.dobs
  }
}