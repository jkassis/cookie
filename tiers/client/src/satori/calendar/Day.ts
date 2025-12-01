// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { DateTime } from '@jkassis/luxon'
import { Donut, DonutProps, DonutOptions } from '../Donut.js'

export class Day extends Donut {
  declare public a: {
    onClick: (day: Day) => Promise<void>
  }

  public dateNumber!: Cash
  public dayMs?: number
  public dayOfWeek!: Cash
  public selected: boolean = false
  public week!: Cash
  public weekStrings: string[]

  constructor() {
    super()
    this.weekStrings = [
      'This Week',
      'Next Week',
      'Week After Next',
      'Three Weeks From Now',
      'Four Weeks From Now',
      'Five Weeks From Now',
      'Six Weeks From Now',
      'Seven Weeks From Now',
      'Eight Weeks From Now',
      'Nine Weeks From Now',
      'Ten Weeks From Now',
      'Eleven Weeks From Now',
      'Twelve Weeks From Now'
    ]
  }

  init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    var Template = `<div class="day">
    <div class="square">
        <div class="date">
            <div class="dayOfWeek">Mo</div>
            <div class="number"></div>
        </div>
        <div class="week"></div>
    </div>
</div>
`
    super.init(template || Template, Object.assign({
      dayOfWeek: '.square .date .dayOfWeek',
      dateNumber: '.square .date .number',
      week: '.square .week'
    }, props), options)

    this.dobs.on('click touch', () => this.a.onClick(this))
    return this.dobs
  }

  public render() {
    if (!this.dayMs) return

    var datetime = DateTime.fromMillis(this.dayMs)
    var week = datetime.weekNumber
    var thisWeek = DateTime.fromMillis(Date.now()).weekNumber
    var weekDelta = week < thisWeek ? week + 52 - thisWeek : week - thisWeek
    var weekString = this.weekStrings[weekDelta] || ''
    this.dayOfWeek.text(datetime.toFormat('dddd'))
    this.dateNumber.text(`${datetime.toFormat('MMMM DD')}`)
    this.week.text(weekString)
  }
}
var deps = []
//# sourceMappingURL=Day.js.map
