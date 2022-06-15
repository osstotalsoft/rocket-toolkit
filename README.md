# rocket-toolkit 👩‍🔧
This is a collection of plugins and other GraphQL utilities.

## Packages
  - [`apollo-logger`](./packages/zion#readme)

## Build
```javascript
yarn install
yarn build
```

## Test
```javascript
yarn test
```

## Add new changeset
```javascript
yarn changeset add
```
This command will ask you a series of questions, first about what packages you want to release, then what semver bump type for each package, then it will ask for a summary of the entire changeset. At the final step it will show the changeset it will generate, and confirm that you want to add it.

Once confirmed, the changeset will write a Markdown file that contains the summary and YAML front matter which stores the packages that will be released and the semver bump types for them.

## License
rocket-toolkit is licensed under the [MIT](LICENSE) license. @TotalSoft

## Contributing
When using Visual Studio Code please follow these steps: [Editor Setup for VSCode](https://yarnpkg.com/getting-started/editor-sdks#vscode) (allows VSCode to read .zip yarn cache files and supports features like go-to-definition).
