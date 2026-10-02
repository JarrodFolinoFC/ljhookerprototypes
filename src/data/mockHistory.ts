import dayjs, { type Dayjs } from 'dayjs'
import type { JobTaskSnapshot, PropertyMeJobTask } from '../types/propertyme'

/**
 * Stand-in for the history table. Simulates the sync job polling PropertyMe
 * at 9am, 1pm and 5pm on weekdays, storing a snapshot of every job task the
 * endpoint reports as changed since the previous poll.
 */

// Deterministic PRNG so the dashboard looks the same on every reload.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261002)
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))

const MANAGERS = [
  { id: 'mem-01', name: 'Sarah Nguyen' },
  { id: 'mem-02', name: 'Tom Patel' },
  { id: 'mem-03', name: 'Olivia Chen' },
  { id: 'mem-04', name: 'Marcus Rossi' },
  { id: 'mem-05', name: 'Priya Sharma' },
] as const

const STREETS = [
  'Collins St', 'Flinders Ln', 'La Trobe St', 'Lonsdale St', 'Spencer St',
  'Queen St', 'Elizabeth St', 'Swanston St', 'Exhibition St', 'Little Bourke St',
]

const SUMMARIES = [
  'Leaking kitchen tap', 'Smoke alarm compliance check', 'Air conditioner not cooling',
  'Replace broken window latch', 'Hot water system failure', 'Blocked bathroom drain',
  'Intercom not working', 'Routine inspection', 'Repaint water-stained ceiling',
  'Dishwasher fault', 'Replace carpet in bedroom 2', 'Garage remote not working',
  'Mould treatment in ensuite', 'Electrical safety check', 'Gas appliance service',
  'Front door lock replacement', 'Balcony balustrade inspection', 'Oven element replacement',
]

const STATUSES = ['Reported', 'Assigned', 'Quoted', 'Approved', 'Scheduled'] as const
const TASK_TYPES = ['Job', 'Job', 'Job', 'Inspection'] as const

/** Business-hours poll times between two dates (weekdays, 9am/1pm/5pm local). */
function pollTimes(from: Dayjs, to: Dayjs): Dayjs[] {
  const times: Dayjs[] = []
  for (let d = from.startOf('day'); d.isBefore(to); d = d.add(1, 'day')) {
    const dow = d.day()
    if (dow === 0 || dow === 6) continue
    for (const hour of [9, 13, 17]) {
      const t = d.hour(hour)
      if (t.isBefore(to)) times.push(t)
    }
  }
  return times
}

function baseTask(n: number, createdOn: Dayjs): PropertyMeJobTask {
  const manager = pick(MANAGERS)
  const unit = between(1, 48)
  const streetNo = between(10, 650)
  const id = `jt-${(100000 + n * 7919).toString(16)}`
  return {
    LotReference: `${unit}/${streetNo} ${pick(STREETS)}, Melbourne`,
    TenantReference: `TEN${between(1000, 9999)}`,
    OwnerReference: `OWN${between(1000, 9999)}`,
    ContactReference: '',
    ManagerName: manager.name,
    IsLetterStatement: false,
    StatementId: '',
    TaskType: pick(TASK_TYPES),
    Timestamp: createdOn.valueOf(),
    OwnerAttending: false,
    TenantAttending: rand() > 0.5,
    SupplierReference: `SUP${between(100, 999)}`,
    DisplayNumber: `J${(4200 + n).toString().padStart(6, '0')}`,
    Number: 4200 + n,
    Status: pick(STATUSES),
    ReportedContactType: 'Tenant',
    Access: 'Contact tenant',
    MainPhotoDocumentId: '',
    DocumentLinkTextName: '',
    QuoteId: '',
    SupplierInstructions: '',
    Id: id,
    CustomerId: 'cust-cityres-melb',
    DueDate: createdOn.add(between(3, 21), 'day').startOf('day').toISOString(),
    CreatedOn: createdOn.toISOString(),
    ClosedOn: null,
    Summary: pick(SUMMARIES),
    Description: '',
    LotId: `lot-${n}`,
    TenantContactId: `ten-${n}`,
    OwnerContactId: `own-${n}`,
    ContactId: '',
    ManagerMemberId: manager.id,
    Labels: '',
    UpdatedOn: createdOn.toISOString(),
  }
}

function buildHistory(now: Dayjs): JobTaskSnapshot[] {
  const polls = pollTimes(now.subtract(60, 'day'), now)
  const snapshots: JobTaskSnapshot[] = []
  const live: PropertyMeJobTask[] = []
  let jobCounter = 0

  for (const [i, pollAt] of polls.entries()) {
    const prevPoll = i > 0 ? polls[i - 1] : pollAt.subtract(4, 'hour')
    // A moment between the previous poll and this one, when the edit happened in PropertyMe.
    const editTime = () => prevPoll.add(between(5, Math.max(6, pollAt.diff(prevPoll, 'minute') - 5)), 'minute')
    const changed = new Map<string, PropertyMeJobTask>()

    // New jobs reported since the last poll.
    for (let k = between(0, 2); k > 0; k--) {
      const t = baseTask(jobCounter++, editTime())
      live.push(t)
      changed.set(t.Id, t)
    }

    // Edits to existing open jobs.
    for (let k = between(0, 3); k > 0 && live.length; k--) {
      const idx = Math.floor(rand() * live.length)
      const prev = live[idx]
      const next: PropertyMeJobTask = { ...prev, UpdatedOn: editTime().toISOString() }
      const roll = rand()
      if (roll < 0.55) {
        // Due date moved, usually pushed out, occasionally pulled forward.
        const shift = rand() < 0.8 ? between(1, 14) : -between(1, 5)
        // If the job is already overdue, it gets rescheduled from today instead.
        const edited = dayjs(next.UpdatedOn).startOf('day')
        const prevDue = prev.DueDate ? dayjs(prev.DueDate) : edited
        next.DueDate = (prevDue.isBefore(edited) ? edited.add(Math.abs(shift), 'day') : prevDue.add(shift, 'day')).toISOString()
        // Someone other than the original manager sometimes makes the change.
        if (rand() < 0.35) {
          const m = pick(MANAGERS)
          next.ManagerName = m.name
          next.ManagerMemberId = m.id
        }
      } else if (roll < 0.85) {
        const idxStatus = STATUSES.indexOf(prev.Status as (typeof STATUSES)[number])
        next.Status = STATUSES[Math.min(STATUSES.length - 1, idxStatus + 1)]
      } else {
        next.Status = 'Completed'
        next.ClosedOn = next.UpdatedOn
      }
      if (next.Status === 'Completed') live.splice(idx, 1)
      else live[idx] = next
      changed.set(next.Id, next)
    }

    for (const task of changed.values()) {
      snapshots.push({ retrievedAt: pollAt.toISOString(), task })
    }
  }

  return snapshots
}

export const mockSnapshots: JobTaskSnapshot[] = buildHistory(dayjs())
