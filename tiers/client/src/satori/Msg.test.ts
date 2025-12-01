import { describe, it, beforeEach } from 'mocha'
import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

var { expect } = chai

import {
  Msg,
  Client,
} from './Msg.js'

var wsDialOptions = {
  rejectUnauthorized: false, // Important: This disables certificate validation
}

export interface Echo extends Msg<any> {
  Type: "echo"
  Data: {
    message: string
  }
}

var subprotocols = ['myapp-v1', 'json']

describe('chat service', async () => {
  let timeoutMs: number = 200000

  it('should succeed', async () => {
    expect('aa').to.equal('aa')
  })

  // it('should fail', async () => {
  //   expect('aa').to.equal('bb')
  // })

  it.only('should dial, join, sync, drop, and reset', async () => {
    const RoomSpec = "echo:testRoom"
    const msg = {
      ToID: [RoomSpec],
      Type: "echo",
      Data: {
        message: "Hello"
      }
    } as Echo

    let bob = new Client()
    await bob.WSDial(`ws://localhost:11000/api/v1/ws`, subprotocols, wsDialOptions)

    // expect JoinReq on RoomSync
    var syncRes = await bob.RoomSync(RoomSpec, timeoutMs)
    expect(syncRes.Type).to.equal('rjq')

    // expect JoinReq on RoomSend
    var sendRes = await bob.RoomSend<Msg<null>>(msg)
    expect(sendRes.Type).to.equal('rjq')

    // expect RoomJoin
    var joinRes = await bob.RoomJoin(RoomSpec, timeoutMs)
    expect(joinRes.ToID[0]).to.equal(bob.id)
    expect(joinRes.FromID).to.equal(RoomSpec)
    expect(joinRes.Type).to.equal('rja')

    // expect SyncReq on RoomSend
    var sendRes = await bob.RoomSend<Msg<null>>(msg)
    expect(sendRes.Type).to.equal('rsq')

    // expect RoomSync
    var syncRes = await bob.RoomSync(RoomSpec, timeoutMs)
    expect(syncRes.FromID).to.equal(RoomSpec)
    expect(syncRes.Type).to.equal('rsa')

    // expect RoomSend
    var echo = bob.MsgNextOfTypePromise<Echo>("echo", timeoutMs).then(m => {
      expect(m.Data.message).to.equal("Hello echo")
    })
    var sendRes = await bob.RoomSend<Msg<null>>(msg)
    expect(sendRes.Type).to.equal('ra')

    await echo

    // expect Drop
    await bob.WSDrop()

    // reconnect to a different server
    await bob.WSDial(`ws://localhost:11001/api/v1/ws`, subprotocols, wsDialOptions)

    // expect JoinReq on RoomSync
    var syncRes = await bob.RoomSync(RoomSpec, timeoutMs)
    expect(syncRes.Type).to.equal('rjq')

    // expect JoinReq on RoomSend
    var sendRes = await bob.RoomSend<Msg<null>>(msg)
    expect(sendRes.Type).to.equal('rjq')

    // expect RoomJoin
    var joinRes = await bob.RoomJoin(RoomSpec, timeoutMs)
    expect(joinRes.ToID[0]).to.equal(bob.id)
    expect(joinRes.FromID).to.equal(RoomSpec)
    expect(joinRes.Type).to.equal('rja')

    // expect SyncReq on RoomSend
    var sendRes = await bob.RoomSend<Msg<null>>(msg)
    expect(sendRes.Type).to.equal('rsq')

    // alice should get the same treatment with bob in the room
    let alice = new Client()

    // reconnect to a different server
    await alice.WSDial(`ws://localhost:11000/api/v1/ws`, subprotocols, wsDialOptions)

    // expect JoinReq on RoomSync
    var syncRes = await alice.RoomSync(RoomSpec, timeoutMs)
    expect(syncRes.Type).to.equal('rjq')

    // expect JoinReq on RoomSend
    var sendReq = await alice.RoomSend<Msg<null>>(msg)
    expect(sendReq.Type).to.equal('rjq')

    // expect RoomJoin
    var joinRes = await alice.RoomJoin(RoomSpec, timeoutMs)
    expect(joinRes.ToID[0]).to.equal(alice.id)
    expect(joinRes.FromID).to.equal(RoomSpec)
    expect(joinRes.Type).to.equal('rja')

    // expect SyncReq on RoomSend
    var sendRes = await alice.RoomSend<Msg<null>>(msg)
    expect(sendRes.Type).to.equal('rsq')
  })

  it.only('should send room messages to/from syncd parties', async () => {
    const RoomSpec = "echo:testRoom"

    let bob = new Client()
    await bob.WSDial(`ws://localhost:11000/api/v1/ws`, subprotocols, wsDialOptions)
    await bob.RoomJoin(RoomSpec, timeoutMs)
    await bob.RoomSync(RoomSpec, timeoutMs)

    let alice = new Client()
    await alice.WSDial(`ws://localhost:11001/api/v1/ws`, subprotocols, wsDialOptions)
    await alice.RoomJoin(RoomSpec, timeoutMs)
    await alice.RoomSync(RoomSpec, timeoutMs)

    let charlie = new Client()
    await charlie.WSDial(`ws://localhost:11000/api/v1/ws`, subprotocols, wsDialOptions)

    // expect joinReq on RoomSync
    var syncRes = await charlie.RoomSync(RoomSpec, timeoutMs)
    expect(syncRes.Type).to.equal('rjq')

    var msg = {
      ToID: [RoomSpec],
      Type: "echo",
      Data: {
        message: "Hello"
      }
    } as Echo

    // expect joinReq on RoomSend
    var joinRes = await charlie.RoomSend(msg, timeoutMs)
    expect(joinRes.Type).to.equal('rjq')

    // now alice and bob should get messages
    var aliceEcho = alice.MsgNextOfTypePromise<Echo>("echo", timeoutMs).
      then(m => {
        expect(m.Data.message).to.equal("Hello echo")
      })

    var bobEcho = bob.MsgNextOfTypePromise<Echo>("echo", timeoutMs).
      then(m => {
        expect(m.Data.message).to.equal("Hello echo")
      })

    alice.RoomSend<Echo>(msg)

    await aliceEcho
    await bobEcho

    await alice.RoomLeave(RoomSpec, timeoutMs)
    await bob.RoomLeave(RoomSpec, timeoutMs)
    await charlie.RoomLeave(RoomSpec, timeoutMs)

    console.log("success")
  })

  it('echo for bob, alice, and charlie', async () => {
    const RoomSpec = "echo:testRoom"

    let bob = new Client()
    await bob.WSDial(`ws://localhost:11000/api/v1/ws`, subprotocols, wsDialOptions)
    await bob.RoomJoin(RoomSpec, timeoutMs)
    var syncRes = await bob.RoomSync(RoomSpec, timeoutMs)

    let alice = new Client()
    await alice.WSDial(`ws://localhost:11001/api/v1/ws`, subprotocols, wsDialOptions)
    await alice.RoomJoin(RoomSpec, timeoutMs)
    var syncRes = await alice.RoomSync(RoomSpec, timeoutMs)

    let charlie = new Client()
    await charlie.WSDial(`ws://localhost:11000/api/v1/ws`, subprotocols, wsDialOptions)
    await charlie.RoomJoin(RoomSpec, timeoutMs)
    var syncRes = await charlie.RoomSync(RoomSpec, timeoutMs)
    expect(syncRes.FromID).to.equal(RoomSpec)
    expect(syncRes.Type).to.equal('rsa')

    var aliceEcho = alice.MsgNextPromise<Echo>(timeoutMs).
      then(m => {
        expect(m.Data.message).to.equal("Hello echo")
      })

    var bobEcho = bob.MsgNextPromise<Echo>(timeoutMs).
      then(m => {
        expect(m.Data.message).to.equal("Hello echo")
      })

    var charlieEcho = charlie.MsgNextPromise<Echo>(timeoutMs).
      then(m => {
        expect(m.Data.message).to.equal("Hello echo")
      })

    const m: Echo = {
      ToID: [RoomSpec],
      Type: "echo",
      Data: {
        message: "Hello"
      }
    }

    alice.RoomSend<Echo>({
      ToID: [RoomSpec],
      Type: "echo",
      Data: {
        message: "Hello"
      }
    } as Echo)

    await aliceEcho
    await bobEcho
    await charlieEcho

    await alice.RoomLeave(RoomSpec, timeoutMs)
    await bob.RoomLeave(RoomSpec, timeoutMs)
    await charlie.RoomLeave(RoomSpec, timeoutMs)

    console.log("success")
  })

  it('should sync tmapp for bob and alice', async () => {
    const RoomSpec = "tmapp:test"

    // bob will dial and sync
    let bob = new Client()
    await bob.WSDial(`ws://localhost:11000/api/v1/ws`, subprotocols, wsDialOptions)
    await bob.RoomJoin(RoomSpec, timeoutMs)
    var syncRes = await bob.RoomSync(RoomSpec, timeoutMs)




    let alice = new Client()
    await alice.WSDial(`ws://localhost:11001/api/v1/ws`, subprotocols, wsDialOptions)
    await alice.RoomJoin(RoomSpec, timeoutMs)
    var syncRes = await alice.RoomSync(RoomSpec, timeoutMs)

    let charlie = new Client()
    await charlie.WSDial(`ws://localhost:11000/api/v1/ws`, subprotocols, wsDialOptions)
    await charlie.RoomJoin(RoomSpec, timeoutMs)
    var syncRes = await charlie.RoomSync(RoomSpec, timeoutMs)
    expect(syncRes.FromID).to.equal(RoomSpec)
    expect(syncRes.Type).to.equal('rsa')

    var aliceEcho = alice.MsgNextPromise<Echo>(timeoutMs).
      then(m => {
        expect(m.Data.message).to.equal("Hello echo")
      })

    var bobEcho = bob.MsgNextPromise<Echo>(timeoutMs).
      then(m => {
        expect(m.Data.message).to.equal("Hello echo")
      })

    var charlieEcho = charlie.MsgNextPromise<Echo>(timeoutMs).
      then(m => {
        expect(m.Data.message).to.equal("Hello echo")
      })

    const m: Echo = {
      ToID: [RoomSpec],
      Type: "echo",
      Data: {
        message: "Hello"
      }
    }

    alice.RoomSend<Echo>({
      ToID: [RoomSpec],
      Type: "echo",
      Data: {
        message: "Hello"
      }
    } as Echo)

    await aliceEcho
    await bobEcho
    await charlieEcho

    await alice.RoomLeave(RoomSpec, timeoutMs)
    await bob.RoomLeave(RoomSpec, timeoutMs)
    await charlie.RoomLeave(RoomSpec, timeoutMs)

    console.log("success")
  })
})
