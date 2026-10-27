// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { messagingHost } from '../src/messagingHost'

jest.mock('@totalsoft/message-bus')

global.console = {
  ...global.console,
  log: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}

describe('MessagingHost tests', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('2 topics and 2 middlewares', async () => {
    //Arrange
    const msgHost = messagingHost()
    const msgBus = msgHost._messageBus as any
    msgBus.__mockSubscriptionOnce({
      headers: {},
      payload: {}
    })
    msgBus.__mockSubscriptionOnce(/*no events*/)

    const firstMiddleware = jest.fn(async (_ctx, next) => {
      await next()
    })
    const secondMiddleware = jest.fn(async (_ctx, next) => {
      await next()
    })

    const topic1 = 'topic1'
    const topic2 = 'topic2'

    //Act
    await msgHost.subscribe([topic1, topic2]).use(firstMiddleware).use(secondMiddleware).start()

    jest.runAllTimers()

    //Assert
    expect(firstMiddleware.mock.invocationCallOrder[0]).toBeLessThan(secondMiddleware.mock.invocationCallOrder[0])
    expect(firstMiddleware.mock.calls[0][0].received.topic).toBe('topic1')
    expect(firstMiddleware.mock.calls[0][0].received).toHaveProperty('msg')
    expect(secondMiddleware.mock.calls[0][0].received.topic).toBe('topic1')
    expect(secondMiddleware.mock.calls[0][0].received).toHaveProperty('msg')
  })

  test('start retries', async () => {
    //arrange
    const middleware = jest.fn(async (_ctx, next) => {
      await next()
    })
    const msgHost = messagingHost().use(middleware).subscribe(['topic'])
    const msgBus = msgHost._messageBus as any

    msgBus.__mockConnectionErrorOnce().__mockSuccessfulConnectionOnce()

    //act
    setImmediate(jest.runAllTimers)
    await msgHost.start()

    //assert
    expect(msgBus.transport.connect).toHaveBeenCalledTimes(2)
  })

  test('connection error handler', async () => {
    //arrange
    const middleware = jest.fn(async (_ctx, next) => {
      await next()
    })
    const connectionErrorHandler = jest.fn()
    const msgHost = messagingHost().onConnectionError(connectionErrorHandler).use(middleware).subscribe(['topic'])
    const msgBus = msgHost._messageBus as any

    //act
    await msgHost.start()
    msgBus.__emitConnectionError()

    //assert
    expect(connectionErrorHandler).toHaveBeenCalled()
  })

  test('connection error retries', async () => {
    //arrange
    const middleware = jest.fn(async (_ctx, next) => {
      await next()
    })
    const msgHost = messagingHost().use(middleware).subscribe(['topic'])
    const msgBus = msgHost._messageBus as any

    msgBus.__mockSuccessfulConnectionOnce().__mockConnectionErrorOnce()

    //act
    await msgHost.start()

    msgBus.__emitConnectionError()
    await new Promise(resolve => {
      msgHost.on('starting', resolve)
    })

    //assert
    expect(msgBus.transport.connect).toHaveBeenCalledTimes(2)
  })

  test('isRunning returns true when the messaging host is started', async () => {
    const msgHost = messagingHost().subscribe(['topic'])

    // Act
    await msgHost.start()

    // Assert
    expect(msgHost.isRunning()).toBe(true)

    // Teardown: Stop the messaging host.
    await msgHost.stop()
  })

  test('isRunning returns false when the messaging host is stopped', async () => {
    const msgHost = messagingHost().subscribe(['topic'])

    // Act: Ensure the messaging host is stopped.
    await msgHost.start()
    await msgHost.stop()

    // Assert
    expect(msgHost.isRunning()).toBe(false)
  })

  test('subscription error handler', async () => {
    //arrange
    const subscriptionErrorHandler = jest.fn()
    const msgHost = messagingHost().onSubscriptionError(subscriptionErrorHandler).subscribe(['topic'])
    const msgBus = msgHost._messageBus as any

    //act
    await msgHost.start()
    msgBus.__emitSubscriptionError()

    //assert
    expect(subscriptionErrorHandler).toHaveBeenCalled()
  })

  test('subscription error retries', async () => {
    //arrange
    const msgHost = messagingHost().subscribe(['topic'])
    const msgBus = msgHost._messageBus as any

    //act
    await msgHost.start()

    msgBus.__emitSubscriptionError()
    await new Promise(resolve => {
      msgHost.on('starting', resolve)
    })

    //assert
    expect(msgBus.transport.connect).toHaveBeenCalledTimes(2)
  })

  test('stop removes subscription error listener', async () => {
    //arrange
    const subscriptionErrorHandler = jest.fn()
    const msgHost = messagingHost().onSubscriptionError(subscriptionErrorHandler).subscribe(['topic'])
    const msgBus = msgHost._messageBus as any

    //act
    await msgHost.start()
    await msgHost.stop()
    // After stop, no 'error' listeners remain on the subscription.
    // Node.js EventEmitter throws when emitting 'error' with no listeners — that's expected.
    try {
      msgBus.__emitSubscriptionError()
    } catch {
      /* expected */
    }

    //assert
    expect(subscriptionErrorHandler).not.toHaveBeenCalled()
  })
})
