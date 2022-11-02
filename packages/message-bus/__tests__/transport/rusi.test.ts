import { rusi, serDes, SubscriptionOptions } from '../../src'
import { RusiConnection, RusiChannel, RusiSubscription } from '../../src/transport/rusi/types'

jest.mock('@grpc/grpc-js')
jest.mock('@grpc/proto-loader')

import protoLoader from '@grpc/proto-loader'
import grpcJs, { GrpcObject } from '@grpc/grpc-js'
import { Subscription } from '../../src/transport/types'

describe('Testing rusi transport', () => {
  let mockRusiClient: any = null
  let mockChannel: RusiChannel | null = null

  beforeEach(() => {
    protoLoader.loadSync = jest.fn(() => ({}))

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
        on: jest.fn()
      })),
      close: jest.fn()
    }

    grpcJs.loadPackageDefinition = jest.fn(
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
    protoLoader.loadSync = jest.fn(() => {
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
    protoLoader.loadSync = jest.fn(() => definition)

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
    const sub: Subscription = await rusi.subscribe(subject, handler, SubscriptionOptions.STREAM_PROCESSOR, serDes)
    await sub.unsubscribe?.call(sub)

    // assert
    expect((sub._call as RusiSubscription)?.cancel).toBeCalled()
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
