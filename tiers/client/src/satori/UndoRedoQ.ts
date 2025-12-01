import { Tx, Syncer } from './Mach.js'

export interface ReversibleTx extends Tx {
  inv: boolean
}

export class UndoRedoQ<T, Tx extends ReversibleTx> {
  private Q: Tx[]
  private QIdx: number = -1
  public machSyncer: Syncer<T, Tx>

  constructor(machSyncer: Syncer<T, Tx>) {
    this.Q = []
    this.machSyncer = machSyncer
  }

  public Do(tx: Tx): void {
    this.machSyncer.Propose(tx)
  }

  public Queue(tx: Tx): void {
    this.machSyncer.Propose(tx)
    this.Q.splice(this.QIdx + 1)
    this.Q.push(tx)
    this.QIdx++
  }

  public NextTx(): Tx | undefined {
    if (!this.Q.length) return undefined
    if (this.QIdx >= this.Q.length - 1) return
    this.QIdx++
    let tx = this.Q[this.QIdx]
    return tx
  }

  public PrevTx(): Tx | undefined {
    if (this.QIdx == -1) return undefined
    let tx: Tx = JSON.parse(JSON.stringify(this.Q[this.QIdx]))
    tx.inv = true
    this.QIdx--
    return tx
  }

}
