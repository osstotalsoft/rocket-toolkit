// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

describe('tenant service tests:', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('should load tenant', async () => {
    //Arrange
    const tenantId = '3c841325-eccc-4670-a577-09546df7b1fc'
    const tenantName = 'tenant 1'
    process.env = {
      IS_MULTITENANT: 'true',
      MultiTenancy__Tenants__Tenant1__TenantId: tenantId,
      MultiTenancy__Tenants__Tenant1__Name: tenantName
    }
    const { tenantService } = require('../src')

    //Act
    const res = await tenantService.getTenantFromId(tenantId)

    ///Assert
    expect(res.id).toBe(tenantId)
    expect(res.code).toBe('tenant1')
    expect(res.name).toBe(tenantName)
  })

  it('should return null when tenant id not provided:', async () => {
    //Arrange
    const tenantId = ''
    process.env = {
      IS_MULTITENANT: 'true'
    }
    const { tenantService } = require('../src')

    //Act
    const res = await tenantService.getTenantFromId(tenantId)

    ///Assert
    expect(res).toBe(null)
  })

  it('should throw when tenant not found:', async () => {
    //Arrange
    const tenantId = '3c841325-eccc-4670-a577-09546df7b1fc'
    process.env = {
      IS_MULTITENANT: 'true'
    }
    const { tenantService } = require('../src')

    //Act
    const action = async () => await tenantService.getTenantFromId(tenantId)

    ///Assert
    await expect(action).rejects.toThrowError('Configuration not found')
  })

  it('should throw when tenant is disabled:', async () => {
    //Arrange
    const tenantId = '3c841325-eccc-4670-a577-09546df7b1fc'
    process.env = {
      IS_MULTITENANT: 'true',
      MultiTenancy__Tenants__Tenant1__TenantId: tenantId,
      MultiTenancy__Tenants__Tenant1__Enabled: 'false'
    }
    const { tenantService } = require('../src')

    //Act
    const action = async () => await tenantService.getTenantFromId(tenantId)

    ///Assert
    await expect(action).rejects.toThrowError('disabled')
  })
})
