// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions } from '../Donut.js'
import { Day } from './Day.js'

export interface DayProvider {
  getN(n: number): number[]
}

export class Calendar extends Donut {
  declare public a: {
    onClick: (calendar: Calendar, day: Day) => Promise<void>
  }

  public dayDonuts!: Day[]
  public dayProvider!: DayProvider
  public numNodes!: number

  constructor() {
    super()
  }

  // TODO change the order of these arguments, queries then templates
  public init(template?: string, properties?: DonutProps, options?: DonutOptions): Cash {
    var Template = '<div class="calendar donut"> </div>'
    super.init(template || Template, properties, options)
    return this.dobs
  }

  public async play() {
    this.dobs.empty()
    this.dayDonuts = []
    var numNodes = this.numNodes
    for (var i = 0; i < numNodes; i++) {
      var donut = this.donutFactory.donutBake(Day)
      donut.a = {
        onClick: (day: Day) => this.a.onClick(this, day)
      }
      this.dayDonuts.push(donut)
      this.dobs.get(0)!.appendChild(donut.dobs.get(0)!)
    }
  }

  public render() {
    var dayProvider = this.dayProvider
    var nodes = dayProvider.getN(this.dayDonuts.length)
    for (var i = 0; i < this.dayDonuts.length; i++) {
      var nodeDonut = this.dayDonuts[i]
      var doc = nodes[i]
      if (doc) {
        nodeDonut.show()
        nodeDonut.dayMs = doc
        if (nodeDonut.selected) {
          nodeDonut.dobs.addClass('selected')
        }
        else {
          nodeDonut.dobs.removeClass('selected')
        }
        nodeDonut.render()
      }
      else {
        nodeDonut.hide()
      }
    }
  }
}
var deps = []
//# sourceMappingURL=Calendar.js.map
