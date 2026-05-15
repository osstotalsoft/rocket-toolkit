import { serDes, SubscriptionOptions } from '../../src'
import rusi from '../../src/transport/rusi'
import { RusiConnection, RusiChannel, RusiSubscription } from '../../src/transport/rusi/types'

jest.mock('@grpc/grpc-js')
jest.mock('@grpc/proto-loader')

import * as protoLoader from '@grpc/proto-loader'
import * as grpcJs from '@grpc/grpc-js'
import { GrpcObject } from '@grpc/grpc-js'

const mockProtoLoader = protoLoader as {
  loadSync: typeof protoLoader.loadSync
}
const mockGrpcJs = grpcJs as {
  loadPackageDefinition: typeof grpcJs.loadPackageDefinition
}

describe('Testing rusi transport', () => {
  let mockRusiClient: any = null
  let mockChannel: RusiChannel | null = null

  beforeEach(() => {
    mockProtoLoader.loadSync = jest.fn(() => ({}))
    //(protoLoader.loadSync as jest.Mock).mockReturnValue({})

    mockChannel = {
      watchConnectivityState: jest.fn(),
      getConnectivityState: jest.fn()
    }

    mockRusiClient = {
      waitForReady: jest.fn((_deadline, callback) => {
        callback()
      }),
      getChannel: jest.fn(() => mockChannel),
      Publish: jest.fn((_req, cb) => {
        setTimeout(cb, 10)
      }),
      Subscribe: jest.fn(_req => ({
        cancel: jest.fn(),
        end: jest.fn(),
        write: jest.fn(),
        on: jest.fn(),
        removeListener: jest.fn()
      })),
      close: jest.fn()
    }

    mockGrpcJs.loadPackageDefinition = jest.fn(
      () =>
        ({
          rusi: {
            proto: {
              runtime: {
                v1: {
                  Rusi: jest.fn(() => mockRusiClient)
                } as unknown
              }
            }
          }
        } as GrpcObject)
    )
  })

  afterEach(async () => {
    await rusi.disconnect()
    jest.resetAllMocks()
    jest.resetModules()
  })

  test('if the proto loader fails', async () => {
    // arrange
    mockProtoLoader.loadSync = jest.fn(() => {
      throw new Error('Loading failed!')
    })

    // act
    await expect(rusi.connect()).rejects.toMatchObject({ message: 'Loading failed!' })

    // assert
    expect(protoLoader.loadSync).toBeCalled()
    expect(grpcJs.loadPackageDefinition).not.toHaveBeenCalled()
  })

  test('connect generates a single connection', async () => {
    // arrange

    // act
    const c3: RusiConnection[] = await Promise.all([rusi.connect(), rusi.connect(), rusi.connect()])
    const c1: RusiConnection = await rusi.connect()
    const c2: RusiConnection = await rusi.connect()

    // assert
    expect(Object.is(c1._rusiClient, c2._rusiClient)).toBeTruthy()
    expect(Object.is(c1._rusiClient, c3[0]._rusiClient)).toBeTruthy()
    expect(Object.is(c1._rusiClient, c3[1]._rusiClient)).toBeTruthy()
    expect(Object.is(c1._rusiClient, c3[2]._rusiClient)).toBeTruthy()
    expect(mockRusiClient.waitForReady).toBeCalledTimes(1)
  })

  test('protoLoader creates the definition used for GRPC package definition', async () => {
    // arrange
    const definition = { fake: {} }
    mockProtoLoader.loadSync = jest.fn(() => definition)

    // act
    await rusi.connect()

    // assert
    expect(grpcJs.loadPackageDefinition).toBeCalledWith(definition)
  })

  test('error thrown while watching connectivity state', async () => {
    // arrange
    if (!mockChannel) fail()

    mockChannel.watchConnectivityState = jest.fn(() => {
      throw new Error('fake error')
    })

    // act - assert
    await expect(rusi.connect()).rejects.toMatchObject({
      code: 'ERR_UNHANDLED_ERROR',
      context: { message: 'The channel has been closed' }
    })
  })

  test('publish opens a connection before calling Publish', async () => {
    // arrange
    const subject = 'subject'
    const envelope = { payload: {}, headers: {} }

    // act
    await rusi.publish(subject, envelope, serDes)

    // assert
    expect(protoLoader.loadSync).toBeCalled()
    expect(grpcJs.loadPackageDefinition).toHaveBeenCalled()
    expect(mockRusiClient.waitForReady).toBeCalled()
    expect(mockRusiClient.Publish).toBeCalled()
  })

  test('subscribe opens a connection before calling Subscribe', async () => {
    // arrange
    const subject = 'subject'
    const handler = jest.fn()

    // act
    await rusi.subscribe(subject, handler, SubscriptionOptions.PUB_SUB, serDes)

    // assert
    expect(protoLoader.loadSync).toBeCalled()
    expect(grpcJs.loadPackageDefinition).toHaveBeenCalled()
    expect(mockRusiClient.waitForReady).toBeCalled()
    expect(mockRusiClient.Subscribe).toBeCalled()
  })

  test('unsubscribe calls cancel on the connection', async () => {
    // arrange
    const subject = 'subject'
    const handler = jest.fn()

    // act
    const sub = <RusiSubscription>await rusi.subscribe(subject, handler, SubscriptionOptions.STREAM_PROCESSOR, serDes)
    await sub.unsubscribe?.call(sub)

    // assert
    expect(sub._call?.cancel).toBeCalled()
  })

  test('subscribe registers error and end listeners on call', async () => {
    // arrange
    const subject = 'subject'

    // act
    const sub = <RusiSubscription>await rusi.subscribe(subject, jest.fn(), SubscriptionOptions.PUB_SUB, serDes)

    // assert
    expect(sub._call?.on).toHaveBeenCalledWith('error', expect.any(Function))
    expect(sub._call?.on).toHaveBeenCalledWith('end', expect.any(Function))
  })

  test('unsubscribe removes error and end listeners before cancelling', async () => {
    // arrange
    const sub = <RusiSubscription>await rusi.subscribe('subject', jest.fn(), SubscriptionOptions.STREAM_PROCESSOR, serDes)

    // act
    await sub.unsubscribe?.call(sub)

    // assert
    expect(sub._call?.removeListener).toHaveBeenCalledWith('error', expect.any(Function))
    expect(sub._call?.removeListener).toHaveBeenCalledWith('end', expect.any(Function))
    expect(sub._call?.cancel).toBeCalled()
  })

  test('subscription emits error when call emits error', async () => {
    // arrange — use a real EventEmitter for call so events propagate
    const { EventEmitter } = require('events')
    const realCall = Object.assign(new EventEmitter(), { cancel: jest.fn(), write: jest.fn() })
    mockRusiClient.Subscribe.mockReturnValueOnce(realCall)

    const sub = await rusi.subscribe('subject', jest.fn(), SubscriptionOptions.PUB_SUB, serDes)
    const errorListener = jest.fn()
    sub.on('error', errorListener)

    // act
    const testError = new Error('sidecar subscription error')
    realCall.emit('error', testError)

    // assert
    expect(errorListener).toHaveBeenCalledWith(testError)
  })

  test('subscription emits error when call emits end', async () => {
    // arrange
    const { EventEmitter } = require('events')
    const realCall = Object.assign(new EventEmitter(), { cancel: jest.fn(), write: jest.fn() })
    mockRusiClient.Subscribe.mockReturnValueOnce(realCall)

    const sub = await rusi.subscribe('subject', jest.fn(), SubscriptionOptions.PUB_SUB, serDes)
    const errorListener = jest.fn()
    sub.on('error', errorListener)

    // act
    realCall.emit('end')

    // assert
    expect(errorListener).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('subject') }))
  })

  test('disconnect happens if the connection is open', async () => {
    // arrange

    // act
    await rusi.disconnect()

    // assert
    expect(mockRusiClient?.close).not.toHaveBeenCalled()
  })

  test('disconnect closes only once', async () => {
    // arrange

    // act
    await rusi.connect()
    await Promise.all([rusi.disconnect(), rusi.disconnect(), rusi.disconnect()])
    await rusi.disconnect()
    await rusi.disconnect()

    // assert
    expect(mockRusiClient?.close).toBeCalledTimes(1)
  })
})
