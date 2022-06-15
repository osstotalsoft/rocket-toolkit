# apollo-logger

A custom GraphQL logging library, that will helps you trace all the requests inside your server and more. 🚀

It will help you add logs on both HTTP and WS requests, inside resolvers, on a middleware function or anywhere you need. Plus, it also allows you to persist the logs in a file, a database, on the moon or wherever you desire 😁.

In addition, it comes with a cool feature called `securedMessages` which will make sure that sensitive error messages does not leak outside your server. All the errors thrown inside an Apollo Server, are wrapped in a 'user friendly message', helping increase the security of your server.

## Installation

```javascript
npm i @totalsoft/apollo-logger
```

or

```javascript
yarn add @totalsoft/apollo-logger
```

## Usage with Apollo Server plugins

```javascript
import { ApolloLoggerPlugin } from '@totalsoft/apollo-logger'
import { ApolloServer } from 'apollo-server'

const plugins = [ApolloLoggerPlugin({ ...options})]
const apollo = new ApolloServer({
  plugins,
  ...
})
```

See [Apollo Plugins](https://www.apollographql.com/docs/apollo-server/integrations/plugins/#installing-a-plugin) documentation for more information.

## Usage with GraphQL Subscriptions
The library exposes a method called  `initializeLogger`, which allows adding more logs outside of the basic Apollo plugin lifecycle.

For example, this is very useful with GraphQL Subscriptions. The Apollo plugin lifecycle methods only apply to HTTP calls, so here's a solution for you to also log messages on Subscrptions. 

```javascript
const { initializeLogger } = require('@totalsoft/apollo-logger')

const subscriptionServer = useServer(
     context: async (ctx, msg, _args) => {
        const { logInfo, logDebug, logError } = initializeLogger(...options)

        return {
            ...ctx,
            logger: { logInfo, logDebug, logError }
        }
      }
)
```
## Usage without Apollo 
To use the logger outside of an Apollo plugin, in a middleware function, in a resolver or wherever you need it, just use the `initializeLogger` again, as we previously did for [subscriptions](#usage-with-graphql-subscriptions) 

```javascript
const { initializeLogger } = require('@totalsoft/apollo-logger')

const { logInfo, logDebug, logError } = initializeLogger(...options)
```

## Configuration Options

### - Logging levels
Logs frequency can be configured by setting the `APOLLO_LOGGING_LEVEL` environment variable with one of the following logging level value:

```
'INFO' - Only logging when the request starts and if any errors occur.
'ERROR' - Only logging errors.
'DEBUG' - Logging everything 😁.

```
### - ApolloLoggingOptions
The `ApolloLoggerPlugin` class can be instantiated using the following configuration options:

```javascript
{
    // Indicates either the logs should be persisted or not
    persistLogs: boolean
    // Custom implementation that allows the user to persist the logs in a file, in a database or using some other technologies.
    persistLogsFn: (context: ApolloContextExtension) => void | Promise<void>
}
```

### - `initializeLogger` options

```javascript
{
    // Apollo context object or a custom one
    context: ApolloContextExtension | any,
    // Some operation name, request name, identifier name
    operationName: string,
    // If 'true', the errors messages are wrapped in a 'user friendly message'.
    securedMessages?: boolean,
    // Custom implementation that allows the user to persist the logs in a file, in a database or using some other technologies.
    persistLogsFn?: (context: ApolloContextExtension) => void | Promise<void>
}
```
