// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import * as chokidar from 'chokidar'
import * as path from 'path'
import * as fs from 'fs'
import * as glob from 'glob'
import { ConfigWatcher, Logger, Options } from './types'

const { KEY_PER_FILE_CONFIG_PATH } = process.env
const defaultConfigPath = 'runtime'

export function load(options?: Options): ConfigWatcher {
  const configFolderPath = _getAbsolutePath(options?.configPath)
  const logger = options?.logger ?? console

  logger.info(`Loading "Key per File" configuration at: ${configFolderPath}`)

  // Load files to env
  const filePaths = _getFilePaths(configFolderPath)
  const loadValue = _loadValue(logger)
  filePaths.forEach(loadValue)

  // Watch for file changes
  const watcher = chokidar
    .watch(configFolderPath, { awaitWriteFinish: true /*, usePolling: true*/ })
    .on('unlink', _removeValue)
    .on('add', loadValue)
    .on('change', loadValue)

  return { close: () => watcher.close() }
}

function _getAbsolutePath(configPath = KEY_PER_FILE_CONFIG_PATH || defaultConfigPath): string {
  const cleanConfigPath = path.join(process.cwd(), configPath)

  if (glob.hasMagic(cleanConfigPath)) {
    throw 'Glob patterns are not supported in the config path'
  }

  return cleanConfigPath
}

function _getFilePaths(configPath: string) {

    if (!fs.existsSync(configPath) || fs.lstatSync(configPath).isDirectory()) {
      configPath = path.join(configPath, '**')
    }

    configPath = configPath.replace(/\\/g, '/')

    return glob.sync(configPath, { nodir: true })
}

function _loadValue(logger: Logger) {
  return function (filePath: string) {
    const key = path.basename(filePath)
    const value = fs.readFileSync(filePath).toString()

    const oldValue = process.env[key]
    if (oldValue != undefined && oldValue !== value) {
      logger.debug(`Refreshed env: ${key}`)
    }

    process.env[key] = value
  }
}

function _removeValue(filePath: string) {
  const key = path.basename(filePath)
  process.env[key] = undefined
}
