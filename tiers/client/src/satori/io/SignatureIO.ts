// Copyright © 2018 by Jeremy Kassis. All Rights Reserved.
import { Cash } from 'cash-dom'
import { Donut, DonutProps, DonutOptions, html } from '../Donut.js'
import SignaturePad, { PointGroup } from 'signature_pad/src/signature_pad.js'

export class SignatureIO extends Donut {
  declare public a: {
    onChange: (opt: string) => Promise<void>
  }

  public canvas!: Cash
  public pad!: SignaturePad

  public capture(): PointGroup[] {
    // Returns true if canvas is empty, otherwise returns false
    // this.pad.isEmpty()
    return this.pad.toData()
  }

  public clear() {
    // Clears the canvas
    this.pad.clear()
  }

  public init(template?: string, props?: DonutProps, options?: DonutOptions): Cash {
    template = html`
<div class='signatureIO IO'>
  <canvas class='pad'></canvas>
</div>`

    super.init(template, {
      canvas: '.pad'
    }, options)

    var canvas = this.canvas.get(0) as HTMLCanvasElement
    this.pad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255,255,255)',
      penColor: 'rgb(0,0,0)'
    })

    window.addEventListener('resize', () => this.resize())
    setTimeout(() => this.resize(), 10)
    return this.dobs
  }

  public isValid() {
  }

  public play() {
  }

  public resize() {
    var canvas = this.canvas.get(0) as HTMLCanvasElement
    // var ratio = Math.max(window.devicePixelRatio || 1, 1)
    var dob = this.dobs.get(0)!
    canvas.width = dob.clientWidth
    canvas.height = dob.clientHeight
    // canvas.getContext("2d").scale(ratio, ratio)
    this.pad.clear()
  }

  public async valueIsValidAndFinal() {
  }

  public valueSet(value: any) {
  }
}
