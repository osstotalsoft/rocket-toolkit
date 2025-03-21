// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import type nats from 'nats'

const natsMock: any = jest.createMockFromModule<jest.Mocked<typeof nats>>('nats')

const natsConsumerMock: any = {
  info: jest.fn().mockImplementation(() => ({ config: {} })),
  consume: jest.fn().mockResolvedValue({})
}

const jetStreamClientMock: any = {
  publish: jest.fn().mockResolvedValue({}),
  jetstreamManager: jest.fn().mockImplementation(() => ({
    consumers: { add: jest.fn().mockResolvedValue({}) },
    streams: { find: jest.fn().mockResolvedValue({}) }
  })),
  consumers: {
    get: jest.fn().mockResolvedValue(natsConsumerMock)
  }
}
natsMock.connect = jest.fn().mockResolvedValue({
  close: jest.fn().mockResolvedValue(undefined),
  closed: jest.fn().mockReturnValue(new Promise(() => {})),
  jetstream: jest.fn().mockImplementation(() => jetStreamClientMock)
})

natsMock.StringCodec = jest.fn().mockImplementation(() => ({
  encode: jest.fn()
}))

export default { ...natsMock, __jetStreamClientMock: jetStreamClientMock, __natsConsumerMock: natsConsumerMock }
