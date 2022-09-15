import { correlationManager } from '../src'

describe('correlation tests:', () => {
  it('passes correlation id in async flow', async () => {
    //arrange
    let correlationId
    async function inner() {
      correlationId = correlationManager.getCorrelationId()
    }

    //act
    correlationManager.useCorrelationId('myCorrelationId', async () => {
      await inner()
    })

    //assert
    expect(correlationId).toBe('myCorrelationId')
  })

  it('returns undefined if correlation context not set', async () => {
    //arrange
    let correlationId
    async function inner() {
      correlationId = correlationManager.getCorrelationId()
    }

    //act
    await inner()
    
    //assert
    expect(correlationId).toBe(undefined)
  })

  it('generates new correlationId', async () => {
    //arrange
    let correlationId
    async function inner() {
      correlationId = correlationManager.getCorrelationId()
    }

    //act
    correlationManager.useCorrelationId(null, async () => {
      await inner()
    })
    
    //assert
    expect(correlationId).toHaveLength(36)
  })
})
