// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

process.env.JETSTREAM_EVENTS_STREAM = 'events'

import { connect } from '../../__mocks__/@nats-io/transport-node'
import { __jetStreamClientMock, __natsConsumerMock } from '../../__mocks__/@nats-io/jetstream'
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
    expect(connect).toHaveBeenCalledTimes(1)
  })

  test('publish a message', async () => {
    // arrange
    const subject = 'subject'
    const envelope = { payload: {}, headers: {} }

    // act
    await jetstream.publish(subject, envelope, serDes)

    // assert
    expect(connect).toBeCalled()
    expect(__jetStreamClientMock.publish).toBeCalled()
  })

  test('subscribe to a channel', async () => {
    // arrange
    const subject = 'events.my.event'
    const handler = jest.fn()

    // act
    await jetstream.subscribe(subject, handler, SubscriptionOptions.PUB_SUB, serDes)

    // assert
    expect(connect).toBeCalled()
    expect(__natsConsumerMock.consume).toBeCalled()
  })
})
