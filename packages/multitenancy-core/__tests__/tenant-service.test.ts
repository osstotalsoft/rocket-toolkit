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

  it('should load tenants', async () => {
    // Arrange
    const tenants = [
      { id: '3c841325-eccc-4670-a577-09546df7b1fc', name: 'tenant 1 name', code: 'tenant1', enabled: true },
      { id: '9c841325-eccc-4670-a577-09546df7b1fc', name: 'tenant 2 name', code: 'tenant2', enabled: true }
    ]

    process.env = {
      IS_MULTITENANT: 'true',
      ...tenants.reduce(
        (env, { id, name, code }) => ({
          ...env,
          [`MultiTenancy__Tenants__${code}__TenantId`]: id,
          [`MultiTenancy__Tenants__${code}__Name`]: name
        }),
        {}
      )
    }

    const { tenantService } = require('../src')

    // Act
    const res = await tenantService.getAll()

    // Assert
    expect(res).toEqual(tenants)
  })

  it('should return an empty array if no tenants are enabled', async () => {
    // Arrange
    const tenant = {
      id: '3c841325-eccc-4670-a577-09546df7b1fc',
      name: 'tenant 1 name',
      code: 'tenant1',
      enabled: 'false'
    }

    process.env = {
      IS_MULTITENANT: 'true',
      [`MultiTenancy__Tenants__${tenant.code}__TenantId`]: tenant.id,
      [`MultiTenancy__Tenants__${tenant.code}__Name`]: tenant.name,
      [`MultiTenancy__Tenants__${tenant.code}__Enabled`]: tenant.enabled
    }

    const { tenantService } = require('../src')

    // Act
    const res = await tenantService.getAll()

    // Assert
    expect(res).toHaveLength(0)
  })
})
