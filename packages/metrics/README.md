# metrics and diagnostics

⚙️ This plugin integrates metrics and diagnostics features, which can help in tracking and measuring GraphQL request performance along with monitoring server performance.

**Metrics**: This plugin is designed to track and measure the performance of requests in a server, typically used with an Apollo GraphQL server. The plugin integrates with the lifecycle of a request to record key metrics like the number of requests, failures, and the time taken to process each request.

**Diagnostics**: This plugin provides a diagnostics server exposing memory usage information and heap snapshots, which can help identify and troubleshoot bottlenecks or memory issues.

## Installation

```javascript
npm i @totalsoft/metrics
```

or

```javascript
yarn add @totalsoft/metrics
```

## Usage

```javascript
// adding the plugin to Apollo Server
const { createMetricsPlugin } = require('@totalsoft/metrics')

const apolloServer = new ApolloServer({
  ...otherOptions,
  plugins: [...otherPlugins, createMetricsPlugin()]
})

//starting the servers
const { startMetrics } = require('@totalsoft/metrics')
const { startDiagnostics } = require('@totalsoft/metrics')

const pino = require('pino')
const streams = pino.multistream([...options])
const logger = pino(options, streams)

// Starting the metrics server
// Uses PrometheusExporter.DEFAULT_OPTIONS.port
startMetrics(logger) 

//starting the diagnostics server
// Uses DIAGNOSTICS_PORT from env
startDiagnostics(logger)

```

## Usage with Subscriptions

The library exposes a method called `recordSubscriptionStarted`, which allows recording subscriptions messages.

```javascript
const { recordSubscriptionStarted } = require('@totalsoft/metrics')

//It can be used on the onSubscribe hook of a WebSocket server setup.
const { useServer } = require('graphql-ws/lib/use/ws')
useServer({
  ...otherOptions,
  onSubscribe: async (_ctx, msg) => {
    recordSubscriptionStarted(msg)
  }
})

```
