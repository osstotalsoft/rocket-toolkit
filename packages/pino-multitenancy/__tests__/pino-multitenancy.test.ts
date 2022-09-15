import { tenantIdMixin } from '../src'
import { tenantContextAccessor } from '@totalsoft/multitenancy-core'

describe('pino-correlation tests:', () => {
  it('passes correlation id', async () => {
    //arrange
    let logEvent: { tenantId?: string } = {}

    //act
    tenantContextAccessor.useTenantContext(
      { tenant: { id: 'myTenantId', code: 'myTenantCode', enabled: true } },
      async () => {
        logEvent = tenantIdMixin()
      }
    )

    //assert
    expect(logEvent.tenantId).toBe('myTenantId')
  })
})
