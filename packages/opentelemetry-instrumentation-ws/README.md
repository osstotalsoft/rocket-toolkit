# opentelemetry-instrumentation-ws

This package provides opentelemetry instrumentation for ws library.

## Installation

```javascript
npm i @totalsoft/opentelemetry-instrumentation-ws
```

or

```javascript
yarn add @totalsoft/opentelemetry-instrumentation-ws
```
## Usage
```javascript
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { KoaInstrumentation } = require('@opentelemetry/instrumentation-koa');

const provider = new NodeTracerProvider();
provider.register();

registerInstrumentations({
  instrumentations: [
    new WSInstrumentation(),
  ],
});
```
