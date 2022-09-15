// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { correlationManager } from '@totalsoft/correlation'

/**
 * Creates a pino mixin object containing the current correlation id
 * @returns - the pino mixin object
 */
function correlationIdMixin(): { correlationId?: string } {
  return { correlationId: correlationManager.getCorrelationId() }
}

export default correlationIdMixin
