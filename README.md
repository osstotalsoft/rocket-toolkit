# rocket-toolkit 👩‍🔧 

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/osstotalsoft/rocket-toolkit/npm-publish)

A collection of plugins and other GraphQL utilities.

## Packages
  - [apollo-logger](./packages/apollo-logger#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fapollo-logger.svg)](https://badge.fury.io/js/@totalsoft%2Fapollo-logger)
  - [key-per-file-configuration](./packages/key-per-file-configuration#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Fkey-per-file-configuration.svg)](https://badge.fury.io/js/@totalsoft%2Fkey-per-file-configuration)
  - [tenant-configuration](./packages/tenant-configuration#readme) [![npm version](https://badge.fury.io/js/@totalsoft%2Ftenant-configuration.svg)](https://badge.fury.io/js/@totalsoft%2Ftenant-configuration)

## Contributing guide
When using Visual Studio Code please follow these steps: [Editor Setup for VSCode](https://yarnpkg.com/getting-started/editor-sdks#vscode) (allows VSCode to read .zip yarn cache files and supports features like go-to-definition).
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

