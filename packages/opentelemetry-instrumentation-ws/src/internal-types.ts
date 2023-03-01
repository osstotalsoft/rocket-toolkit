// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { Context, Span } from '@opentelemetry/api'

export interface ExtendedWebsocket extends WebSocket {
  _parentContext: Context
  _openSpan: Span | undefined
}
