// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { empty, concat, run } from '../src/pipeline'
import type { MessagingHostContext } from '../src/types'

describe('Pipeline tests', () => {
  test('concat with empty', async () => {
    //Arrange
    const middleware = jest.fn(async (_ctx, next) => {
      await next()
    })
    const pipeline = concat(empty, middleware)
    const ctx = {} as MessagingHostContext

    //Act
    await run(pipeline, ctx)

    //Assert
    expect(middleware).toHaveBeenCalled()
    expect(middleware.mock.calls[0][0]).toBe(ctx)
  })

  test('concat two middlewares', async () => {
    //Arrange
    const firstMiddleware = jest.fn(async (_ctx, next) => {
      await next()
    })
    const secondMiddleware = jest.fn(async (_ctx, next) => {
      await next()
    })
    const pipeline = concat(secondMiddleware, firstMiddleware)
    const ctx = {} as MessagingHostContext

    //Act
    await run(pipeline, ctx)

    //Assert
    expect(firstMiddleware).toHaveBeenCalled()
    expect(secondMiddleware).toHaveBeenCalled()
    expect(firstMiddleware.mock.invocationCallOrder[0]).toBeLessThan(secondMiddleware.mock.invocationCallOrder[0])
    expect(firstMiddleware.mock.calls[0][0]).toBe(ctx)
    expect(secondMiddleware.mock.calls[0][0]).toBe(ctx)
  })
})
