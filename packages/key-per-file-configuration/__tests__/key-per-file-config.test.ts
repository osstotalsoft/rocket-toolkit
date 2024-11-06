// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { load } from '../src'
import { vol } from 'memfs'

jest.mock('fs')
jest.mock('fs/promises')

describe('key-per-file configuration tests:', () => {
  const OLD_ENV = process.env
  const emptyLogger = { info: () => {}, debug: () => {} }
  
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
    vol.reset()
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('reads config from default location', async () => {
    //arrange
    const env1Value = 'ENV1-value'
    const env2Value = 'ENV2-value'
    vol.fromJSON({
      'runtime/config/ENV1': env1Value,
      'runtime/secrets/ENV2': env2Value
    })

    //act
    const watcher = load({ logger: emptyLogger })
    await watcher.close()

    //assert
    expect(process.env.ENV1).toBe(env1Value)
    expect(process.env.ENV2).toBe(env2Value)
  })

  it('fails to reads config from custom glob location', async () => {
    //arrange
    const env1Value = 'ENV1-value'
    const env2Value = 'ENV2-value'

    vol.fromJSON({
      'customLocation/config/ENV1': env1Value,
      'customLocation/secrets/ENV2': env2Value
    })

    //act
    const tryLoad = () => {
      const _watcher = load({ configPath: 'customLocation/**', logger: emptyLogger })
    }

    //assert
    expect(tryLoad).toThrow('Glob patterns are not supported in the config path')
  })

  it('reads config from custom direcotry location', async () => {
    //arrange
    const env1Value = 'ENV1-value'
    const env2Value = 'ENV2-value'

    vol.fromJSON({
      'customLocation/config/ENV1': env1Value,
      'customLocation/secrets/ENV2': env2Value
    })

    //act
    const watcher = load({ configPath: 'customLocation', logger: emptyLogger })
    await watcher.close()

    //assert
    expect(process.env.ENV1).toBe(env1Value)
    expect(process.env.ENV2).toBe(env2Value)
  })

  it('reads config from custom file location', async () => {
    //arrange
    const env1Value = 'ENV1-value'

    vol.fromJSON({
      'customLocation/config/ENV1': env1Value
    })

    //act
    const watcher = load({ configPath: 'customLocation/config/ENV1', logger: emptyLogger })
    await watcher.close()

    //assert
    expect(process.env.ENV1).toBe(env1Value)
  })

  it('watches for added files', async () => {
    //arrange
    const env1Value = 'ENV1-value'
    const env2Value = 'ENV2-value'

    vol.fromJSON({
      'runtime/ENV1': env1Value
    })

    //act
    const watcher = load({ logger: emptyLogger })
    vol.fromJSON({
      'runtime/ENV2': env2Value
    })

    await new Promise(r => setTimeout(r, 100))
    await watcher.close()

    //assert
    expect(process.env.ENV1).toBe(env1Value)
    expect(process.env.ENV2).toBe(env2Value)
  })

  it('watches for changes', async () => {
    //arrange
    const env1Value = 'ENV1-value'
    const env1ValueChanged = 'ENV1-value changed'

    vol.fromJSON({
      'runtime/ENV1': env1Value
    })

    //act
    const watcher = load({ logger: emptyLogger })
    vol.fromJSON({
      'runtime/ENV1': env1ValueChanged
    })

    await new Promise(r => setTimeout(r, 100))
    await watcher.close()

    //assert
    expect(process.env.ENV1).toBe(env1ValueChanged)
  })
})
