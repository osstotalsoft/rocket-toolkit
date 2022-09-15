# graceful-shutdown

Graceful shutdown after intercepting signals and unhandled exceptions.

## Installation

```javascript
npm i @totalsoft/graceful-shutdown
```

or

```javascript
yarn add @totalsoft/graceful-shutdown
```

## Usage
```javascript
const { gracefulShutdown } = require('@totalsoft/graceful-shutdown')

async function cleanup() {
  // Perform cleanup before shutdown
}

gracefulShutdown({
  onShutdown: cleanup,
  terminationSignals: ["SIGINT", "SIGTERM", "SIGUSR1", "SIGUSR2"],
  unrecoverableEvents: ["uncaughtException", "unhandledRejection"],
  logger: console,
  timeout: 5000
})
```
## Options

``` javascript
export interface GracefulShutdownOptions {
  // Set an async handler to be called at shutdown
  onShutdown?: (_: any) => Promise<void>

  // Set a timeout in milliseconds to wait for graceful shutdown.
  timeout?: number

  // A list of signals that trigger shutdown (eg. SIGINT, SIGTERM).
  terminationSignals?: string[]

  // A list of process events that trigger shutdown (eg. `unrecoverableException`)
  unrecoverableEvents?: string[]

  // A logger for shutdown events
  logger?: Logger
}
```