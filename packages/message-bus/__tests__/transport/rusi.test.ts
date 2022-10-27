import { rusi } from '../../src'
import { RusiConnection } from '../../src/transport/rusi/types'

jest.mock('@grpc/grpc-js')
jest.mock('@grpc/proto-loader')

import protoLoader from '@grpc/proto-loader'
import grpcJs, { GrpcObject } from '@grpc/grpc-js'

describe('Testing rusi transport connection', () => {
  let mockRusiClient: any = null
  const channelMock = {
    watchConnectivityState: jest.fn()
  }

  beforeEach(() => {
    protoLoader.loadSync = jest.fn(() => ({}))
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
      }))
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

  afterEach(() => {
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
    const c1: RusiConnection = await rusi.connect()
    const c2: RusiConnection = await rusi.connect()
    const c3: RusiConnection[] = await Promise.all([rusi.connect(), rusi.connect(), rusi.connect()])

    // assert
    expect(Object.is(c1._rusiClient, c2._rusiClient)).toBeTruthy()
    expect(Object.is(c1._rusiClient, c3[0]._rusiClient)).toBeTruthy()
    expect(Object.is(c1._rusiClient, c3[1]._rusiClient)).toBeTruthy()
    expect(Object.is(c1._rusiClient, c3[2]._rusiClient)).toBeTruthy()
  })
})
