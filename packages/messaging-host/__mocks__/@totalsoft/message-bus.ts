// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { EventEmitter } from 'events'

const mock = jest.createMockFromModule<any>('@totalsoft/message-bus')

mock.messageBus = jest.fn(() => {
  const connectionMock = new EventEmitter()

  const makeSubscriptionMock = () => {
    const subscriptionMock: any = new EventEmitter()
    subscriptionMock.unsubscribe = jest.fn().mockResolvedValue(undefined)
    return subscriptionMock
  }

  const defaultSubscriptionMock = makeSubscriptionMock()
  const messageBusMock: any = {
    publish: jest.fn(),
    subscribe: jest.fn().mockResolvedValue(defaultSubscriptionMock),
    sendCommandAndReceiveEvent: jest.fn(),
    transport: {
      connect: jest.fn().mockResolvedValue(connectionMock),
      disconnect: jest.fn().mockResolvedValue(undefined)
    }
  }
  messageBusMock.__mockSubscriptionOnce = (...events: any[]) => {
    messageBusMock.subscribe.mockImplementationOnce((_topic: string, handler: (ev: any) => void) => {
      events.forEach((ev, index) => {
        setTimeout(
          () => {
            handler(ev)
          },
          100 * (index + 1)
        )
      })

      return Promise.resolve(makeSubscriptionMock())
    })
  }
  messageBusMock.__mockConnectionErrorOnce = (err?: Error) => {
    const connectionError = err || new Error('Connection error')
    messageBusMock.transport.connect.mockImplementationOnce(() => Promise.reject(connectionError))

    return messageBusMock
  }

  messageBusMock.__mockSuccessfulConnectionOnce = () => {
    messageBusMock.transport.connect.mockImplementationOnce(() => Promise.resolve(connectionMock))

    return messageBusMock
  }

  messageBusMock.__emitConnectionError = (err?: Error) => {
    const connectionError = err || new Error('Connection error')
    connectionMock.emit('error', connectionError)
  }

  messageBusMock.__emitSubscriptionError = (err?: Error) => {
    const subscriptionError = err || new Error('Subscription error')
    defaultSubscriptionMock.emit('error', subscriptionError)
  }

  messageBusMock.__clearMocks = () => {
    messageBusMock.subscribe.mockClear()
    messageBusMock.transport.connect.mockClear()
  }

  return messageBusMock
})

module.exports = mock
