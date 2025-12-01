
export interface Mach<StateT, TxT extends Tx> {
  StateGet(): StateT
  StateSet(state: StateT): void
  TxPlayFWD: (tx: TxT) => void
  TxPlayBWD: (tx: TxT) => void
}

export interface Tx {
  n?: number // sequence number
  i?: string // id is usually uuid
  fin?: boolean // finalized
}


import { TxLog } from './TxLog.js'
import { Util } from './Util.js'
import {
  Client,
  Msg,
  RoomJoinRes,
  RoomLeaveRes,
  RoomSyncReq,
  RoomSyncRes,
} from './Msg.js'

export interface TxProposeReq<TxT extends Tx> extends Msg<TxT> {
  Type: 'rtxp',
}

export interface TxFinalizeReq<TxT extends Tx> extends Msg<TxT> {
  Type: 'rtxf',
}

export class RewindableState<StateT, TxT extends Tx> {
  HeadState!: StateT  // Snap of state at a point in time
  TailTxLogFirstIdx!: number // idx of the first TX the the TXLog
  TailTxLogTxs!: TxT[]     // Txs that come after the snapshot
}

export class Syncer<StateT, TxT extends Tx> {
  private mach: Mach<StateT, TxT>
  private roomID: string | undefined
  private roomJoined: boolean = false
  private syncing: boolean = true
  private txLog: TxLog<TxT>
  private client: Client
  private partyServerWSSURL: string

  constructor(fsm: Mach<StateT, TxT>, wsUrl: string) {
    this.partyServerWSSURL = wsUrl
    this.txLog = new TxLog<TxT>()
    this.mach = fsm

    this.client = new Client()

    this.client.MsgTypeHandlerAdd<RoomJoinRes>(
      'rja',
      m => this.OnRoomJoinRes(m)
    )
    this.client.MsgTypeHandlerAdd<RoomLeaveRes>(
      'rla',
      m => this.OnRoomLeaveRes(m as RoomLeaveRes))

    this.client.MsgTypeHandlerAdd<RoomSyncReq<RewindableState<StateT, TxT>>>(
      'rsq',
      m => this.OnSyncReq(m as RoomSyncReq<RewindableState<StateT, TxT>>))

    this.client.MsgTypeHandlerAdd<RoomSyncRes<StateT>>(
      'rsa',
      m => this.OnSyncRes(m as RoomSyncRes<RewindableState<StateT, TxT>>))

    this.client.MsgTypeHandlerAdd<TxFinalizeReq<TxT>>(
      'rtxf',
      m => this.OnFinalize(m.Data))
  }

  public FSMGet(): Mach<StateT, TxT> {
    return this.mach
  }

  public StateSet(state: RewindableState<StateT, TxT>) {
    this.mach.StateSet(state.HeadState)
    this.txLog.FirstIdxSet(state.TailTxLogFirstIdx)
    this.txLog.txs = state.TailTxLogTxs
  }

  public StateGet(): RewindableState<StateT, TxT> {
    return {
      HeadState: this.mach.StateGet(),
      TailTxLogFirstIdx: this.txLog.FirstTxIdxGet(),
      TailTxLogTxs: this.txLog.txs
    }
  }

  public OnRoomLeaveRes(m: RoomLeaveRes) {
    this.roomJoined = false
    this.roomID = undefined
    console.log(`left room ${m.ToID}`)
  }

  public OnRoomJoinRes(m: RoomJoinRes) {
    this.roomJoined = true
    this.roomID = m.FromID
    console.log(`joined room ${m.ToID}`)
  }

  public OnSyncRes(res: RoomSyncRes<RewindableState<StateT, TxT>>): void {
    this.syncing = false
    this.mach.StateSet(res.Data.HeadState)
    console.log("Synchronization complete.")
  }

  // OnSyncReq returns state to sync partners
  public OnSyncReq(req: RoomSyncReq<RewindableState<StateT, TxT>>): void {
    if (this.roomID == undefined) throw Error("got sync request, but no longer connected to a room")
    const res: RoomSyncRes<RewindableState<StateT, TxT>> = {
      ToID: [this.roomID],
      Type: 'rsa',
      ReqID: req.ID,
      Data: {
        TailTxLogFirstIdx: this.txLog.FirstTxIdxGet(),
        HeadState: this.mach.StateGet(),
        TailTxLogTxs: this.txLog.txs
      }
    }
    this.client.RoomSend(res)
    console.log("Sending synchronization data.")
  }

  public Propose(tx: TxT): void {
    tx.i = Util.UUID()
    tx.fin = false

    // optimistically... do it now and roll it back later
    this.mach.TxPlayFWD(tx)
    this.txLog.Push(tx)

    if (this.roomID != undefined) {
      const m: TxProposeReq<TxT> = {
        ToID: [this.roomID],
        Type: 'rtxp',
        Data: tx,
      }
      this.client.RoomSend<TxProposeReq<TxT>>(m)
    } else {
      this.OnFinalize(tx)
    }
  }

  private OnFinalize(tx: TxT): void {
    const nextSeqNum = this.txLog.FirstTxIdxGet()
    if (tx.n === undefined) {
      throw new Error("OnFinalize: tx.n should be defined")
    } else if (tx.n == nextSeqNum) {
      // the server gave us a new TX and we are in sync
      // apply the tx and move forward
      this.txLog.Push(tx)
      tx.fin = true
      this.mach.TxPlayFWD(tx)

      // clear out finalized txns
      this.txLog.PruneFinalized()
    } else if (tx.n > nextSeqNum) {
      // the server is ahead... we missed a message...
      // we are out of sync and need to resync
      if (this.roomID != null)
        this.client.RoomSync<RewindableState<StateT, TxT>>(this.roomID, {
          HeadState: this.mach.StateGet(),
          TailTxLogFirstIdx: this.txLog.FirstTxIdxGet(),
          TailTxLogTxs: []     // Txs that come after the snapshot
        })
    } else {
      // we are ahead of the server... this happens everytime
      // we submit a TX, because we apply it optimistically

      // look for the tx by seqNum
      const existingTx = this.txLog.TXGetByIdx(tx.n)
      if (existingTx !== undefined)
        if (existingTx.i === tx.i) {
          // got it and it's in order. just finalize.
          existingTx.fin = true
        } else {
          // we have that tx, but we got ahead and now we are
          //out of order... fix it.  insert the new tx
          var tailTxs = this.txLog.Insert(tx)

          // rewind
          var replays: TxT[] = []
          for (var tailTx of tailTxs.reverse()) {
            this.mach.TxPlayBWD(tailTx)
            replays.unshift(tailTx)
          }

          // replay
          this.mach.TxPlayFWD(tx)
          for (var undoneTx of replays)
            this.mach.TxPlayFWD(undoneTx)
        }

      this.txLog.PruneFinalized()
    }
  }

  public async RoomJoin(roomName: string): Promise<void> {
    // await this.commandFlash("could not load that data", "text-red-400 font-bold", 300, 50, 6)
    var timeoutMs = 20000
    var roomSpec = `fsm:${roomName}`
    var subprotocols = ['myapp-v1', 'json']
    await this.client.WSDial(this.partyServerWSSURL, subprotocols, {})
    await this.client.RoomJoin(roomSpec, timeoutMs)
  }
}
