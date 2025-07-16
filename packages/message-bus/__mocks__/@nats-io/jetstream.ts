// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

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

export const jetstream = jest.fn().mockImplementation(() => __jetStreamClientMock)

export const AckPolicy = {
  None: 'none',
  All: 'all',
  Explicit: 'explicit'
} as const

export const DeliverPolicy = {
  All: 'all',
  Last: 'last',
  New: 'new'
} as const
