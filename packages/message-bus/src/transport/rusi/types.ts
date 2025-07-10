// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import grpc from '@grpc/grpc-js'
import EventEmitter from 'events'
import { Headers } from '../../types.js'
import { Subscription } from '../types.js'

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

export interface RusiSubscription extends Subscription {
  _call?: grpc.ClientDuplexStream<any, any>
}

export interface RusiClient extends EventEmitter {
  close: () => void
  getChannel: () => RusiChannel
  waitForReady: (deadline: number, callback: RusiListener) => void
  Publish: (publishRequest: Request, callback: RusiListener) => any
  Subscribe: () => grpc.ClientDuplexStream<any, any>
}

export type RusiGrpc = (grpc.ProtobufTypeDefinition | grpc.GrpcObject | grpc.ServiceClientConstructor) & { proto?: any }

export type RusiChannel = {
  watchConnectivityState: (state: grpc.connectivityState, deadline: number, callback: RusiListener) => void
  getConnectivityState: (tryConnect: boolean) => grpc.connectivityState
}

export interface RusiConnection extends EventEmitter {
  _rusiClient?: RusiClient
}
