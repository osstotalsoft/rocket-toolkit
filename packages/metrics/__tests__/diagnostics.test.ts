import { startDiagnostics } from '../src'

const logger = {
  info: jest.fn() // Mocking logger.info
}

describe('Metrics module', () => {
  test('should start metrics server with no errors', async () => {
    const port = 4001
    const endpoint = '/'

    startDiagnostics(logger as any)
    expect(logger.info).toHaveBeenCalledWith(`🚀 Diagnostics server ready at http://localhost:${port}${endpoint}`)
  })
})
