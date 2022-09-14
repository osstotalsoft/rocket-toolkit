# pino-opentracing

This package can be used to write the log event on the active opentracing span.

## Installation

```javascript
npm i @totalsoft/pino-opentracing
```

or

```javascript
yarn add @totalsoft/pino-opentracing
```

## Usage
```javascript
import { opentracingTransport } from '@totalsoft/pino-opentracing'
import { pino } from 'pino'

const destination = opentracingTransport()
const logger = pino({}, destination)
```