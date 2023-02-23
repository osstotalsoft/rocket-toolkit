

import { openTelemetryTracingTransport } from '../src'
import { pino } from 'pino'
import {  trace } from '@opentelemetry/api'

jest.mock('@opentelemetry/api')

describe('pino-opentelemetry tests:', () => {
  it('logs message to active span', async () => {
    //arrange
    const rootSpan : any = {
      addEvent: jest.fn(),
      recordException: jest.fn()
    }
    const dest = openTelemetryTracingTransport()
    const logger = pino({}, dest)

    jest.spyOn(trace, 'getActiveSpan').mockReturnValue(rootSpan)

    //act
    logger.info('bau')

    //assert
    expect(rootSpan.addEvent).toBeCalledWith('info', expect.objectContaining({ event: 'info', message: 'bau' }), expect.anything())
  })

  it('records exception', async () => {
    jest.resetAllMocks()
    //arrange
    
    const rootSpan : any = {
      addEvent: jest.fn(),
      recordException: jest.fn(),
      setAttribute: jest.fn()
    }
    const dest = openTelemetryTracingTransport()
    const logger = pino({}, dest)
    const error = new Error('myerror')

    jest.spyOn(trace, 'getActiveSpan').mockReturnValue(rootSpan)

    //act
    
    logger.error(error, 'bau')


    //assert
    expect(rootSpan.recordException).toBeCalledWith(expect.objectContaining(error), expect.anything())
  })
})
