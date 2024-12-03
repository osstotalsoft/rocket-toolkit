import { recordRequestDuration, recordRequestStarted, recordRequestFailed } from '../src'
import { createMetricsPlugin } from '../src/plugin'

jest.mock('../src/metrics', () => ({
  recordRequestStarted: jest.fn(),
  recordRequestFailed: jest.fn(),
  recordRequestDuration: jest.fn()
}))

describe('Plugin', () => {
  it('should call recordRequestStarted when requestDidStart is invoked', () => {
    const metricsPlugin = createMetricsPlugin()
    const mockContext = { request: 'mockRequest' }

    metricsPlugin.requestDidStart(mockContext as any)

    // Assert recordRequestStarted is called
    expect(recordRequestStarted).toHaveBeenCalledWith(mockContext)
  })

  it('should call recordRequestFailed when didEncounterErrors is invoked', async () => {
    const metricsPlugin = createMetricsPlugin()
    const mockContext = { request: 'mockRequest' }

    const lifecycle = metricsPlugin.requestDidStart(mockContext as any)
    await lifecycle.didEncounterErrors(mockContext as any)

    // Assert recordRequestFailed is called
    expect(recordRequestFailed).toHaveBeenCalledWith(mockContext)
  })

  it('should call recordRequestDuration with the correct duration when willSendResponse is invoked', async () => {
    const metricsPlugin = createMetricsPlugin()
    const mockContext = { request: 'mockRequest' }

    jest
      .spyOn(global.Date, 'now')
      .mockImplementationOnce(() => 1000) // Mock request start time
      .mockImplementationOnce(() => 1100) // Mock request end time

    const lifecycle = metricsPlugin.requestDidStart(mockContext as any)

    await lifecycle.willSendResponse(mockContext as any)

    // Assert recordRequestDuration is called with the correct duration 
    expect(recordRequestDuration).toHaveBeenCalledWith(100, mockContext)

    // Restore Date.now to prevent interference with other tests
    jest.spyOn(global.Date, 'now').mockRestore()
  })
})
