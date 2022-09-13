import { opentracingTransport } from '../src'
import { pino } from 'pino'
import { spanManager } from '@totalsoft/opentracing'
import { Tags } from 'opentracing'

describe('pino-opentracing tests:', () => {
  it('logs message to active span', async () => {
    //arrange
    const rootSpan = {
      log: jest.fn()
    }
    const dest = opentracingTransport()
    const logger = pino({}, dest)

    //act
    spanManager.useSpanManager(<any>rootSpan, async () => {
      logger.info('bau')
    })

    //assert
    expect(rootSpan.log).toBeCalledWith(expect.objectContaining({ event: 'info', message: 'bau' }))
  })

  it('sets error tag', async () => {
    //arrange
    const rootSpan = {
      setTag: jest.fn()
    }
    const dest = opentracingTransport()
    const logger = pino({}, dest)

    //act
    spanManager.useSpanManager(<any>rootSpan, async () => {
      logger.error('bau')
    })

    //assert
    expect(rootSpan.setTag).toBeCalledWith(Tags.ERROR, true)
  })

  it('log error details', async () => {
    //arrange
    const rootSpan = {
      setTag: jest.fn(),
      log: jest.fn()
    }
    const error = new Error('MyError')
    const dest = opentracingTransport()
    const logger = pino({}, dest)

    //act
    spanManager.useSpanManager(<any>rootSpan, async () => {
      logger.error(error, 'bau')
    })

    //assert
    expect(rootSpan.log).toBeCalledWith(
      expect.objectContaining({
        event: 'error',
        message: 'bau',
        'error.kind': 'Error',
        'error.object': expect.objectContaining({message: 'MyError'}),
        stack: error.stack
      })
    )
  })
})
