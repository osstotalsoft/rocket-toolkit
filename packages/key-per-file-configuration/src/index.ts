// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import * as chokidar from 'chokidar'
import * as path from 'path'
import * as fs from 'fs'
import * as glob from 'glob'

const { KEY_PER_FILE_CONFIG_PATH } = process.env
const defaultConfigPath = 'runtime'

export interface Options {
  configPath?: string
}

export interface ConfigWatcher{
  close: () => Promise<void>
}

export function load(options?: Options) : ConfigWatcher {
  const cleanConfigPath = _cleanConfigPath(options?.configPath)

  console.info(`Loading "Key per File" configuration at: ${cleanConfigPath}`)

  // Load files to env
  const filePaths = glob.sync(cleanConfigPath, { nodir: true })
  filePaths.forEach(_loadValue)

  // Watch for file changes
  const watcher = chokidar
    .watch(cleanConfigPath, { awaitWriteFinish: true /*, usePolling: true*/ })
    .on('unlink', _removeValue)
    .on('add', _loadValue)
    .on('change', _loadValue)

  return { close: () => watcher.close()}
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

function _loadValue(filePath: string) {
  const key = path.basename(filePath)
  const value = fs.readFileSync(filePath).toString()

  const oldValue = process.env[key]
  if (oldValue != undefined && oldValue !== value) {
    console.debug(`Refreshed env: ${key}`)
  }

  process.env[key] = value
}

function _removeValue(filePath: string) {
  const key = path.basename(filePath)
  process.env[key] = undefined
}

module.exports = { load }
