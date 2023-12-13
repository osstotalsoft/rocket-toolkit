// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

process.env.JETSTREAM_EVENTS_STREAM = 'events'

import nats from '../../__mocks__/nats'
import jetstream from '../../src/transport/jetstream'
import { serDes, SubscriptionOptions } from '../../src'

describe('Testing Jetstream transport', () => {
  // afterEach(async () => {
  //   await jetstream.disconnect()
  //   jest.resetAllMocks()
  // })

  test('connections are opened once', async () => {
    // arrange

    // act
    await Promise.all([jetstream.connect(), jetstream.connect(), jetstream.connect()])
    await jetstream.connect()
    await jetstream.connect()

    // assert
    expect(nats.connect).toHaveBeenCalledTimes(1)
  })

  test('publish a message', async () => {
    // arrange
    const subject = 'subject'
    const envelope = { payload: {}, headers: {} }

    // act
    await jetstream.publish(subject, envelope, serDes)

    // assert
    expect(nats.connect).toBeCalled()
    expect(nats.__jetStreamClientMock.publish).toBeCalled()
  })

  test('subscribe to a channel', async () => {
    // arrange
    const subject = 'events.my.event'
    const handler = jest.fn()

    // act
    await jetstream.subscribe(subject, handler, SubscriptionOptions.PUB_SUB, serDes)

    // assert
    expect(nats.connect).toBeCalled()
    expect(nats.__natsConsumerMock.consume).toBeCalled()
  })
})
