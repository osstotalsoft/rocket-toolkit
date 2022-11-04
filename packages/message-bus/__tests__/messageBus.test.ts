import Bluebird from 'bluebird'
import EventEmitter from 'events'
import { Context, envelope, SerDes } from '../src'
import { messageBus, useSerDes, useTransport } from '../src/messageBus'
import { Subscription, Transport } from '../src/transport/types'

describe('testing message bus', () => {
  let mockSerDes: SerDes | null = null
  let mockTransport: Transport | null = null

  beforeEach(() => {
    mockSerDes = {
      serialize: jest.fn(),
      deSerialize: jest.fn(),
      deSerializePayload: jest.fn(),
      getInfo: jest.fn()
    }
    mockTransport = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      publish: jest.fn(),
      subscribe: jest.fn()
    }

    useSerDes(mockSerDes)
    useTransport(mockTransport)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('publish calls transport publish', async () => {
    // arrange
    if (!mockTransport) fail()
    const sut = messageBus()

    // act
    await sut.publish('test topic', {})

    // assert
    expect(mockTransport.publish).toBeCalled()
  })

  test('if transport fails an error is thrown', async () => {
    // arrange
    if (!mockTransport) fail()
    mockTransport.publish = jest.fn(() => {
      throw new Error('Test message')
    })
    const sut = messageBus()

    // act - assert
    await expect(sut.publish('test topic', {})).rejects.toMatchObject({
      message: 'Message publishing failed! The following error was encountered: Error: Test message'
    })
  })

  test('subscribe calls transport subscription', async () => {
    // arrange
    if (!mockTransport) fail()
    const sut = messageBus()

    // act
    await sut.subscribe('test topic', jest.fn())

    // assert
    expect(mockTransport.subscribe).toBeCalled()
  })

  test('sendCommandAndReceiveEvent opens a subscription for each event', async () => {
    // arrange
    const events = ['1', '2', '3']
    const sut = messageBus()

    // act
    await expect(
      sut.sendCommandAndReceiveEvent('test topic', 'test command', events, undefined, undefined, 1)
    ).rejects.toThrow()

    // assert
    expect(mockTransport?.subscribe).toBeCalledTimes(3)
    expect(mockTransport?.publish).toBeCalledTimes(1)
  })
})
