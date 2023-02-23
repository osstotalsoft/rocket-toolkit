# pino-opentelemetry

This package can be used to write the log event on the active opentelemetry tracing span.

## Installation

```javascript
npm i @totalsoft/pino-opentelemetry
```

or

```javascript
yarn add @totalsoft/pino-opentelemetry
```

## Usage
```javascript
import { openTelemetryTracingTransport } from '@totalsoft/pino-opentelemetry'
import { pino } from 'pino'

const destination = openTelemetryTracingTransport()
const logger = pino({}, destination)
```