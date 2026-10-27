// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { dispatcher } from '../../src/middleware/dispatcher'
import { messagingHost } from '../../src/messagingHost'

jest.mock('@totalsoft/message-bus')

describe('dispatcher tests:', () => {
  it('should dispatch msg: ', async () => {
    //arrange
    const msg = { payload: {}, headers: {} }
    const ctx = messagingHost()._contextFactory('topic1', msg)
    const next = jest.fn().mockResolvedValue(undefined)
    const cfg = {
      topic1: jest.fn().mockResolvedValue(undefined),
      otherTopic: jest.fn().mockResolvedValue(undefined)
    }

    //act
    await dispatcher(cfg)(ctx, next)

    //assert
    expect(cfg.topic1).toHaveBeenCalled()
    expect(cfg.otherTopic).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('should merge handlers: ', async () => {
    //arrange
    const calls: string[] = []
    const handler = (name: string) => jest.fn(async () => void calls.push(name))
    const x = { topic1: handler('x1'), topic2: handler('x2') }
    const y = { topic1: handler('y1'), topic3: handler('y3') }
    const z = { topic3: handler('z3') }
    const ctx = messagingHost()._contextFactory('topic1', { payload: {}, headers: {} })

    //act
    const merged = dispatcher.mergeHandlers([x, y, z])
    await merged.topic1(ctx)
    await merged.topic2(ctx)
    await merged.topic3(ctx)

    //assert
    expect(Object.keys(merged)).toEqual(['topic1', 'topic2', 'topic3'])
    expect(calls).toEqual(['x1', 'y1', 'x2', 'y3', 'z3'])
  })
})
