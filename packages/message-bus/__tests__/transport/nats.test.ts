import { serDes, SubscriptionOptions } from '../../src'
import nats from '../../src/transport/nats'
import { NatsSubscription } from '../../src/transport/nats/types'
import nodeNatsStreaming from 'node-nats-streaming'


describe('Testing nats transport', () => {
  let mockConnection: nodeNatsStreaming.Stan | null = null
  let mockSubscriptionOptions: nodeNatsStreaming.SubscriptionOptions | null = null

  beforeEach(() => {
    mockSubscriptionOptions = {
      setStartAt: jest.fn(),
      setDurableName: jest.fn(),
      setDeliverAllAvailable: jest.fn(),
      setMaxInFlight: jest.fn(),
      setManualAckMode: jest.fn(),
      startPosition: 0,
      setAckWait: jest.fn(),
      setStartAtSequence: jest.fn(),
      setStartAtTimeDelta: jest.fn(),
      setStartTime: jest.fn(),
      setStartWithLastReceived: jest.fn()
    }

    mockConnection = {
      on: jest.fn((name, callback) => {
        if (name === 'connect') callback()
        return mockConnection as nodeNatsStreaming.Stan
      }),
      close: jest.fn(),
      publish: jest.fn((_topic, _msg, cb) => {
        setTimeout(() => {
          cb(null, 'ok')
        }, 10)
      }),
      subscribe: jest.fn().mockReturnValue({
        on: jest.fn((ev, cb) => {
          if (ev === 'ready' || ev === 'closed') {
            setTimeout(cb, 10)
          }
        }),
        close: jest.fn()
      }),
      subscriptionOptions: jest.fn(() => mockSubscriptionOptions)
    } as unknown as nodeNatsStreaming.Stan

    nodeNatsStreaming.connect = jest.fn(() => mockConnection as nodeNatsStreaming.Stan)
  })

  afterEach(async () => {
    await nats.disconnect()
    jest.resetAllMocks()
    jest.resetModules()

    mockConnection = null
    mockSubscriptionOptions = null
  })

  test('connections are opened once', async () => {
    // arrange

    // act
    await Promise.all([nats.connect(), nats.connect(), nats.connect()])
    await nats.connect()
    await nats.connect()

    // assert
    expect(nodeNatsStreaming.connect).toBeCalledTimes(1)
  })

  test('connections pass error along', async () => {
    // arrange
    if (!mockConnection) fail()

    mockConnection.on = jest.fn((name, callback) => {
      if (name === 'error') callback(new Error('Expected test error'))
      return mockConnection as nodeNatsStreaming.Stan
    })

    // act - assert
    await expect(nats.connect()).rejects.toMatchObject({ message: 'Expected test error' })
  })

  test('disconnect happens if a connection is open', async () => {
    // arrange

    // act
    await nats.disconnect()

    // assert
    expect(mockConnection?.close).not.toHaveBeenCalled()
  })

  test('disconnect only closes once', async () => {
    // arrange
    await nats.connect()

    // act
    await Promise.all([nats.disconnect(), nats.disconnect(), nats.disconnect()])
    await nats.disconnect()
    await nats.disconnect()

    // assert
    expect(mockConnection?.close).toBeCalledTimes(1)
  })

  test('publish opens a connection before publishing', async () => {
    // arrange
    const subject = 'subject'
    const envelope = { payload: {}, headers: {} }

    // act
    await nats.publish(subject, envelope, serDes)

    // assert
    expect(nodeNatsStreaming.connect).toBeCalled()
    expect(mockConnection?.publish).toBeCalled()
  })

  test('subscribe opens a connection before subscribing', async () => {
    // arrange
    const subject = 'subject'
    const handler = jest.fn()

    // act
    await nats.subscribe(subject, handler, SubscriptionOptions.PUB_SUB, serDes)

    // assert
    expect(nodeNatsStreaming.connect).toBeCalled()
    expect(mockConnection?.subscribe).toBeCalled()
  })

  test('unsubscribe calls connection close', async () => {
    // arrange
    const subject = 'subject'
    const handler = jest.fn()

    // act
    const sub = <NatsSubscription>await nats.subscribe(subject, handler, SubscriptionOptions.STREAM_PROCESSOR, serDes)
    sub.unsubscribe?.call(sub)

    // assert
    expect(sub._natsSubscription?.close).toBeCalled()
  })
})
