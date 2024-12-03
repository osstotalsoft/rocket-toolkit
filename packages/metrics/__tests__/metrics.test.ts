import { startMetrics } from '../src'

// Mocking logger.info
const logger = {
  info: jest.fn() 
}

describe('Metrics module', () => {
  it('should start metrics server with no errors', async () => {
    const port = 9464
    const endpoint = '/metrics'

    await expect(startMetrics(logger as any)).resolves.not.toThrow()

    //Assert logger.info is called with the correct message
    expect(logger.info).toHaveBeenCalledWith(`🚀 Metrics server ready at http://localhost:${port}${endpoint}`)
  })
})
