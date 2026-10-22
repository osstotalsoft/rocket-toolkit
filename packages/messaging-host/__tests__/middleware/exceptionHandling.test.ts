// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { messageBus } from '@totalsoft/message-bus'
import { exceptionHandling } from '../../src/middleware/exceptionHandling'
import { messagingHost } from '../../src/messagingHost'

jest.mock('@totalsoft/message-bus')

const busMock = { publish: jest.fn(async () => {}) }
jest.mocked(messageBus).mockImplementation(() => busMock as any)

global.console = {
  ...global.console,
  log: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}

describe('exceptionHandling tests:', () => {
  beforeEach(() => {
    busMock.publish.mockClear()
  })

  it('should handle exceptions:', async () => {
    //arrange
    const msg = { payload: {}, headers: {} }
    const ctx = messagingHost()._contextFactory('topic1', msg)
    const next = async () => {
      throw new Error('Error!')
    }

    //act & assert
    await expect(exceptionHandling()(ctx, next)).resolves.toBe(undefined)
  })

  it('should push an error message to dlq:', async () => {
    //arrange
    const msg = { payload: {}, headers: {} }
    const ctx = messagingHost()._contextFactory('topic1', msg)

    const next = async () => {
      throw new Error('Error!')
    }

    //act
    await exceptionHandling()(ctx, next)

    //assert
    expect(busMock.publish).toHaveBeenCalledTimes(1)
    expect(busMock.publish).toHaveBeenCalledWith('_error', expect.objectContaining({ originalTopic: 'topic1' }), ctx)
  })
})
