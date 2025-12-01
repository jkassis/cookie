// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html, css } from './satori/Donut.js'
import { AddCSS } from './satori/Loader.js'
import { Creation } from './Schema.js'

AddCSS("CreationBrief", css`
  .creation-brief-card {
    width: 100%;
    max-width: 42rem;
    margin-left: auto;
    margin-right: auto;
    background-color: white;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid rgb(241, 245, 249);
    overflow: hidden;
    display: flex;
    gap: 1rem;
    padding: 0.75rem;
    transition: all 0.2s ease-out;
    cursor: pointer;
  }

  .creation-brief-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: translateY(-0.125rem);
  }

  @media (min-width: 640px) {
    .creation-brief-card {
      padding: 1rem;
    }
  }

  .creation-brief-thumbnail {
    flex-shrink: 0;
  }

  .creation-brief-thumb-wrapper {
    width: 6rem;
    height: 6rem;
    border-radius: 1rem;
    overflow: hidden;
    background-color: rgb(241, 245, 249);
  }

  @media (min-width: 640px) {
    .creation-brief-thumb-wrapper {
      width: 7rem;
      height: 7rem;
    }
  }

  .creation-brief-thumb-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .creation-brief-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .creation-brief-header {
    margin-bottom: 0.25rem;
  }

  .creation-brief-title {
    font-size: 1.125rem;
    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    font-weight: 600;
    color: rgb(6, 78, 59);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (min-width: 640px) {
    .creation-brief-title {
      font-size: 1.25rem;
    }
  }

  .creation-brief-desc {
    font-size: 0.75rem;
    color: rgb(71, 85, 105);
    line-height: 1.375;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (min-width: 640px) {
    .creation-brief-desc {
      font-size: 0.875rem;
    }
  }

  .creation-brief-meta {
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 0.75rem;
    font-size: 0.75rem;
    color: rgb(51, 65, 85);
  }

  @media (min-width: 640px) {
    .creation-brief-meta {
      font-size: 0.75rem;
    }
  }

  .creation-brief-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .creation-brief-footer {
    margin-top: 0.75rem;
    font-size: 0.65rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgb(148, 163, 184);
  }
`)

export class CreationBrief extends Donut {
  declare public a: {
    creation: Creation
    onClick: (c: Creation) => Promise<void>
  }

  // Private Cash elements for dynamic content
  private heroImg!: Cash
  private title!: Cash
  private desc!: Cash
  private timeMetaIcon!: Cash
  private timeMeta!: Cash
  private tagMetaIcon!: Cash
  private tagMeta!: Cash
  private brandFooter!: Cash

  public init(template: string, props: DonutProps, options: DonutOptions): Cash {
    template = html`
<div class="creation-brief-card">
  <!-- Thumbnail -->
  <div class="creation-brief-thumbnail">
    <div class="creation-brief-thumb-wrapper">
      <img class="creation-hero-img" src="" alt="" />
    </div>
  </div>

  <!-- Text content -->
  <div class="creation-brief-content">
    <!-- Title + tagline -->
    <header class="creation-brief-header">
      <h2 class="creation-brief-title"></h2>
      <p class="creation-brief-desc"></p>
    </header>

    <!-- Meta row -->
    <div class="creation-brief-meta">
      <span class="creation-brief-meta-item">
        <span class="creation-time-meta-icon" aria-hidden="true"></span>
        <span class="creation-time-meta"></span>
      </span>
      <span class="creation-brief-meta-item">
        <span class="creation-ingredient-meta-icon" aria-hidden="true"></span>
        <span class="creation-ingredient-meta"></span>
      </span>
      <span class="creation-brief-meta-item">
        <span class="creation-tag-meta-icon" aria-hidden="true"></span>
        <span class="creation-tag-meta"></span>
      </span>
    </div>

    <!-- Brand line -->
    <footer class="creation-brief-footer"></footer>
  </div>
</div>`

    super.init(template, {
      heroImg: ".creation-hero-img",
      title: ".creation-brief-title",
      desc: ".creation-brief-desc",
      timeMetaIcon: ".creation-time-meta-icon",
      timeMeta: ".creation-time-meta",
      tagMetaIcon: ".creation-tag-meta-icon",
      tagMeta: ".creation-tag-meta",
      brandFooter: ".creation-brief-footer"
    }, options)

    // bind handlers
    this.dobs.on('click', async () => {
      if (this.a.onClick) {
        await this.a.onClick(this.a.creation)
      }
    })

    return this.dobs
  }

  async play(creation: Creation) {
    this.a.creation = creation
    this.render()
  }

  render() {
    if (!this.a.creation) return

    // Populate all dynamic content from this.a.creation
    this.title.text(this.a.creation.title)
    this.desc.text(this.a.creation.desc)
    this.heroImg.attr('src', this.a.creation.heroImg)
    this.heroImg.attr('alt', this.a.creation.title)

    // Meta information (these would ideally come from creation metadata)
    // For now, using placeholder values - you can extend Creation schema to include these
    this.timeMetaIcon.text('⏱')
    this.timeMeta.text(this.a.creation.time)

    this.tagMetaIcon.text('🌿')
    this.tagMeta.text(this.a.creation.tags?.join(' '))

    this.brandFooter.text('FarmGoods Market')
  }
}