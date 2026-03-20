// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { tenantContextAccessor } from '../src'

describe('tenant context accessor tests:', () => {
  it('passes tenant context in async flow', async () => {
    //arrange
    const tenant = { id: 'tenant1', code: 'tenant1-code', enabled: true }
    let tenantContext
    async function inner() {
      tenantContext = tenantContextAccessor.getTenantContext()
    }

    //act
    await tenantContextAccessor.useTenantContext({ tenant }, async () => {
      await inner()
    })

    //assert
    expect(tenantContext).toHaveProperty('tenant', tenant)
  })

  it('returns empty context if tenant context not set', async () => {
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

  it('does not share tenant context between concurrent requests', async () => {
    //arrange
    const tenant1 = { id: 'tenant1', code: 'tenant1-code', enabled: true }
    const tenant2 = { id: 'tenant2', code: 'tenant2-code', enabled: true }
    let capturedContext1: ReturnType<typeof tenantContextAccessor.getTenantContext> = {} as ReturnType<typeof tenantContextAccessor.getTenantContext>
    let capturedContext2: ReturnType<typeof tenantContextAccessor.getTenantContext> = {} as ReturnType<typeof tenantContextAccessor.getTenantContext>

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    async function request1() {
      await tenantContextAccessor.useTenantContext({ tenant: tenant1 }, async () => {
        await delay(10)
        capturedContext1 = tenantContextAccessor.getTenantContext()
        await delay(10)
      })
    }

    async function request2() {
      await tenantContextAccessor.useTenantContext({ tenant: tenant2 }, async () => {
        await delay(5)
        capturedContext2 = tenantContextAccessor.getTenantContext()
        await delay(15)
      })
    }

    //act
    await Promise.all([request1(), request2()])

    //assert
    expect(capturedContext1).toHaveProperty('tenant', tenant1)
    expect(capturedContext2).toHaveProperty('tenant', tenant2)
  })
})
