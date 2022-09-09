// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { tenantContextAccessor } from '../src'

describe('correlation tests:', () => {
  it('passes correlation id in async flow', async () => {
    //arrange
    const tenant = { id: 'tenant1', code: 'tenant1-code', enabled: true }
    let tenantContext
    async function inner() {
      tenantContext = tenantContextAccessor.getTenantContext()
    }

    //act
    tenantContextAccessor.useTenantContext({ tenant }, async () => {
      await inner()
    })

    //assert
    expect(tenantContext).toHaveProperty('tenant', tenant)
  })

  it('returns empty context if correlation context not set', async () => {
    //arrange
    let tenantContext
    async function inner() {
      tenantContext = tenantContextAccessor.getTenantContext()
    }

    //act
    await inner()

    //assert
    expect(tenantContext).not.toBe(undefined)
    expect(tenantContext).not.toHaveProperty('tenant')
  })
})
