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
  const cleanConfigPath = _cleanConfigPath(options?.configPath)
  const logger = options?.logger ?? console

  logger.info(`Loading "Key per File" configuration at: ${cleanConfigPath}`)

  // Load files to env
  const filePaths = glob.sync(cleanConfigPath, { nodir: true })
  const loadValue = _loadValue(logger)
  filePaths.forEach(loadValue)

  // Watch for file changes
  const watcher = chokidar
    .watch(cleanConfigPath, { awaitWriteFinish: true /*, usePolling: true*/ })
    .on('unlink', _removeValue)
    .on('add', loadValue)
    .on('change', loadValue)

  return { close: () => watcher.close() }
}

function _cleanConfigPath(configPath = KEY_PER_FILE_CONFIG_PATH || defaultConfigPath): string {
  let cleanConfigPath = path.join(process.cwd(), configPath)

  if (!glob.hasMagic(cleanConfigPath)) {
    if (!fs.existsSync(cleanConfigPath) || fs.lstatSync(cleanConfigPath).isDirectory()) {
      cleanConfigPath = path.join(cleanConfigPath, '**')
    }
  }

  // glob only works with forward slashes
  cleanConfigPath = cleanConfigPath.replace(/\\/g, '/')

  return cleanConfigPath
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
