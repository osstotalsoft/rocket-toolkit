import Koa from 'koa'
import { BaseContext } from '@apollo/server'

export type RouteHandler = (ctx: Koa.Context) => void

type OperationType = 'query' | 'mutation' | 'subscription'
export interface MetricsContext extends BaseContext {
  request?: {
    operationName?: string
  }
  operation?: {
    operation?: OperationType
  }
  errors?: Error[]
}

export interface SubscribePayload {
  readonly operationName?: string | null
}

export interface SubscribeMessage {
  readonly type: OperationType
  readonly payload: SubscribePayload
}
