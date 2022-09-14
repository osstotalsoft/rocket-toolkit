# pino-multitenancy

This package provides a [pino mixin](https://github.com/pinojs/pino/blob/master/docs/api.md#mixin-function) for setting the tenant id property.

## Installation

```javascript
npm i @totalsoft/pino-multitenancy
```

or

```javascript
yarn add @totalsoft/pino-multitenancy
```
## Usage
```javascript
const { tenantIdMixin } = require('@totalsoft/pino-multitenancy')
import { pino } from 'pino'

const options = {
  mixin(_context, _level) {
    return tenantIdMixin()
  }
}

const logger = pino(options)
```