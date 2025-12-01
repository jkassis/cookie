// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { CheckIO } from './CheckIO.js'
import { Donut, DonutProps, DonutOptions, html } from '../Donut.js'
import { msPer } from '../Const.js'

export declare interface TimeWindowFixed {
  durationMs: number
  startMs: number
}

var StartMSToStandardWindowKey: Record<number, string> = {}
StartMSToStandardWindowKey[(8 * msPer.hour)] = 'eightATenA'
StartMSToStandardWindowKey[(9 * msPer.hour)] = 'nineATwelveP'
StartMSToStandardWindowKey[(12 * msPer.hour)] = 'twelvePOneP'
StartMSToStandardWindowKey[(13 * msPer.hour)] = 'onePFourP'
StartMSToStandardWindowKey[(16 * msPer.hour)] = 'fourPSixP'
StartMSToStandardWindowKey[(18 * msPer.hour)] = 'sixPNineP'

export function TimeWindowsIntersection(aOffsetMs: number, a: TimeWindowFixed[], b: TimeWindowFixed[]): TimeWindowFixed[] {
  var intersection: TimeWindowFixed[] = []
  for (var aWindow of a) {
    for (var bWindow of b) {
      if (TimeWindowsOverlap(aOffsetMs, aWindow, bWindow))
        intersection.push({ startMs: aWindow.startMs, durationMs: aWindow.durationMs })
    }
  }

  return intersection
}

export function TimeWindowsOverlap(aOffsetMs: number, a: TimeWindowFixed, b: TimeWindowFixed) {
  var aStartMs = a.startMs + aOffsetMs
  var aEndMs = aStartMs + a.durationMs

  var bStartMs = b.startMs
  var bEndMs = bStartMs + b.durationMs

  if (bEndMs <= aStartMs || bStartMs >= aEndMs)
    return false

  return true
}

export class TimeWindowsIO extends Donut {
  public static StandardWindows: { [k: string]: TimeWindowFixed } = {
    eightATenA: {
      startMs: 8 * msPer.hour,
      durationMs: 2 * msPer.hour,
    },
    nineATwelveP: {
      startMs: 9 * msPer.hour,
      durationMs: 3 * msPer.hour,
    },
    twelvePOneP: {
      startMs: 12 * msPer.hour,
      durationMs: 1 * msPer.hour,
    },
    onePFourP: {
      startMs: 13 * msPer.hour,
      durationMs: 3 * msPer.hour,
    },
    fourPSixP: {
      startMs: 16 * msPer.hour,
      durationMs: 2 * msPer.hour,
    },
    sixPNineP: {
      startMs: 18 * msPer.hour,
      durationMs: 3 * msPer.hour,
    }
  }

  declare public a: {
    onChange: () => Promise<void>
  }

  public eightATenAIO!: CheckIO
  public fourPSixPIO!: CheckIO
  public nineATwelvePIO!: CheckIO
  public onePFourPIO!: CheckIO
  public sixPNinePIO!: CheckIO
  public twelvePOnePIO!: CheckIO
  public value: TimeWindowFixed[] = []

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`
<div class='timeWindows IO'>
  <div class="eightATenA IO on">
    <div class="copy">9a-12p</div>
  </div>
  <div class="nineATwelveP IO on">
    <div class="copy">9a-12p</div>
  </div>
  <div class="twelvePOneP IO on">
    <div class="copy">12p-1p</div>
  </div>
  <div class="onePFourP IO on">
    <div class="copy">1p-4p</div>
  </div>
  <div class="fourPSixP IO on">
    <div class="copy">4p-6p</div>
  </div>
  <div class="sixPNineP IO on">
    <div class="copy">6p-9p</div>
  </div>
</div>
				`

    super.init(template, {
      eightATenAIO: ['.eightATenA.IO', CheckIO],
      nineATwelvePIO: ['.nineATwelveP.IO', CheckIO],
      twelvePOnePIO: ['.twelvePOneP.IO', CheckIO],
      onePFourPIO: ['.onePFourP.IO', CheckIO],
      fourPSixPIO: ['.fourPSixP.IO', CheckIO],
      sixPNinePIO: ['.sixPNineP.IO', CheckIO]
    }, options)

    // bind handlers
    this.eightATenAIO.aSet({
      onChange: async () => this.toggle('eightATenA'),
      label: '8a-10a'
    })
    this.nineATwelvePIO.aSet({
      onChange: async () => this.toggle('nineATwelveP'),
      label: '9a-12p'
    })
    this.twelvePOnePIO.aSet({
      onChange: async () => this.toggle('twelvePOneP'),
      label: '12p-1p'
    })
    this.onePFourPIO.aSet({
      onChange: async () => this.toggle('onePFourP'),
      label: '1p-4p'
    })
    this.fourPSixPIO.aSet({
      onChange: async () => this.toggle('fourPSixP'),
      label: '4p-6p'
    })
    this.sixPNinePIO.aSet({
      onChange: async () => this.toggle('sixPNineP'),
      label: '6p-9p'
    })

    return this.dobs
  }

  public async isValid() {
    return true
  }

  public toggle(id: string) {
    var hasThis = this.value.find(timeWindow => timeWindow.startMs == TimeWindowsIO.StandardWindows[id].startMs)
    if (hasThis) {
      var index = this.value.findIndex(timeWindow => timeWindow.startMs == TimeWindowsIO.StandardWindows[id].startMs)
      this.value.splice(index, 1)
    }
    else
      this.value.push(TimeWindowsIO.StandardWindows[id])
    this.a.onChange()
  }

  public valueSet(value: TimeWindowFixed[]) {
    // Do nothing if we got nothing.
    if (!value) return
    this.value = value

    this.eightATenAIO.valueSet(false)
    this.nineATwelvePIO.valueSet(false)
    this.twelvePOnePIO.valueSet(false)
    this.onePFourPIO.valueSet(false)
    this.fourPSixPIO.valueSet(false)
    this.sixPNinePIO.valueSet(false)

    // Transfer values to CheckIOs
    for (var window of this.value) {
      var id = StartMSToStandardWindowKey[window.startMs]

      if (id == 'eightATenA')
        this.eightATenAIO.valueSet(true)
      if (id == 'nineATwelveP')
        this.nineATwelvePIO.valueSet(true)
      if (id == 'twelvePOneP')
        this.twelvePOnePIO.valueSet(true)
      if (id == 'onePFourP')
        this.onePFourPIO.valueSet(true)
      if (id == 'fourPSixP')
        this.fourPSixPIO.valueSet(true)
      if (id == 'sixPNineP')
        this.sixPNinePIO.valueSet(true)

      else
        throw new Error(`bad time window id '${id}'`)

    }
  }
}
