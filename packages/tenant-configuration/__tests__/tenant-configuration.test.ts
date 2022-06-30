// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

describe('logging plugin tests:', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('should load tenant configuration:', () => {
    //Arrange
    const tenantId = '3c841325-eccc-4670-a577-09546df7b1fc'
    const tenantProp = 'tenant speciffic prop'
    process.env = {
      IS_MULTITENANT: 'true',
      MultiTenancy__Tenants__Tenant1__TenantId: tenantId,
      MultiTenancy__Tenants__Tenant1__TenantProp: tenantProp
    }
    const { tenantConfiguration } = require('../src')

    //Act
    const res = tenantConfiguration.getValue(tenantId)

    ///Assert
    expect(res.tenantId).toBe(tenantId)
    expect(res.code).toBe('tenant1')
    expect(res.tenantProp).toBe(tenantProp)
  })

  it('should load tenant property:', () => {
    //Arrange
    const tenantId = '3c841325-eccc-4670-a577-09546df7b1fc'
    const tenantProp = 'tenant speciffic prop'
    process.env = {
      IS_MULTITENANT: 'true',
      MultiTenancy__Tenants__Tenant1__TenantId: tenantId,
      MultiTenancy__Tenants__Tenant1__TenantProp: tenantProp
    }
    const { tenantConfiguration } = require('../src')

    //Act
    const res = tenantConfiguration.getValue(tenantId, 'tenantProp')

    ///Assert
    expect(res).toBe(tenantProp)
  })

  it('should load nested tenant property:', () => {
    //Arrange
    const tenantId = '3c841325-eccc-4670-a577-09546df7b1fc'
    const tenantProp = 'tenant speciffic prop'
    process.env = {
      IS_MULTITENANT: 'true',
      MultiTenancy__Tenants__Tenant1__TenantId: tenantId,
      MultiTenancy__Tenants__Tenant1__Parent__TenantProp: tenantProp
    }
    const { tenantConfiguration } = require('../src')

    //Act
    const res = tenantConfiguration.getValue(tenantId, 'parent.tenantProp')

    ///Assert
    expect(res).toBe(tenantProp)
  })

  it('should merge with defaults property:', () => {
    //Arrange
    const tenantId = '3c841325-eccc-4670-a577-09546df7b1fc'
    const tenantProp = 'tenant speciffic prop'
    const defaultProp = 'default prop'
    process.env = {
      IS_MULTITENANT: 'true',
      MultiTenancy__Defaults__Parent__DefaultProp: defaultProp,
      MultiTenancy__Defaults__Parent__TenantProp: 'to overwrite',
      MultiTenancy__Tenants__Tenant1__TenantId: tenantId,
      MultiTenancy__Tenants__Tenant1__Parent__TenantProp: tenantProp
    }
    const { tenantConfiguration } = require('../src')

    //Act
    const resTenantProp = tenantConfiguration.getValue(tenantId, 'parent.tenantProp')
    const resDefaultProp = tenantConfiguration.getValue(tenantId, 'parent.defaultProp')
    const resTenantSection = tenantConfiguration.getValue(tenantId, 'parent')

    ///Assert
    expect(resTenantProp).toBe(tenantProp)
    expect(resDefaultProp).toBe(defaultProp)
    expect(resTenantSection).toEqual({ defaultProp, tenantProp })
  })
  it('should return undefined value if not multitenant:', () => {
    //Arrange
    const tenantId = '3c841325-eccc-4670-a577-09546df7b1fc'
    process.env = {
      IS_MULTITENANT: 'false'
    }
    const { tenantConfiguration } = require('../src')

    //Act
    const resTenantProp = tenantConfiguration.getValue(tenantId, 'parent.tenantProp')

    ///Assert
    expect(resTenantProp).toBe(undefined)
  })

  it('should throw when tenant not found:', () => {
    //Arrange
    const tenantId = '3c841325-eccc-4670-a577-09546df7b1fc'
    process.env = {
      IS_MULTITENANT: 'true'
    }
    const { tenantConfiguration } = require('../src')

    //Act
    const action = () => tenantConfiguration.getValue(tenantId, 'parent.tenantProp')

    ///Assert
    expect(action).toThrowError('Configuration not found')
  })

  it('should read connection info:', () => {
    //Arrange
    const tenantId = '3c841325-eccc-4670-a577-09546df7b1fc'
    const server = 'server,3333'
    const db = 'myDatabase'
    const user = 'user'
    const pass = 'pass'
    const otherParams = 'MultipleActiveResultSets=true'

    process.env = {
      IS_MULTITENANT: 'true',
      MultiTenancy__Tenants__Tenant1__TenantId: tenantId,
      MultiTenancy__Defaults__ConnectionStrings__MyDatabase__Server: server,
      MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__Database: db,
      MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__UserName: user,
      MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__Password: pass,
      MultiTenancy__Defaults__ConnectionStrings__MyDatabase__OtherParams: otherParams
    }
    const { tenantConfiguration } = require('../src')

    //Act
    const connectionInfo = tenantConfiguration.getConnectionInfo(tenantId, 'myDatabase')

    //Assert
    expect(connectionInfo.server).toBe(server)
    expect(connectionInfo.database).toBe(db)
    expect(connectionInfo.userName).toBe(user)
    expect(connectionInfo.password).toBe(pass)
    expect(connectionInfo.otherParams).toBe(otherParams)
  })
})
