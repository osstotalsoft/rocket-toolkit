import { EventEmitter } from 'stream'
import { setTimeout } from 'timers/promises'

describe('graceful shutdown tests:', () => {
  const systemProcess = process
  beforeEach(() => {
    jest.resetModules()
    process = <any>new EventEmitter()
    process.exit = <any>jest.fn()
  })
  afterEach(() => {
    process.removeAllListeners()
  })
  afterAll(() => {
    process = systemProcess
  })

  const emptyLogger = { info: () => {}, error: () => {} }

  it('handles default shutdown signal', async () => {
    //arrange
    const onShutdown = jest.fn()
    const { gracefulShutdown } = require('../src')
    gracefulShutdown({
      onShutdown,
      logger: emptyLogger
    })

    //act
    process.emit('SIGINT')

    //assert
    expect(onShutdown).toBeCalled()
  })

  it('handles custom shutdown signal', async () => {
    //arrange
    const onShutdown = jest.fn()
    const { gracefulShutdown } = require('../src')
    gracefulShutdown({
      onShutdown,
      terminationSignals: ['BAU'],
      logger: emptyLogger
    })

    //act
    process.emit(<any>'BAU')

    //assert
    expect(onShutdown).toBeCalled()
  })

  it('handles default unrecoverable event', async () => {
    //arrange
    const onShutdown = jest.fn()
    const { gracefulShutdown } = require('../src')
    gracefulShutdown({
      onShutdown,
      logger: emptyLogger
    })

    //act
    process.emit('uncaughtException', new Error())

    //assert
    expect(onShutdown).toBeCalledWith(expect.stringContaining('uncaughtException'))
  })

  it('logs shutdown events', async () => {
    //arrange
    const onShutdown = jest.fn()
    const { gracefulShutdown } = require('../src')
    const logger = { error: jest.fn(), info: jest.fn() }

    gracefulShutdown({
      onShutdown,
      logger
    })

    //act
    process.emit('SIGINT')

    //assert
    expect(logger.info).toBeCalledWith(expect.stringContaining('Shutdown'))
  })

  it('logs unrecoverable events', async () => {
    //arrange
    const onShutdown = jest.fn()
    const { gracefulShutdown } = require('../src')
    const logger = { error: jest.fn(), info: jest.fn() }
    const error = new Error('MyException')

    gracefulShutdown({
      onShutdown,
      logger
    })

    //act
    process.emit('uncaughtException', new Error('MyException'))

    //assert
    expect(logger.info).toBeCalledWith(expect.stringContaining('Shutdown'))
    expect(logger.error).toBeCalledWith(error, expect.stringContaining('uncaughtException'))
  })

  it('handles shutdown errors', async () => {
    //arrange
    const error = new Error('MyException')
    const handler = () => {
      throw error
    }
    const { gracefulShutdown } = require('../src')
    const logger = { error: jest.fn(), info: jest.fn() }

    gracefulShutdown({
      onShutdown: handler,
      logger
    })

    //act
    process.emit('SIGINT')

    //assert
    expect(logger.info).toBeCalledWith(expect.stringContaining('Shutdown'))
    expect(logger.error).toBeCalledWith(error, expect.anything())
    expect(process.exit).toHaveBeenCalled()
  })

  it('exits after shutdown', async () => {
    //arrange
    const handler = async () => {
      await setTimeout(10)
    }
    const { gracefulShutdown } = require('../src')
    const logger = { error: jest.fn(), info: jest.fn() }

    gracefulShutdown({
      onShutdown: handler,
      timeout: 1,
      logger
    })

    //act
    process.emit('SIGINT')
    await setTimeout(50)

    //assert
    expect(logger.error).toBeCalledWith(expect.stringContaining('Timeout'))
    expect(process.exit).toHaveBeenCalled()
  })
})
