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
const { WSInstrumentation } = require('@totalsoft/opentelemetry-instrumentation-ws');

const provider = new NodeTracerProvider();
provider.register();

registerInstrumentations({
  instrumentations: [
    new WSInstrumentation(),
  ],
});
```

## Config

The `ws` instrumentation has few options available to choose from. You can set the following:

| Options             | Type                                     | Description                                                                                                    |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `generateSendSpans`         | boolean                                  | should the tracing library add spans for each sent message. Default: false                                     |
| `generateReceiveSpans`     | boolean                                  | should the tracing library add spans for each incoming message. Default: false                           |
| `sendHook`          | (span: Span, hookInfo: HookInfo) => void | hook for adding custom attributes to the ws send span when a websocket sends a message                         |
| `closeHook`         | (span: Span, hookInfo: HookInfo) => void | hook for adding custom attributes to the ws close span when a websocket is imperatively closed                 |
| `handleUpgradeHook` | (span: Span, hookInfo: HookInfo) => void | hook for adding custom attributes to the ws.Server handleUpgrade span when a socket is opened against a server |
| `maxMessageLength` | number | max message length in the message attribute. "..." is added to the end when the message is truncated. Set 0 to omit the message attribute. Default: 1022. |
