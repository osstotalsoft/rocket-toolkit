import { envelope } from '../src/envelope'

describe('testing the envelope', () => {
  test('default envelope will generate a corelationId', () => {
    // arrange

    // act
    const result = envelope('test')

    // assert
    expect(result.payload).toBe('test')
    expect(result.headers['nbb-correlationId']).toBeTruthy()
    expect(result.headers['nbb-tenantId']).toBeFalsy()
    expect(result.headers['nbb-source']).toBeFalsy()
  })

  test('tenant and corelation id are taken from context and source from environment', () => {
    // arrange
    process.env.Messaging__Source = 'test source'
    const context = {
      correlationId: 'test correlation',
      tenantId: 'test tenant'
    }

    // act
    const result = envelope('test', context)

    // assert
    expect(result.headers['nbb-correlationId']).toBe('test correlation')
    expect(result.headers['nbb-tenantId']).toBe('test tenant')
    expect(result.headers['nbb-source']).toBe('test source')
  })

  test('envelope passes header to be customized', () => {
    // arrange
    process.env.Messaging__Source = 'test source'
    const context = {
      correlationId: 'test correlation',
      tenantId: 'test tenant'
    }
    const customizer = jest.fn()

    // act
    envelope('test', context, customizer)

    // assert
    expect(customizer).toBeCalledWith(
      expect.objectContaining({
        'nbb-correlationId': 'test correlation',
        'nbb-tenantId': 'test tenant',
        'nbb-source': 'test source'
      })
    )
  })

  test('getCorrelationId returns `nbb-correlationId` prop from header', () => {
    // arrange
    const msg = { headers: { 'nbb-correlationId': 'test' }, payload: 'test' }

    // act
    const result = envelope.getCorrelationId(msg)

    // assert
    expect(result).toBe('test')
  })

  test('getTenantId returns `nbb-tenantId` prop from header', () => {
    // arrange
    const msg = { headers: { 'nbb-tenantId': 'test' }, payload: 'test' }

    // act
    const result = envelope.getTenantId(msg)

    // assert
    expect(result).toBe('test')
  })

  test('getSource returns `nbb-source` prop from header', () => {
    // arrange
    const msg = { headers: { 'nbb-source': 'test' }, payload: 'test' }

    // act
    const result = envelope.getSource(msg)

    // assert
    expect(result).toBe('test')
  })
})
