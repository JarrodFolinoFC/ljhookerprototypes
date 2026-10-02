import type { Dayjs } from 'dayjs'
import { mockSnapshots } from '../data/mockHistory'
import { detectDueDateChanges } from '../domain/detectDueDateChanges'
import type { DueDateChange } from '../types/propertyme'

export const PROPERTYME_JOB_URL = (jobTaskId: string) =>
  `https://app.propertyme.com/#/jobs/card/${encodeURIComponent(jobTaskId)}`

export interface DueDateChangesQuery {
  from: Dayjs
  to: Dayjs
}

export interface DueDateChangesResponse {
  changes: DueDateChange[]
  lastSyncedAt: string | null
}

const allChanges = detectDueDateChanges(mockSnapshots)
const lastSyncedAt = mockSnapshots.reduce<string | null>(
  (max, s) => (max === null || s.retrievedAt > max ? s.retrievedAt : max),
  null,
)

/**
 * Prototype stand-in for `GET /api/reports/due-date-changes?from=&to=`.
 * The real backend would query the snapshot history table instead.
 */
export async function fetchDueDateChanges({ from, to }: DueDateChangesQuery): Promise<DueDateChangesResponse> {
  await new Promise((r) => setTimeout(r, 250))
  const fromMs = from.valueOf()
  const toMs = to.valueOf()
  return {
    changes: allChanges.filter((c) => {
      const at = new Date(c.changedAt).getTime()
      return at >= fromMs && at <= toMs
    }),
    lastSyncedAt,
  }
}

/** Prototype stand-in for `GET /api/reports/due-date-changes/:jobTaskId` (all time, newest first). */
export async function fetchJobDueDateHistory(jobTaskId: string): Promise<DueDateChange[]> {
  await new Promise((r) => setTimeout(r, 150))
  return allChanges.filter((c) => c.jobTaskId === jobTaskId)
}
