# pino-correlation

This package provides a [pino mixin](https://github.com/pinojs/pino/blob/master/docs/api.md#mixin-function) for setting the correlation id property on the log event.

## Installation

```javascript
npm i @totalsoft/pino-correlation
```

or

```javascript
yarn add @totalsoft/pino-correlation
```
## Usage
```javascript
const { correlationMixin } = require('@totalsoft/pino-correlation');
import { pino } from 'pino'

const options = {
  mixin(_context, _level) {
    return correlationMixin()
  }
}

const logger = pino(options);
```
