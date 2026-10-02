import { Card, Col, Flex, Progress, Row, Statistic, Typography } from 'antd'
import { useMemo } from 'react'
import { brand } from '../theme/ljTheme'
import type { DueDateChange } from '../types/propertyme'

interface Props {
  changes: DueDateChange[]
  loading: boolean
  rangeLabel: string
  selectedEmployee: string | null
  onSelectEmployee: (name: string | null) => void
}

export function SummaryStats({ changes, loading, rangeLabel, selectedEmployee, onSelectEmployee }: Props) {
  const stats = useMemo(() => {
    const jobs = new Set(changes.map((c) => c.jobTaskId))
    const shifts = changes.map((c) => c.shiftDays).filter((d): d is number => d !== null)
    const pushedOut = shifts.filter((d) => d > 0)
    const byEmployee = new Map<string, number>()
    for (const c of changes) byEmployee.set(c.changedBy, (byEmployee.get(c.changedBy) ?? 0) + 1)
    return {
      jobs: jobs.size,
      changes: changes.length,
      pushedOut: pushedOut.length,
      broughtForward: shifts.filter((d) => d < 0).length,
      avgPush: pushedOut.length ? pushedOut.reduce((a, b) => a + b, 0) / pushedOut.length : 0,
      byEmployee: [...byEmployee.entries()].sort((a, b) => b[1] - a[1]),
    }
  }, [changes])

  const tiles = [
    { title: 'Jobs affected', value: stats.jobs },
    { title: 'Due date changes', value: stats.changes },
    { title: 'Pushed out', value: stats.pushedOut, suffix: <span className="stat-suffix">/ {stats.broughtForward} earlier</span> },
    { title: 'Avg. push-out', value: stats.avgPush, precision: 1, suffix: 'days' },
  ]
  const max = stats.byEmployee[0]?.[1] ?? 1

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <Row gutter={[16, 16]}>
          {tiles.map((t) => (
            <Col xs={12} key={t.title}>
              <Card className="stat-card">
                <Statistic title={t.title} value={t.value} precision={t.precision} suffix={t.suffix} loading={loading} />
              </Card>
            </Col>
          ))}
        </Row>
      </Col>
      <Col xs={24} lg={10}>
        <Card
          title={
            <span>
              Changes by employee{' '}
              <Typography.Text type="secondary" className="card-range">
                {rangeLabel}
              </Typography.Text>
            </span>
          }
          className="employee-card"
          loading={loading}
          extra={
            selectedEmployee && (
              <Typography.Link onClick={() => onSelectEmployee(null)}>Show all</Typography.Link>
            )
          }
        >
          {stats.byEmployee.length === 0 ? (
            <Typography.Text type="secondary">No changes in this period.</Typography.Text>
          ) : (
            <Flex vertical gap={10}>
              {stats.byEmployee.map(([name, count]) => (
                <button
                  type="button"
                  key={name}
                  className={`employee-row${selectedEmployee === name ? ' is-selected' : ''}`}
                  aria-pressed={selectedEmployee === name}
                  onClick={() => onSelectEmployee(selectedEmployee === name ? null : name)}
                >
                  <Flex justify="space-between">
                    <span>{name}</span>
                    <strong>{count}</strong>
                  </Flex>
                  <Progress
                    percent={(count / max) * 100}
                    showInfo={false}
                    size="small"
                    strokeColor={brand.vintageLeather}
                    railColor="#F3EBDD"
                  />
                </button>
              ))}
            </Flex>
          )}
        </Card>
      </Col>
    </Row>
  )
}
