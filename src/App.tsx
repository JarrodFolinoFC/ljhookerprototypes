import { DownloadOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Card, Col, Flex, Grid, Input, Row, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { fetchDueDateChanges } from './api/dueDateChanges'
import { AppShell } from './components/AppShell'
import { ChangesList } from './components/ChangesList'
import { ChangesTable } from './components/ChangesTable'
import { DateRangeFilter, rangeFor, type DateRangeValue } from './components/DateRangeFilter'
import { JobHistoryDrawer } from './components/JobHistoryDrawer'
import { SummaryStats } from './components/SummaryStats'
import { formatDateTime } from './components/format'
import type { DueDateChange } from './types/propertyme'

type Direction = 'all' | 'later' | 'earlier'

function describeRange({ mode, from, to }: DateRangeValue) {
  if (mode === 'day') return from.isSame(dayjs(), 'day') ? 'today' : from.format('dddd D MMMM')
  if (mode === 'week') return from.isSame(dayjs(), 'week') ? 'this week' : `week of ${from.format('D MMMM')}`
  return `${from.format('D MMM')} – ${to.format('D MMM YYYY')}`
}

function downloadCsv(rows: DueDateChange[], range: DateRangeValue) {
  const header = ['Job', 'Summary', 'Property', 'Original due date', 'New due date', 'Shift (days)', 'Changed by', 'Changed on']
  const fmt = (iso: string | null) => (iso ? dayjs(iso).format('YYYY-MM-DD') : '')
  const lines = rows.map((c) =>
    [c.displayNumber, c.summary, c.lotReference, fmt(c.previousDueDate), fmt(c.newDueDate), c.shiftDays ?? '', c.changedBy, dayjs(c.changedAt).format('YYYY-MM-DD HH:mm')]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  )
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `due-date-changes_${range.from.format('YYYY-MM-DD')}_${range.to.format('YYYY-MM-DD')}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function App() {
  const screens = Grid.useBreakpoint()
  const [range, setRange] = useState<DateRangeValue>(() => rangeFor('week', dayjs()))
  const [changes, setChanges] = useState<DueDateChange[]>([])
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [employee, setEmployee] = useState<string | null>(null)
  const [direction, setDirection] = useState<Direction>('all')
  const [openJobId, setOpenJobId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchDueDateChanges({ from: range.from, to: range.to }).then((res) => {
      if (cancelled) return
      setChanges(res.changes)
      setLastSyncedAt(res.lastSyncedAt)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [range])

  const employees = useMemo(() => [...new Set(changes.map((c) => c.changedBy))].sort(), [changes])

  // Search/direction narrow everything; the employee filter only narrows the list,
  // so the "by employee" breakdown still shows everyone for comparison.
  const scoped = useMemo(() => {
    const q = search.trim().toLowerCase()
    return changes.filter((c) => {
      if (direction === 'later' && !(c.shiftDays !== null && c.shiftDays > 0)) return false
      if (direction === 'earlier' && !(c.shiftDays !== null && c.shiftDays < 0)) return false
      if (!q) return true
      return [c.displayNumber, c.summary, c.lotReference].some((v) => v.toLowerCase().includes(q))
    })
  }, [changes, search, direction])

  const visible = useMemo(
    () => (employee ? scoped.filter((c) => c.changedBy === employee) : scoped),
    [scoped, employee],
  )

  const changeCountByJob = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of visible) m.set(c.jobTaskId, (m.get(c.jobTaskId) ?? 0) + 1)
    return m
  }, [visible])

  const listProps = { changes: visible, loading, changeCountByJob, onOpenJob: setOpenJobId }

  return (
    <AppShell
      title="Jobs where due date changed"
      intro="Every job whose due date was moved in PropertyMe, who moved it, and by how much."
    >
      <Flex vertical gap={20}>
        <Card className="toolbar-card">
          <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" gap={12} wrap>
              <DateRangeFilter value={range} onChange={setRange} />
              {lastSyncedAt && (
                <Typography.Text type="secondary" className="sync-note">
                  <SyncOutlined /> Last synced {formatDateTime(lastSyncedAt)}
                </Typography.Text>
              )}
            </Flex>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={10}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Search job #, summary or address"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Col>
              <Col xs={12} md={5}>
                <Select<string>
                  allowClear
                  placeholder="All employees"
                  style={{ width: '100%' }}
                  value={employee ?? undefined}
                  onChange={(v) => setEmployee(v ?? null)}
                  options={employees.map((e) => ({ label: e, value: e }))}
                />
              </Col>
              <Col xs={12} md={5}>
                <Select<Direction>
                  style={{ width: '100%' }}
                  value={direction}
                  onChange={setDirection}
                  options={[
                    { label: 'Any change', value: 'all' },
                    { label: 'Pushed out', value: 'later' },
                    { label: 'Brought forward', value: 'earlier' },
                  ]}
                />
              </Col>
              <Col xs={24} md={4}>
                <Button
                  block
                  icon={<DownloadOutlined />}
                  disabled={!visible.length}
                  onClick={() => downloadCsv(visible, range)}
                >
                  Export CSV
                </Button>
              </Col>
            </Row>
          </Flex>
        </Card>

        <SummaryStats
          changes={scoped}
          loading={loading}
          rangeLabel={describeRange(range)}
          selectedEmployee={employee}
          onSelectEmployee={setEmployee}
        />

        <Card
          className="results-card"
          title={
            <span>
              {loading ? 'Loading changes' : `${visible.length} change${visible.length === 1 ? '' : 's'}`}{' '}
              <Typography.Text type="secondary" className="card-range">
                {describeRange(range)}
              </Typography.Text>
            </span>
          }
          styles={{ body: { padding: screens.md ? 0 : 12 } }}
        >
          {screens.md ? <ChangesTable {...listProps} /> : <ChangesList {...listProps} />}
        </Card>
      </Flex>

      <JobHistoryDrawer jobTaskId={openJobId} onClose={() => setOpenJobId(null)} />
    </AppShell>
  )
}
