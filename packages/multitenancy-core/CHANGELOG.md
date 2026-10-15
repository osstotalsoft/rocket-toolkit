# @totalsoft/multitenancy-core

## 2.1.0

### Minor Changes

- 14e0395: Add opt-in identity-based SQL authentication: `ConnectionInfo` gains `authentication` and `identityClientId`, and the new `getTediousAuthentication` helper builds the tedious / mssql `authentication` block (SQL authentication, or `azure-active-directory-default` for the Workload Identity / Managed Identity / MSI / Default modes).

## 2.0.2

### Patch Changes

- c9bc584: Update dependencies and apply audit fixes.

## 2.0.1

### Patch Changes

- 6c440f8: Fix: Ensure correlation ID and tenant context are kept separate between concurrent calls.

## 2.0.0

### Major Changes

- d7203a5: Update all dependencies

## 1.2.0

### Minor Changes

- e15177b: Get all tenants/configurations

## 1.1.0

### Minor Changes

- d3737cf: New packages for logging and dependencies
