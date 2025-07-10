// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { Subscription, Transport } from './transport/types'

export interface Context {
  correlationId?: any
  tenantId?: any
  [propName: string]: any
}

export interface Headers {
  [propName: string]: any
}

export interface Envelope<T> {
  payload: T
  headers: Headers
}

export type EnvelopeCustomizer = (headers: Headers) => Headers

export type EnvelopeType = {
  <T>(payload: T, ctx?: Context, envelopeCustomizer?: EnvelopeCustomizer): Envelope<T>
  headers: Headers
  getCorrelationId: (msg: Envelope<any>) => any
  getTenantId: (msg: Envelope<any>) => any
  getSource: (msg: Envelope<any>) => any
}

export enum SubscriptionOptions {
  /**
   * Event driven subscriptions: durable, at-least-once, within a queue group
   * @see https://github.com/osstotalsoft/rocket-toolkit/tree/main/packages/message-bus#subscription--options
   */
  STREAM_PROCESSOR = 0,
  /**
   * Pub sub subscriptions: lite weight, non-durable, at-most-once, within a queue group
   * @see https://github.com/osstotalsoft/rocket-toolkit/tree/main/packages/message-bus#subscription--options
   */
  PUB_SUB,
  /**
   * RPC subscriptions: lite weight, non-durable, at-most-once, without queue group
   * @see https://github.com/osstotalsoft/rocket-toolkit/tree/main/packages/message-bus#subscription--options
   */
  RPC
}

export interface SerDesInfo {
  contentType: string
}

export interface SerDes {
  serialize: (msg: any) => string
  deSerialize: (data: string) => Envelope<any>
  deSerializePayload: (payload: string) => any
  getInfo: () => SerDesInfo
}

export type MessageBusHandler = (msg: Envelope<any>) => Promise<void>

export interface MessageBus {
  /**
   * Envelopes, serializes and publishes a message on a certain topic
   * @see https://github.com/osstotalsoft/rocket-toolkit/tree/main/packages/message-bus#publish
   */
  publish<T>(topic: string, msg: T, ctx?: Context, envelopeCustomizer?: EnvelopeCustomizer): Promise<Envelope<T>>

  /**
   * Subscribes a handler to a given topic, with the provided options
   * Deserializes the message before calling the handler
   * @see https://github.com/osstotalsoft/rocket-toolkit/tree/main/packages/message-bus#subscribe
   */
  subscribe(topic: string, handler: MessageBusHandler, opts?: SubscriptionOptions): Promise<Subscription>

  /**
   * Implements a form of request/response communication over messaging
   * @see https://github.com/osstotalsoft/rocket-toolkit/tree/main/packages/message-bus#request--response-over-messaging
   */
  sendCommandAndReceiveEvent(
    topic: string,
    command: any,
    events: string[],
    ctx?: Context,
    envelopeCustomizer?: EnvelopeCustomizer,
    timeoutMs?: number
  ): Promise<[string, any]>

  /**
   * The Transport used
   */
  transport: Transport

  /**
   * The [de]serialization used
   */
  serDes: SerDes
}
