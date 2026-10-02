import { ArrowRightOutlined } from '@ant-design/icons'
import { Badge, Button, Card, Empty, Flex, Pagination, Spin, Typography } from 'antd'
import { useEffect, useState } from 'react'
import type { DueDateChange } from '../types/propertyme'
import { DueDate, ShiftTag, ViewJobButton, formatDateTime } from './format'

interface Props {
  changes: DueDateChange[]
  loading: boolean
  changeCountByJob: Map<string, number>
  onOpenJob: (jobTaskId: string) => void
}

const PAGE_SIZE = 10

/** Card layout used in place of the table on small screens. */
export function ChangesList({ changes, loading, changeCountByJob, onOpenJob }: Props) {
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [changes])

  if (!loading && changes.length === 0) {
    return <Empty description="No due date changes in this period." />
  }

  return (
    <Spin spinning={loading}>
      <Flex vertical gap={12}>
        {changes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((c) => {
          const count = changeCountByJob.get(c.jobTaskId) ?? 1
          return (
            <Card key={c.key} size="small" className="change-card">
              <Flex justify="space-between" align="start" gap={8}>
                <Flex vertical gap={2} style={{ minWidth: 0 }}>
                  <Flex gap={8} align="center">
                    <Button type="link" className="job-link" onClick={() => onOpenJob(c.jobTaskId)}>
                      {c.displayNumber}
                    </Button>
                    {count > 1 && <Badge count={`${count}×`} className="repeat-badge" />}
                  </Flex>
                  <Typography.Text strong>{c.summary}</Typography.Text>
                  <Typography.Text type="secondary" className="cell-sub" ellipsis>
                    {c.lotReference}
                  </Typography.Text>
                </Flex>
                <ShiftTag change={c} />
              </Flex>

              <div className="change-card__dates">
                <div>
                  <div className="change-card__label">Original</div>
                  <DueDate iso={c.previousDueDate} strike />
                </div>
                <ArrowRightOutlined className="change-card__arrow" />
                <div>
                  <div className="change-card__label">New</div>
                  <Typography.Text strong>
                    <DueDate iso={c.newDueDate} />
                  </Typography.Text>
                </div>
              </div>

              <Typography.Text type="secondary" className="change-card__meta">
                Changed by <Typography.Text>{c.changedBy}</Typography.Text> · {formatDateTime(c.changedAt)}
              </Typography.Text>

              <ViewJobButton change={c} block />
            </Card>
          )
        })}
        {changes.length > PAGE_SIZE && (
          <Pagination
            align="center"
            size="small"
            current={page}
            pageSize={PAGE_SIZE}
            total={changes.length}
            onChange={(p) => {
              setPage(p)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        )}
      </Flex>
    </Spin>
  )
}
