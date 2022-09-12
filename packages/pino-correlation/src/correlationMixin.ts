// Copyright (c) TotalSoft.
// This source code is licensed under the MIT license.

import { correlationManager } from '@totalsoft/correlation'

function correlationIdMixin(): { correlationId?: string } {
  return { correlationId: correlationManager.getCorrelationId() }
}

export default correlationIdMixin
