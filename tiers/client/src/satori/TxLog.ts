import { Tx } from './Mach.js'

// TXLogImpl provides list operations that update the internal indecies of members
// This could be optimized with some other underlying structure
export class TxLog<TxT extends Tx> {
  firstTxIdx: number = 0;
  txs: Array<TxT> = [];

  // Delete splices a tx out of the sequence
  Delete(tx: TxT): void {
    // get the index
    const idx = this.txs.findIndex(t => t.i === tx.i)
    if (idx == -1)
      throw new Error('txn does not exist')

    // splice it out and update indecies
    this.txs.splice(idx, 1)
    for (let i = idx; i < this.txs.length; i++) {
      this.txs[i].n!--
    }
  }

  // Inserts a tx
  Insert(tx: TxT): TxT[] {
    if (!tx.n) throw new Error("tx needs a sequence number to insert")
    const idx = tx.n - this.firstTxIdx
    this.txs.splice(idx, 0, tx)
    for (let i = idx + 1; i < this.txs.length; i++) {
      this.txs[i].n!++
    }

    return this.txs.slice(idx + 1)
  }

  // Pop takes on off the end... no reordering
  Pop(): TxT | undefined {
    return this.txs.pop()
  }

  // PruneFinalized removes all finalized TXs
  PruneFinalized(): void {
    for (let i = 0; i < this.txs.length; i++) {
      if (this.txs[i].fin) {
        this.Shift()
      } else {
        break
      }
    }
  }

  // Push adds a Tx to the end
  Push(tx: TxT): void {
    tx.n = this.firstTxIdx + this.txs.length
    this.txs.push(tx)
  }

  // Reset clears all Txs and resets the base index
  Reset() {
    this.firstTxIdx = 0
    this.txs = []
  }

  // FirstTxIdxSet
  FirstIdxSet(seqNumNext: number): number {
    return this.firstTxIdx = seqNumNext
  }

  // FirstTxIdxGet
  FirstTxIdxGet(): number {
    return this.firstTxIdx + this.txs.length
  }

  // Shift removes a tx from the front of the list
  Shift(): TxT | undefined {
    if (this.txs.length == 0) return
    const tx = this.txs.shift()
    this.firstTxIdx++
    return tx
  }

  // TXGetByIdx gets by overall index, not the idx in the list
  TXGetByIdx(idx: number): TxT | undefined {
    const index = idx - this.firstTxIdx
    return this.txs[index]
  }

  // TXGetById
  TXGetById(id: string): TxT | undefined {
    return this.txs.find(tx => tx.i === id)
  }

  // Unshift adds a tx to the front of the list
  Unshift(tx: TxT): number {
    this.firstTxIdx--
    tx.n = this.firstTxIdx
    this.txs.unshift(tx)
    return this.firstTxIdx
  }
}
