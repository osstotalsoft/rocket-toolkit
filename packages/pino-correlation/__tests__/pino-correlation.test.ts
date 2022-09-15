import { correlationMixin } from '../src'
import { correlationManager } from '@totalsoft/correlation'

describe('pino-correlation tests:', () => {
  it('passes correlation id', async () => {
    //arrange
    let logEvent: { correlationId?: string } = {}

    //act
    correlationManager.useCorrelationId('myCorrelationId', async () => {
      logEvent = correlationMixin()
    })

    //assert
    expect(logEvent.correlationId).toBe('myCorrelationId')
  })
})
