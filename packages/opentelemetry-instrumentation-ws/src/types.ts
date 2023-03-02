import { Span } from '@opentelemetry/api'
import { InstrumentationConfig } from '@opentelemetry/instrumentation'

export interface HookInfo {
  payload: any | any[]
}

export type HookFunction = (span: Span, hookInfo: HookInfo) => void

export interface WSInstrumentationConfig extends InstrumentationConfig {
  /** generate spans for each sent websocket  message. Default true. */
  generateSendSpans?: boolean
  /** generate spans for each received websocket message. Default true. */
  generateReceiveSpans?: boolean
  /** Hook for adding custom attributes before ws sends a message */
  sendHook?: HookFunction
  /** Hook for adding custom attributes before ws closes a socket */
  closeHook?: HookFunction
  /** Hook for adding custom attributes before a ws server upgrades a request */
  handleUpgradeHook?: HookFunction,
  /** max message length in the message attribute. "..." is added to the end when the message is truncated. 
   * Set 0 to omit the message attribute. Default 1022.  */
  maxMessageLength?: number
}
