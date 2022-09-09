# multitenancy-core
This package allows loading tenant configuration from environment variables.


## Installation

```javascript
npm i @totalsoft/multitenancy-core
```

or

```javascript
yarn add @totalsoft/multitenancy-core
```
## Activation
The following environment variable should be set to 'true' 

```
IS_MULTITENANT: 'true'
```

## Environment variables format

Tenant speciffic environment variables should follow the format `MultiTenancy__Tenants__Tenant1__TenantProp` where:
-  `MultiTenancy__Tenants__` is a fixed prefix
-  `Tenant1` is the tenant code
-  `TenantProp` is a tenant speciffic setting 
-  `__` is the separator for the nested structure

An environment variable with the tenant id is mandatory for each tenant (eg:  `MultiTenancy__Tenants__Tenant1__TenantId`)

Nested properties can be used (eg: `MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__Password`)

For settings that are shared by multiple tenants, the folowing format should be used `MultiTenancy__Defaults__DefaultProp` where:
- `MultiTenancy__Defaults__` is a fixed prefix
- `DefaultProp` is a shared setting for all tenants
- `__` is the separator for the nested structure

The default settings are merged with the tenant speciffic settings, and in case of conflicts the tenant speciffic ones have precedence. 


## Usage
### tenantConfiguration
The `getValue` function reads values or complex objects from environment variables:

```javascript
const { tenantConfiguration } = require("@totalsoft/multitenancy-core")

// process.env = {
//    IS_MULTITENANT: 'true',
//    MultiTenancy__Tenants__Tenant1__TenantId: '3c841325-eccc-4670-a577-09546df7b1fc',
//    MultiTenancy__Tenants__Tenant1__TenantProp: 'tenantPropValue'
//}
const tenantSpecifficValue = tenantConfiguration.getValue('3c841325-eccc-4670-a577-09546df7b1fc', "tenantProp")
```
The `getConnectionInfo` extension reads the configuration to return a connection information object:
```javascript
const { tenantConfiguration } = require("@totalsoft/multitenancy-core")

// process.env = {
//    IS_MULTITENANT: 'true',
//    MultiTenancy__Tenants__Tenant1__TenantId: tenantId,
//    MultiTenancy__Defaults__ConnectionStrings__MyDatabase__Server: server,
//    MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__Database: db,
//    MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__UserName: user,
//    MultiTenancy__Tenants__Tenant1__ConnectionStrings__MyDatabase__Password: pass,
//    MultiTenancy__Defaults__ConnectionStrings__MyDatabase__OtherParams: otherParams,
}
const connectionInfo = tenantConfiguration.getConnectionInfo(tenantId, "myDatabase")
```
The returned `ConnectionInfo` object has the following structure:
```typescript
export interface ConnectionInfo {
    server: string, // Can include instance name and port
    database: string, 
    userName: string, 
    password: string, 
    otherParams?: string
}
```

### tenantService
The tenant service relies on the tenant configuration mechanism described above to read obtain tenant attributes.

The `getTenantFromId` function returns tenant information based on a tenant id.

```javascript
const { tenantService } = require("@totalsoft/multitenancy-core")

// process.env = {
//     IS_MULTITENANT: 'true',
//     MultiTenancy__Tenants__Tenant1__TenantId: tenantId,
//     MultiTenancy__Tenants__Tenant1__Name: 'Tenant 1 name'
}

const res = await tenantService.getTenantFromId(tenantId)
```

The returned `Tenant` object has the following structure:
```typescript
export interface Tenant {
    id: string,
    code: string,
    name?: string
}
```
The service throws an exception when the tenant with the specified id is not found.
