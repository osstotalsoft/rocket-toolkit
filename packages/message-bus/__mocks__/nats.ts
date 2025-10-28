// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import type nats from 'nats'

const natsMock: any = jest.createMockFromModule<jest.Mocked<typeof nats>>('nats')

export const __natsConsumerMock: any = {
  info: jest.fn().mockImplementation(() => ({ config: {} })),
  consume: jest.fn().mockResolvedValue({})
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
export const connect = jest.fn().mockResolvedValue({
  close: jest.fn().mockResolvedValue(undefined),
  isClosed: jest.fn().mockResolvedValue(false),
  closed: jest.fn().mockReturnValue(new Promise(() => { })),
  jetstream: jest.fn().mockImplementation(() => __jetStreamClientMock)
})

export const StringCodec = jest.fn().mockImplementation(() => ({
  encode: jest.fn()
}))

export const DeliverPolicy = natsMock.DeliverPolicy

export const AckPolicy = natsMock.AckPolicy

