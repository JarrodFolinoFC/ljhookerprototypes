import type { DueDateChange, JobTaskSnapshot } from '../types/propertyme'

const DAY_MS = 24 * 60 * 60 * 1000

const toEpoch = (iso: string | null): number | null => (iso ? new Date(iso).getTime() : null)

/**
 * Walks the stored snapshot history and emits one event every time a job task's
 * DueDate differs from the previous snapshot of that same job task.
 *
 * In production this runs in the sync job (or as a SQL window function / LAG over
 * the history table); it lives here so the prototype can derive changes from mock data.
 *
 * NOTE: PropertyMe's JobTask payload has no "UpdatedBy" field. `changedBy` uses
 * ManagerName from the snapshot carrying the new date, which is the assigned
 * manager, not necessarily the person who edited it.
 */
export function detectDueDateChanges(snapshots: readonly JobTaskSnapshot[]): DueDateChange[] {
  const byJob = new Map<string, JobTaskSnapshot[]>()
  for (const s of snapshots) {
    const list = byJob.get(s.task.Id)
    if (list) list.push(s)
    else byJob.set(s.task.Id, [s])
  }

  const changes: DueDateChange[] = []
  for (const history of byJob.values()) {
    history.sort((a, b) => a.retrievedAt.localeCompare(b.retrievedAt))
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1].task
      const curr = history[i]
      const prevEpoch = toEpoch(prev.DueDate)
      const newEpoch = toEpoch(curr.task.DueDate)
      if (prevEpoch === newEpoch) continue

      changes.push({
        key: `${curr.task.Id}:${curr.task.UpdatedOn}`,
        jobTaskId: curr.task.Id,
        displayNumber: curr.task.DisplayNumber,
        summary: curr.task.Summary,
        lotReference: curr.task.LotReference,
        status: curr.task.Status,
        taskType: curr.task.TaskType,
        previousDueDate: prev.DueDate,
        newDueDate: curr.task.DueDate,
        changedAt: curr.task.UpdatedOn,
        detectedAt: curr.retrievedAt,
        changedBy: curr.task.ManagerName,
        shiftDays:
          prevEpoch !== null && newEpoch !== null ? Math.round((newEpoch - prevEpoch) / DAY_MS) : null,
      })
    }
  }

  return changes.sort((a, b) => b.changedAt.localeCompare(a.changedAt))
}
