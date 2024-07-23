# rocket-toolkit 👩‍🔧 

A collection of plugins and other GraphQL utilities.

## Packages
  - [apollo-logger](./packages/apollo-logger#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fapollo-logger.svg)](https://badge.fury.io/js/@totalsoft%2Fapollo-logger)
  - [correlation](./packages/correlation#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fcorrelation.svg)](https://badge.fury.io/js/@totalsoft%2Fcorrelation)
  - [graceful-shutdown](./packages/graceful-shutdown#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fgraceful-shutdown.svg)](https://badge.fury.io/js/@totalsoft%2Fgraceful-shutdown)
  - [key-per-file-configuration](./packages/key-per-file-configuration#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fkey-per-file-configuration.svg)](https://badge.fury.io/js/@totalsoft%2Fkey-per-file-configuration)
  - [knex-filters](./packages/knex-filters#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fknex-filters.svg)](https://badge.fury.io/js/@totalsoft%2Fknex-filters)
  - [message-bus](./packages/message-bus#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fmessage-bus.svg)](https://badge.fury.io/js/@totalsoft%2Fmessage-bus)
  - [multitenancy-core](./packages/multitenancy-core#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fmultitenancy-core.svg)](https://badge.fury.io/js/@totalsoft%2Fmultitenancy-core)
  - [opentelemetry-instrumentation-ws](./packages/opentelemetry-instrumentation-ws#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fopentelemetry-instrumentation-ws.svg)](https://badge.fury.io/js/@totalsoft%2Fopentelemetry-instrumentation-ws)
  - [opentracing](./packages/opentracing#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fopentracing.svg)](https://badge.fury.io/js/@totalsoft%2Fopentracing)
  - [pino-apollo](./packages/pino-apollo#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fpino-apollo.svg)](https://badge.fury.io/js/@totalsoft%2Fpino-apollo)
  - [pino-correlation](./packages/pino-correlation#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fpino-correlation.svg)](https://badge.fury.io/js/@totalsoft%2Fpino-correlation)
  - [pino-mssqlserver](./packages/pino-mssqlserver#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fpino-mssqlserver.svg)](https://badge.fury.io/js/@totalsoft%2Fpino-mssqlserver)
  - [pino-multitenancy](./packages/pino-multitenancy#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fpino-multitenancy.svg)](https://badge.fury.io/js/@totalsoft%2Fpino-multitenancy)
  - [pino-opentelemetry](./packages/pino-opentelemetry#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fpino-opentelemetry.svg)](https://badge.fury.io/js/@totalsoft%2Fpino-opentelemetry)
  - [pino-opentracing](./packages/pino-opentracing#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fpino-opentracing.svg)](https://badge.fury.io/js/@totalsoft%2Fpino-opentracing)     

## Contributing guide
When using Visual Studio Code please follow these steps: [Editor Setup for VSCode](https://yarnpkg.com/getting-started/editor-sdks#vscode) (allows VSCode to read .zip yarn cache files and supports features like go-to-definition).

When using Visual Studio Code please use the extension [`Licenser`](https://marketplace.visualstudio.com/items?itemName=ymotongpoo.licenser) for applying the license header in files.
### - Build
```javascript
yarn install
yarn build
```
### - Test
```javascript
yarn test
```

### - Testing local packages
To test your package locally without publishing to a npm repository, you can create a link in your testing project. For example:
```shell
npm link <YOUR_PATH>\rocket-toolkit\packages\key-per-file-configuration
```

If the package reference does not already exist in your testing project, you can add it without specifying the version:
```json
{
  "dependencies": {
    ...
    "@totalsoft/key-per-file-configuration": "",
  }
}
```
For additional options see the [official documentation](https://docs.npmjs.com/cli/v8/commands/npm-link)

### - Pull Request
Every change/feature/fix must result in a Pull Request. Before creating the PR make sure that all the tests are passing.

### - Add new changeset
Every Pull request MUST be associated to a changeset. To add a new changeset use the following command: 
```javascript
yarn changeset add
```
This command will ask you a series of questions, first about what packages you want to release, then what semver bump type for each package, then it will ask for a summary of the entire changeset. At the final step it will show the changeset it will generate, and confirm that you want to add it.

Once confirmed, the changeset will write a Markdown file that contains the summary and YAML front matter which stores the packages that will be released and the semver bump types for them.

Read more about changesets [here](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md).

## License
rocket-toolkit is licensed under the [MIT](LICENSE) license. @TotalSoft

