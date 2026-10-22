// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { EventEmitter } from 'events'
import type { Context, Envelope, MessageBus, SubscriptionOptions } from '@totalsoft/message-bus'

export interface MessagingHostContext extends Context {
  received: {
    topic: string
    msg: Envelope<any>
  }
}

export type MessagingHostMiddleware = (ctx: MessagingHostContext, next: () => Promise<void>) => Promise<void>

export type ErrorStrategy = (err: Error, cn: EventEmitter | null, msgHost: MessagingHost) => void

export interface ErrorStrategies {
  none: ErrorStrategy
  throw: ErrorStrategy
  retry: ErrorStrategy
}

/**
 * Represents the messaging host that handles message processing and subscriptions.
 * Emits the 'starting', 'started', 'stopping' and 'stopped' lifecycle events.
 */
export interface MessagingHost extends EventEmitter {
  /**
   * Hooks a middleware in the message processing pipeline.
   * @param middleware - The middleware function to be hooked.
   * @returns The messaging host instance.
   * @see https://github.com/osstotalsoft/rocket-toolkit/tree/main/packages/messaging-host#middleware-func
   */
  use: (middleware: MessagingHostMiddleware) => MessagingHost

  /**
   * Instructs the messaging host to subscribe to a topic list.
   * @param topics - The list of topics to subscribe to.
   * @param opts - The subscription options.
   * @returns The messaging host instance.
   * @see https://github.com/osstotalsoft/rocket-toolkit/tree/main/packages/messaging-host#subscriptions
   */
  subscribe: (topics: string[], opts?: SubscriptionOptions) => MessagingHost

  /**
   * Sets the handler for connection errors.
   * @param handler - The connection error strategy.
   * @returns The messaging host instance.
   */
  onConnectionError: (handler: ErrorStrategy) => MessagingHost

  /**
   * Sets the handler for subscription-level errors (e.g. stream closed by the transport sidecar).
   * @param handler - The error strategy.
   * @returns The messaging host instance.
   */
  onSubscriptionError: (handler: ErrorStrategy) => MessagingHost

  /**
   * Starts the messaging host.
   * @returns A promise that resolves to the messaging host instance.
   */
  start: () => Promise<MessagingHost>

  /**
   * Stops the messaging host.
   * @returns A promise that resolves when the messaging host is stopped.
   */
  stop: () => Promise<void>

  /**
   * Stops the messaging host immediately without waiting for pending operations to complete.
   */
  stopImmediate: () => void

  /**
   * Checks if the messaging host is running.
   * @returns A boolean indicating whether the messaging host is running or not.
   */
  isRunning: () => boolean

  /** @internal */
  _contextFactory: (topic: string, msg: Envelope<any>) => MessagingHostContext

  /** @internal */
  _messageBus: MessageBus
}
