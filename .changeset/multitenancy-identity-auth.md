---
'@totalsoft/multitenancy-core': minor
---

Add opt-in identity-based SQL authentication: `ConnectionInfo` gains `authentication` and `identityClientId`, and the new `getTediousAuthentication` helper builds the tedious / mssql `authentication` block (SQL authentication, or `azure-active-directory-default` for the Workload Identity / Managed Identity / MSI / Default modes).
