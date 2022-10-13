import grpc from '@grpc/grpc-js'
import EventEmitter from 'events'
import { Headers } from '../../types'

export type Options = {
  [index: string]: { value: any }
}

export type Request = {
  pubsub_name?: string
  topic: string
  data?: any
  data_content_type?: string
  metadata?: Headers
  options?: Options
}

export type RusiListener = (...args: any[]) => void

export interface RusiSubscription extends EventEmitter {
  write?: (options: any) => void
  cancel?: () => void
  end?: () => void
}

export interface RusiClient extends EventEmitter {
  close: () => void
  getChannel: () => RusiChannel
  waitForReady: (deadline: number, callback: RusiListener) => void
  Publish: (publishRequest: Request, callback: RusiListener) => any
  Subscribe: () => RusiSubscription
}

export type RusiGrpc = (grpc.ProtobufTypeDefinition | grpc.GrpcObject | grpc.ServiceClientConstructor) & { proto?: any }

export type RusiChannel = {
  watchConnectivityState: (state: grpc.connectivityState, deadline: number, callback: RusiListener) => void
  getConnectivityState: (tryConnect: boolean) => grpc.connectivityState
}

export interface RusiConnection extends EventEmitter {
  _rusiClient?: RusiClient
}
