import { describe, expect, it } from 'vitest'
import type { JobTaskSnapshot, PropertyMeJobTask } from '../types/propertyme'
import { detectDueDateChanges } from './detectDueDateChanges'

const task = (overrides: Partial<PropertyMeJobTask>): PropertyMeJobTask =>
  ({
    Id: 'job-1',
    DisplayNumber: 'J-0001',
    Summary: 'Leaking tap',
    LotReference: '12/34 Collins St',
    Status: 'Assigned',
    TaskType: 'Job',
    ManagerName: 'Sarah Nguyen',
    DueDate: '2026-10-10T00:00:00.000Z',
    UpdatedOn: '2026-10-01T00:00:00.000Z',
    ...overrides,
  }) as PropertyMeJobTask

const snap = (retrievedAt: string, t: PropertyMeJobTask): JobTaskSnapshot => ({ retrievedAt, task: t })

describe('detectDueDateChanges', () => {
  it('ignores the first snapshot of a job (no baseline to compare)', () => {
    expect(detectDueDateChanges([snap('2026-10-01T00:00:00Z', task({}))])).toEqual([])
  })

  it('ignores snapshots where other fields changed but DueDate did not', () => {
    const changes = detectDueDateChanges([
      snap('2026-10-01T00:00:00Z', task({})),
      snap('2026-10-01T04:00:00Z', task({ Status: 'Completed', UpdatedOn: '2026-10-01T03:00:00Z' })),
    ])
    expect(changes).toEqual([])
  })

  it('emits a change with previous/new due date, changer and day shift', () => {
    const changes = detectDueDateChanges([
      snap('2026-10-01T00:00:00Z', task({})),
      snap(
        '2026-10-01T04:00:00Z',
        task({
          DueDate: '2026-10-17T00:00:00.000Z',
          UpdatedOn: '2026-10-01T02:30:00.000Z',
          ManagerName: 'Tom Patel',
        }),
      ),
    ])
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({
      jobTaskId: 'job-1',
      previousDueDate: '2026-10-10T00:00:00.000Z',
      newDueDate: '2026-10-17T00:00:00.000Z',
      changedAt: '2026-10-01T02:30:00.000Z',
      detectedAt: '2026-10-01T04:00:00Z',
      changedBy: 'Tom Patel',
      shiftDays: 7,
    })
  })

  it('compares against the previous snapshot of the same job, regardless of input order', () => {
    const changes = detectDueDateChanges([
      snap('2026-10-02T00:00:00Z', task({ DueDate: '2026-10-05T00:00:00.000Z', UpdatedOn: '2026-10-01T23:00:00Z' })),
      snap('2026-10-01T00:00:00Z', task({ Id: 'job-2', DueDate: '2026-11-01T00:00:00.000Z' })),
      snap('2026-10-01T00:00:00Z', task({})),
    ])
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({ jobTaskId: 'job-1', shiftDays: -5 })
  })

  it('treats a due date being cleared or set from empty as a change', () => {
    const changes = detectDueDateChanges([
      snap('2026-10-01T00:00:00Z', task({ DueDate: null })),
      snap('2026-10-01T04:00:00Z', task({ UpdatedOn: '2026-10-01T03:00:00Z' })),
      snap('2026-10-01T08:00:00Z', task({ DueDate: null, UpdatedOn: '2026-10-01T07:00:00Z' })),
    ])
    // newest first
    expect(changes.map((c) => [c.previousDueDate, c.newDueDate, c.shiftDays])).toEqual([
      ['2026-10-10T00:00:00.000Z', null, null],
      [null, '2026-10-10T00:00:00.000Z', null],
    ])
  })

  it('treats the same instant in different ISO formats as unchanged', () => {
    const changes = detectDueDateChanges([
      snap('2026-10-01T00:00:00Z', task({ DueDate: '2026-10-10T00:00:00Z' })),
      snap('2026-10-01T04:00:00Z', task({ DueDate: '2026-10-10T00:00:00.000Z' })),
    ])
    expect(changes).toEqual([])
  })
})
