import WebSocket from 'isomorphic-ws'
import { Util } from './Util.js'


// Msg basics
export interface Msg<T extends any> {
  ID?: string
  FromID?: string
  ReqID?: string
  ToID: string[]
  Type: string
  Data: T
}

export type MsgHandler<T extends Msg<any>> = (m: T) => void

// Room Messages
export interface RoomJoinReq extends Msg<null> {
  Type: 'rjq'
}

export interface RoomJoinRes extends Msg<null> {
  Type: 'rja'
}

export interface RoomLeaveReq extends Msg<null> {
  Type: 'rlq'
}

export interface RoomLeaveRes extends Msg<null> {
  Type: 'rla'
}

export interface RoomSyncReq<State extends any> extends Msg<State> {
  Type: 'rsq'
  Data: State
}

export interface RoomSyncRes<State extends any> extends Msg<State> {
  Type: 'rsa'
  Data: State
}

// Client
export class Client {
  public id: string

  private connected: boolean = false
  private msgTypeHandlers: Map<string, MsgHandler<any>>
  private msgResHandlers: Map<string, MsgHandler<any>>
  private msgNextHandlers: MsgHandler<any>[]
  private msgNextOfTypeHandlers: Record<Msg<any>['Type'], MsgHandler<any>>
  private ws: WebSocket
  private wsUrl?: string

  constructor() {
    this.id = Util.UUID()
    this.msgResHandlers = new Map<string, MsgHandler<any>>
    this.msgTypeHandlers = new Map<string, MsgHandler<any>>
    this.msgNextOfTypeHandlers = {} as Record<Msg<any>['Type'], MsgHandler<any>>
    this.msgNextHandlers = []
  }

  // MsgNextPromise just promises the next message. Mostly useful for testing.
  public MsgNextPromise<T extends Msg<any>>(timeoutMs: number = 2000): Promise<T> {
    return new Promise((resolve, reject) => {
      var handler = (res: T) => {
        this.msgNextHandlers = this.msgNextHandlers.filter(h => h !== handler)
        clearTimeout(timeout)
        resolve(res)
      }

      this.msgNextHandlers.push(handler)

      const timeout = setTimeout(() => {
        this.msgNextHandlers = this.msgNextHandlers.filter(h => h !== handler)
        reject(new Error('Response timed out'))
      }, timeoutMs)
    })
  }

  // MsgNextOfTypePromise just promises the next message. Mostly useful for testing.
  public MsgNextOfTypePromise<T extends Msg<any>>(type: T['Type'], timeoutMs: number = 2000): Promise<T> {
    return new Promise((resolve, reject) => {
      var handler = (res: T) => {
        delete this.msgNextOfTypeHandlers[type]
        clearTimeout(timeout)
        resolve(res)
      }

      this.msgNextOfTypeHandlers[type] = handler

      const timeout = setTimeout(() => {
        delete this.msgNextOfTypeHandlers[type]
        reject(new Error('Response timed out'))
      }, timeoutMs)
    })
  }

  // MsgResPromise promises the response to a given request. Used internally and externally.
  public MsgResPromise<T extends Msg<any>>(reqID: string, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      var handler = (res: T) => {
        this.msgResHandlers.delete(reqID)
        clearTimeout(timeout)
        resolve(res)
      }

      this.msgResHandlers.set(reqID, handler)

      const timeout = setTimeout(() => {
        this.msgResHandlers.delete(reqID)
        reject(new Error('Response timed out'))
      }, timeoutMs)
    })
  }

  public MsgTypeHandlerAdd<T extends Msg<any>>(type: T['Type'], h: MsgHandler<T>) {
    this.msgTypeHandlers.set(type, h)
  }

  public MsgTypeHandlerDel<T extends Msg<any>>(type: string, h: MsgHandler<T>) {
    this.msgTypeHandlers.delete(type)
  }

  // OnMsgEvent parses a websocket event as json and hands off to
  // the "nextMessageHandler" a "responseHandler", if registered,
  // or a "typeHandler"
  public OnMsgEvent(event: WebSocket.MessageEvent) {
    const message: Msg<any> = JSON.parse(event.data as string)
    let resHandler = this.msgResHandlers.get(message.ReqID as string)
    resHandler && resHandler(message)

    let typeHandler = this.msgTypeHandlers.get(message.Type)
    typeHandler && typeHandler(message)

    for (let nextHandler of this.msgNextHandlers) {
      nextHandler(message)
    }

    var nextOfTypeHandler = this.msgNextOfTypeHandlers[message.Type]
    if (nextOfTypeHandler) nextOfTypeHandler(message)
  }

  // RoomJoin joins a room
  public RoomJoin(RoomSpec: string, resTimeoutMs = 2000): Promise<RoomJoinRes> {
    const m: RoomJoinReq = {
      FromID: this.id,
      ToID: [RoomSpec],
      ID: Util.UUID(),
      Type: 'rjq',
      Data: null,
    }
    console.log(`Attempting to join room ${RoomSpec}`)
    return this.RoomSend<RoomJoinRes>(m, resTimeoutMs)
  }

  // RoomLeave leaves a room
  public RoomLeave(RoomSpec: string, resTimeoutMs = 2000): Promise<RoomLeaveRes> {
    const m: RoomLeaveReq = {
      FromID: this.id,
      ID: Util.UUID(),
      ToID: [RoomSpec],
      Type: 'rlq',
      Data: null
    }
    console.log(`Attempting to leave room ${RoomSpec}`)
    return this.RoomSend<RoomLeaveRes>(m, resTimeoutMs)
  }


  // RoomSend sends a message to a room
  public RoomSend<T extends Msg<any>>(m: Msg<any>, timeoutMs: number = 2000): Promise<T> {
    if (!this.connected) throw new Error("not connected")

    m.ID = Util.UUID()
    m.FromID = this.id

    let p: Promise<T> = this.MsgResPromise<T>(m.ID, timeoutMs)
    this.ws.send(JSON.stringify(m))
    return p
  }

  // RoomSync syncs state with a room
  public RoomSync<State extends any>(RoomSpec: string, state: State, resTimeoutMs = 2000): Promise<RoomSyncRes<State>> {
    const m: RoomSyncReq<State> = {
      Data: state,
      FromID: this.id,
      ID: Util.UUID(),
      ToID: [RoomSpec],
      Type: 'rsq',
    }
    console.log(`Attempting to sync with room: ${RoomSpec}`)
    return this.RoomSend<RoomSyncRes<State>>(m, resTimeoutMs)
  }

  // WSDial
  public WSDial<X>(wsUrl: string, subprotocols: string[], options: WebSocket.ClientOptions): Promise<void> {
    // If already connected, return a resolved promise
    if (this.connected) {
      return Promise.resolve()
    }

    this.wsUrl = wsUrl

    // Wrap the connection logic in a Promise
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl + "?partyID=" + this.id, subprotocols, options)

      this.ws.onopen = () => {
        this.connected = true
        console.log("WebSocket connection established.")
        resolve() // Resolve the promise when the connection is established
      }

      this.ws.onerror = (event: WebSocket.ErrorEvent) => {
        // Reject the promise on connection error
        reject(new Error("WebSocket connection failed."))
      }

      this.ws.onmessage = (event: WebSocket.MessageEvent) => this.OnMsgEvent(event)
    })
  }

  // WSDrop
  public WSDrop(): Promise<void> {
    // If not connected, return a resolved promise immediately
    if (!this.connected) {
      return Promise.resolve()
    }

    // Wrap the close operation in a Promise
    return new Promise((resolve, reject) => {
      // Assuming this.ws is of type WebSocket from 'ws' or similar
      this.ws.onclose = () => {
        this.connected = false
        console.log("WebSocket connection closed.")
        resolve() // Resolve the promise when the connection is closed
      }

      // Listen for errors just in case closing fails
      this.ws.onerror = (event: WebSocket.ErrorEvent) => {
        reject(new Error("Error occurred while closing the WebSocket connection."))
      }

      // Initiate closing the connection
      // this.ws.close()
      this.ws.terminate()
    })
  }
}
