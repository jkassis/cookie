// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { DonutProps, DonutOptions, Donut, html } from './Donut.js'
import { List, ParameterizedDocDonut } from './List.js'
import { Reroute } from './Router.js'
import { TextSearchIO } from './io/TextSearchIO.js'

declare interface SelectableDocDonut<T> extends ParameterizedDocDonut<T> {
  a: {
    isSelected: (donut: ParameterizedDocDonut<T>) => boolean
  }
}

declare interface Updater<J> {
  playing: boolean
  doIt(docs: J[]): void
  stop(): void
}

export abstract class PickerScreen<J extends SelectableDocDonut<K>, JP extends Record<string, any>, K> extends Donut {
  private query?: string
  private resultsSummary!: Cash

  protected actionButton!: Cash
  protected actionButtonEnable: boolean = true
  protected actionButtonText: string = "Change Me"
  protected helpButton!: Cash
  protected resultList!: List<J, JP, K>
  protected resultsSummaryFoundInitialMessage: string = 'enter a search query.'
  protected resultsSummaryFoundNothingMessageRender: string = '...no results to show.'
  protected resultsSummaryFoundSomethingMessageRender: boolean = true
  protected resultsTitle!: Cash
  protected resultsTitleText!: string
  protected searchEnable: boolean = true
  protected searchIO!: TextSearchIO
  protected searchOnEmptyQuery: boolean = false
  protected selectedDocs: K[] = []
  protected updater?: Updater<K>

  declare public a: {}

  public actionButtonTouchPlay(e: Event) {
    this.evtStop(e)
    this.actionButton.animateCss('bounceIn')
  }

  public docSelected(d: K): boolean {
    var docKey = this.itemDocKeyGet(d)
    for (var selectedDoc of this.selectedDocs) {
      if (docKey == this.itemDocKeyGet(selectedDoc)) {
        console.log('doc selected')
        return true
      }
    }
    return false
  }

  public donutSelected(d: SelectableDocDonut<K>): boolean {
    return this.docSelected(this.itemDonutDocGet(d))
  }

  public helpPlay(e?: Event, delayMs?: number) {
    if (e) this.evtStop(e)
  }

  public async hydrate(): Promise<void> {
    // Override me
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`
<div class='picker screen'>
  <div class='headroom'></div>

  <div class='headerHook'></div>

  <div class='searchPanel padded-box'>
    <div class='search IO'></div>
  </div>

  <div class='pane padded-box'>
    <div class='results'>
      <div class='h3'>
        <div class='title'>Data Type</div>
        <div class='button'><span>Make a Merchant</span></div>
        <div class='help'>
          <div class='copy'>?</div>
        </div>
      </div>
      <div class='summary'>Result Summary</div>
      <div class='result list'></div>
    </div>
  </div>
  <div class='footer'>
    <div class='base'></div>
  </div>
</div>`

    super.init(template, {
      actionButton: '.h3 .button',
      helpButton: '.help',
      resultList: ['.result.list', List],
      resultsSummary: '.results .summary',
      resultsTitle: '.results .h3 .title',
      searchIO: ['.search.IO', TextSearchIO],
      searchPanel: '.searchPanel'
    }, options)

    this.helpButton.on('click touch', e => this.helpPlay(e, 1))
    this.searchIO.aSet({
      onChange: () => this.search(),
      placeholder: '',
      submitAuto: false,
      submitButtonRender: true,
    })
    this.resultList.a
    this.resultsTitle.html(`${this.resultsTitleText}`)
    this.actionButton.html(this.actionButtonText)
    this.actionButton.on('click touch', e => this.actionButtonTouchPlay(e))

    return this.dobs
  }

  public itemDonutDeselect(d: SelectableDocDonut<K>, searchKey?: string) {
    if (!d) d = this.resultList.itemDonuts.find(donut => this.itemDonutDocKeyGet(donut) == searchKey) as SelectableDocDonut<K>
    if (!d) return

    // splice out the doc
    searchKey = this.itemDonutDocKeyGet(d)
    var index = this.selectedDocs.findIndex(selectedDoc => this.itemDocKeyGet(selectedDoc) == searchKey)
    if (index >= 0) this.selectedDocs.splice(index, 1)

    // rerender
    d.render()
  }

  public itemDonutDocKeyGet(d: SelectableDocDonut<K>): string {
    return this.itemDocKeyGet(this.itemDonutDocGet(d))
  }

  public async itemDonutOnClick(d: SelectableDocDonut<K>) {
    if (this.donutSelected(d)) {
      // implement server call here
      this.itemDonutDeselect(d)
    } else {
      // implement server call here
      this.itemDonutSelect(d)
    }
  }

  public itemDonutSelect(d: SelectableDocDonut<K>, key?: string) {
    if (!d) d = this.resultList.itemDonuts.find(donut => this.itemDonutDocKeyGet(donut) == key) as SelectableDocDonut<K>
    if (!d) return

    this.selectedDocs.push(this.itemDonutDocGet(d))
    d.render()
  }

  public nextUpdater() {
    let updater: Updater<K> = {
      playing: true,
      stop: () => {
        if (!updater.playing) return
        updater.playing = false
      },
      doIt: docs => {
        if (!updater.playing) return
        updater.playing = false

        this.resultList.a.docs = docs
        this.render()
      }
    }
    this.updater = updater
  }

  public async play(a: any) {
    this.a = a
    await this.hydrate()
    this.query = undefined
    this.resultsSummary.html(this.resultsSummaryFoundInitialMessage)
    this.searchIO.valueSet('')
    this.actionButton.showIf(this.actionButtonEnable)
    this.helpPlay()
  }

  public playBwd(a: any): Promise<void> { return this.play(a) }

  public playBwdOK(a: any): Promise<Reroute | void> { return Promise.resolve() }

  public playFwd(a: any): Promise<void> { return this.play(a) }

  public playFwdOK(a: any): Promise<Reroute | void> { return Promise.resolve() }

  public render() {
    // this.searchPanel.css('display', this.searchDisable ? 'none' : '')
    this.searchIO.css('display', this.searchEnable ? '' : 'none')
    // this.resultsSummary.css('display', this.searchDisable ? 'none' : '')
    this.resultList.render()

    // update summary
    this.resultsSummary.show()
    var docs = this.resultList.a.docs
    var numResults = docs ? docs.length : 0
    if (numResults >= 1) {
      if (this.resultsSummaryFoundSomethingMessageRender) {
        if (numResults == 1) this.resultsSummary.html(`Found ${numResults}`)
        else if (numResults) this.resultsSummary.html(`Found ${numResults}`)
      } else {
        this.resultsSummary.hide()
      }
    }
    else this.resultsSummary.html(this.resultsSummaryFoundNothingMessageRender)
  }

  public async search(searchOnDuplicateQuery = false) {
    var query = this.searchIO.valueIO.value || ''
    if (!query && !this.searchOnEmptyQuery) return
    if (!searchOnDuplicateQuery && this.query == query) return

    this.query = query || ''
    if (this.updater) {
      this.updater.stop()
      delete this.updater
    }

    this.nextUpdater()

    var docs = await this.searchResultsGet(query)
    if (this.updater !== undefined) {
      // if search is called repeatedly, this needs to be checked
      let updater: Updater<K> = this.updater
      updater.doIt(docs)
    }
    delete this.updater
  }

  public async stopBwd(): Promise<void> { }

  public async stopBwdOK(): Promise<Reroute | void> { return Promise.resolve() }

  public async stopFwd(): Promise<void> { }

  public async stopFwdOK(): Promise<Reroute | void> { return Promise.resolve() }

  public titleGet(): string {
    return 'Picker'
  }

  public abstract itemDocKeyGet(d: K): string
  public abstract itemDonutDocGet(d: SelectableDocDonut<K>): K
  public abstract searchResultsGet(query: string): Promise<K[]>
}
