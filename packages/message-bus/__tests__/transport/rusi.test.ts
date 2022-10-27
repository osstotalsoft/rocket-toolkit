import { rusi } from '../../src'
import { RusiConnection, RusiChannel } from '../../src/transport/rusi/types'

jest.mock('@grpc/grpc-js')
jest.mock('@grpc/proto-loader')

import protoLoader from '@grpc/proto-loader'
import grpcJs, { GrpcObject } from '@grpc/grpc-js'

describe('Testing rusi transport connection', () => {
  let mockRusiClient: any = null
  let channelMock: RusiChannel | null = null

  beforeEach(() => {
    protoLoader.loadSync = jest.fn(() => ({}))

    channelMock = {
      watchConnectivityState: jest.fn(),
      getConnectivityState: jest.fn()
    }

    mockRusiClient = {
      waitForReady: jest.fn((_deadline, callback) => {
        callback()
      }),
      getChannel: jest.fn(() => channelMock),
      Publish: jest.fn((req, cb) => {
        setTimeout(cb, 10)
      }),
      Subscribe: jest.fn(_req => ({
        cancel: jest.fn(),
        end: jest.fn(),
        write: jest.fn()
      })),
      close: jest.fn()
    }

    grpcJs.loadPackageDefinition = jest.fn(
      () =>
        ({
          rusi: {
            proto: {
              runtime: {
                v1: {
                  Rusi: jest.fn(() => mockRusiClient)
                } as unknown
              }
            }
          }
        } as GrpcObject)
    )
  })

  afterEach(async () => {
    await rusi.disconnect()
    jest.resetAllMocks()
    jest.resetModules()
  })

  test('if the proto loader fails', async () => {
    // arrange
    protoLoader.loadSync = jest.fn(() => {
      throw new Error('Loading failed!')
    })

    // act
    await expect(rusi.connect()).rejects.toMatchObject({ message: 'Loading failed!' })

    // assert
    expect(protoLoader.loadSync).toBeCalled()
    expect(grpcJs.loadPackageDefinition).not.toHaveBeenCalled()
  })

  test('connect generates a single connection', async () => {
    // arrange

    // act
    const c3: RusiConnection[] = await Promise.all([rusi.connect(), rusi.connect(), rusi.connect()])
    const c1: RusiConnection = await rusi.connect()
    const c2: RusiConnection = await rusi.connect()

    // assert
    expect(Object.is(c1._rusiClient, c2._rusiClient)).toBeTruthy()
    expect(Object.is(c1._rusiClient, c3[0]._rusiClient)).toBeTruthy()
    expect(Object.is(c1._rusiClient, c3[1]._rusiClient)).toBeTruthy()
    expect(Object.is(c1._rusiClient, c3[2]._rusiClient)).toBeTruthy()
  })

  test('protoLoader creates the definition used for GRPC package definition', async () => {
    // arrange
    const definition = { fake: {} }
    protoLoader.loadSync = jest.fn(() => definition)

    // act
    await rusi.connect()

    // assert
    expect(grpcJs.loadPackageDefinition).toBeCalledWith(definition)
  })
})
