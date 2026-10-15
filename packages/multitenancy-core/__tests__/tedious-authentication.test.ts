// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

describe('tedious authentication tests:', () => {
  const OLD_ENV = process.env
  const tenant1Id = '3c841325-eccc-4670-a577-09546df7b1fc'
  const tenant2Id = '9a841325-eccc-4670-a577-09546df7b1fc'
  const user = 'user'
  const pass = 'pass'
  const identityClientId = 'a1b2c3d4-0000-1111-2222-333344445555'

  const defaultsEnv = {
    IS_MULTITENANT: 'true',
    MultiTenancy__Defaults__ConnectionStrings__MyDatabase__Server: 'server,3333',
    MultiTenancy__Defaults__ConnectionStrings__MyDatabase__Database: 'myDatabase',
    MultiTenancy__Defaults__ConnectionStrings__MyDatabase__UserName: user,
    MultiTenancy__Defaults__ConnectionStrings__MyDatabase__Password: pass,
    MultiTenancy__Tenants__Tenant1__TenantId: tenant1Id,
    MultiTenancy__Tenants__Tenant2__TenantId: tenant2Id
  }

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('should return sql authentication when authentication is not set:', () => {
    //Arrange
    process.env = { ...defaultsEnv }
    const { tenantConfiguration, getTediousAuthentication } = require('../src')

    //Act
    const res = getTediousAuthentication(tenantConfiguration.getConnectionInfo(tenant1Id, 'myDatabase'))

    //Assert
    expect(res).toEqual({ type: 'default', options: { userName: user, password: pass } })
  })

  it('should return sql authentication when authentication is empty:', () => {
    //Arrange
    process.env = { ...defaultsEnv }
    const { getTediousAuthentication } = require('../src')

    //Act
    const res = getTediousAuthentication({ server: 's', database: 'd', userName: user, password: pass, authentication: ' ' })

    //Assert
    expect(res).toEqual({ type: 'default', options: { userName: user, password: pass } })
  })

  it('should return identity authentication for workload identity, ignoring defaults password:', () => {
    //Arrange
    process.env = {
      ...defaultsEnv,
      MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__Authentication: 'Active Directory Workload Identity',
      MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__IdentityClientId: identityClientId
    }
    const { tenantConfiguration, getTediousAuthentication } = require('../src')

    //Act
    const res = getTediousAuthentication(tenantConfiguration.getConnectionInfo(tenant1Id, 'myDatabase'))

    //Assert
    expect(res).toEqual({ type: 'azure-active-directory-default', options: { clientId: identityClientId } })
  })

  it.each([
    'Active Directory Workload Identity',
    'ActiveDirectoryWorkloadIdentity',
    'active directory workload identity',
    'ACTIVEDIRECTORYWORKLOADIDENTITY',
    '  Active  Directory Workload Identity ',
    'Active Directory Managed Identity',
    'ActiveDirectoryManagedIdentity',
    'Active Directory MSI',
    'activedirectorymsi',
    'Active Directory Default',
    'ActiveDirectoryDefault'
  ])('should return identity authentication for passwordless mode "%s":', authentication => {
    //Arrange
    process.env = {
      ...defaultsEnv,
      MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__Authentication: authentication,
      MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__IdentityClientId: identityClientId
    }
    const { tenantConfiguration, getTediousAuthentication } = require('../src')

    //Act
    const res = getTediousAuthentication(tenantConfiguration.getConnectionInfo(tenant1Id, 'myDatabase'))

    //Assert
    expect(res).toEqual({ type: 'azure-active-directory-default', options: { clientId: identityClientId } })
  })

  it('should throw when identityClientId is missing for a passwordless mode:', () => {
    //Arrange
    process.env = {
      ...defaultsEnv,
      MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__Authentication: 'Active Directory Workload Identity'
    }
    const { tenantConfiguration, getTediousAuthentication } = require('../src')
    const connectionInfo = tenantConfiguration.getConnectionInfo(tenant1Id, 'myDatabase')

    //Act
    const action = () => getTediousAuthentication(connectionInfo)

    //Assert
    expect(action).toThrow('identityClientId is not provided')
  })

  it('should throw for an unsupported authentication mode:', () => {
    //Arrange
    process.env = {
      ...defaultsEnv,
      MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__Authentication: 'Active Directory Password',
      MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__IdentityClientId: identityClientId
    }
    const { tenantConfiguration, getTediousAuthentication } = require('../src')
    const connectionInfo = tenantConfiguration.getConnectionInfo(tenant1Id, 'myDatabase')

    //Act
    const action = () => getTediousAuthentication(connectionInfo)

    //Assert
    expect(action).toThrow("Unsupported authentication 'Active Directory Password'")
  })

  it('should keep sql authentication for tenants without authentication set:', () => {
    //Arrange
    process.env = {
      ...defaultsEnv,
      MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__Authentication: 'Active Directory Workload Identity',
      MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__IdentityClientId: identityClientId
    }
    const { tenantConfiguration, getTediousAuthentication } = require('../src')

    //Act
    const tenant1Res = getTediousAuthentication(tenantConfiguration.getConnectionInfo(tenant1Id, 'myDatabase'))
    const tenant2Res = getTediousAuthentication(tenantConfiguration.getConnectionInfo(tenant2Id, 'myDatabase'))

    //Assert
    expect(tenant1Res).toEqual({ type: 'azure-active-directory-default', options: { clientId: identityClientId } })
    expect(tenant2Res).toEqual({ type: 'default', options: { userName: user, password: pass } })
  })
})
