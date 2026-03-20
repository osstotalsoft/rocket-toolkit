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

  it('does not mix correlation ids between concurrent requests', async () => {
    //arrange
    let correlationId1: string | undefined
    let correlationId2: string | undefined

    //act
    await Promise.all([
      correlationManager.useCorrelationId('request-1', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        correlationId1 = correlationManager.getCorrelationId()
      }),
      correlationManager.useCorrelationId('request-2', async () => {
        await new Promise(resolve => setTimeout(resolve, 5))
        correlationId2 = correlationManager.getCorrelationId()
      })
    ])

    //assert
    expect(correlationId1).toBe('request-1')
    expect(correlationId2).toBe('request-2')
  })
})
