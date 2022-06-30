# key-per-file-configuration

A module that loads environment variables from files on the disk. Each file is loaded into a process environment variable using the following convention:
- file name -> environment variable name
- file contents -> environment variable contents


The files are loaded and monitored from the given `configPath` (default 'runtime' folder). This path can be a folder that is scanned recursively, or it can be a [glob](https://github.com/isaacs/node-glob#glob-primer) pattern.

## Installation

```javascript
npm i @totalsoft/key-per-file-configuration
```

or

```javascript
yarn add @totalsoft/key-per-file-configuration
```

## Usage

```javascript
const keyPerFileConfig = require('@totalsoft/key-per-file-configuration')
keyPerFileConfig.load({configPath: 'runtime'})
```


###  `load` options


```javascript
 Options {
    // The path where the configuration files can be found (supports glob)
    configPath?: string;
}
```
