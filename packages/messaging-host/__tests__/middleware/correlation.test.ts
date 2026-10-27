// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { envelope } from '@totalsoft/message-bus'
import { messagingHost } from '../../src/messagingHost'
import { correlation } from '../../src/middleware/correlation'

jest.mock('@totalsoft/message-bus')

describe('correlation tests:', () => {
  it('should set correlationId from received msg: ', async () => {
    //arrange
    const someCorrelationId = 'some-correlation-id'
    jest.mocked(envelope.getCorrelationId).mockReturnValue(someCorrelationId)

    const msg = { payload: {}, headers: {} }
    const ctx = messagingHost()._contextFactory('topic1', msg)
    const next = jest.fn().mockResolvedValue(undefined)

    //act
    await correlation()(ctx, next)

    //assert
    expect(ctx.correlationId).toBe(someCorrelationId)
  })
})
