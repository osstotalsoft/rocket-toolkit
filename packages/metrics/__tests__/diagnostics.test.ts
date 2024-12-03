import { startDiagnostics, stopDiagnostics } from '../src'

// Mocking logger.info
const logger = {
  info: jest.fn() 
}

describe('Diagnostics module', () => {
  it('should start diagnostics server with no errors', async () => {
    const port = 4001
    const endpoint = '/'

    startDiagnostics(logger as any)

    //Assert logger.info is called with the correct message
    expect(logger.info).toHaveBeenCalledWith(`🚀 Diagnostics server ready at http://localhost:${port}${endpoint}`)

    stopDiagnostics(logger as any)
  })
})
