# pino-apollo

An [apollo server](https://github.com/apollographql/apollo-server) plugin that logs the main events related to a request. It uses the [pino](https://github.com/pinojs/pino) logger.

In addition, it comes with a cool feature called `securedMessages` which will make sure that sensitive error messages does not leak outside your server. All the errors thrown inside an Apollo Server, are wrapped in a 'user friendly message', helping increase the security of your server.

## Installation

```javascript
npm i @totalsoft/pino-apollo
```

or

```javascript
yarn add @totalsoft/pino-apollo
```

## Usage with Apollo Server plugins

```javascript
import { ApolloLoggerPlugin } from '@totalsoft/pino-apollo'
import { ApolloServer } from 'apollo-server'
import pino from 'pino'

const logger = pino()

const plugins = [ApolloLoggerPlugin({ logger, securedMessages: false})]
const apollo = new ApolloServer({
  plugins,
  ...
})
```

See [Apollo Plugins](https://www.apollographql.com/docs/apollo-server/integrations/plugins/#installing-a-plugin) documentation for more information.


## Configuration Options

### - ApolloLoggingOptions
The `ApolloLoggerPlugin` class can be instantiated using the following configuration options:

```javascript
{
  // Pre-configured pino logger. Default is `console`.
  logger: Logger
  // If 'true', errors thrown inside Apollo Server are wrapped in a 'user friendly message'. Default is 'true'.
  securedMessages?: boolean
}
```


