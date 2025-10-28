// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import type nats from 'nats'

const natsMock: any = jest.createMockFromModule<jest.Mocked<typeof nats>>('nats')

export const __natsConsumerMock: any = {
  info: jest.fn().mockImplementation(() => ({ config: {} })),
  consume: jest.fn().mockImplementation(async function* () {
    // This creates an async iterator that yields nothing by default
  })
}

export const __jetStreamClientMock: any = {
  publish: jest.fn().mockResolvedValue({}),
  jetstreamManager: jest.fn().mockImplementation(() => ({
    consumers: { add: jest.fn().mockResolvedValue({}) },
    streams: { find: jest.fn().mockResolvedValue({}) }
  })),
  consumers: {
    get: jest.fn().mockResolvedValue(__natsConsumerMock)
  }
}

export const connect = jest.fn().mockImplementation(() => {
  let _isClosed = false
  return {
    close: jest.fn().mockImplementation(() => { _isClosed = true }),
    isClosed: jest.fn().mockImplementation(() => _isClosed),
    closed: jest.fn().mockResolvedValue(_isClosed),
    jetstream: jest.fn().mockImplementation(() => __jetStreamClientMock)
  }
})

export const StringCodec = jest.fn().mockImplementation(() => ({
  encode: jest.fn()
}))

export const DeliverPolicy = natsMock.DeliverPolicy

export const AckPolicy = natsMock.AckPolicy

