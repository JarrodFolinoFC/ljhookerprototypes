import { Descriptions, Drawer, Flex, Grid, Spin, Timeline, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { fetchJobDueDateHistory } from '../api/dueDateChanges'
import type { DueDateChange } from '../types/propertyme'
import { DueDate, ShiftTag, ViewJobButton, formatDateTime } from './format'

interface Props {
  jobTaskId: string | null
  onClose: () => void
}

export function JobHistoryDrawer({ jobTaskId, onClose }: Props) {
  const screens = Grid.useBreakpoint()
  const [history, setHistory] = useState<DueDateChange[] | null>(null)

  useEffect(() => {
    if (!jobTaskId) return
    let cancelled = false
    setHistory(null)
    fetchJobDueDateHistory(jobTaskId).then((h) => {
      if (!cancelled) setHistory(h)
    })
    return () => {
      cancelled = true
    }
  }, [jobTaskId])

  const latest = history?.[0]

  return (
    <Drawer
      open={jobTaskId !== null}
      onClose={onClose}
      placement={screens.md ? 'right' : 'bottom'}
      size={screens.md ? 480 : '85vh'}
      title={latest ? `${latest.displayNumber} · ${latest.summary}` : 'Due date history'}
      extra={latest && screens.sm ? <ViewJobButton change={latest} /> : undefined}
    >
      {!history || !latest ? (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin />
        </Flex>
      ) : (
        <Flex vertical gap={24}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Property">{latest.lotReference}</Descriptions.Item>
            <Descriptions.Item label="Type">{latest.taskType}</Descriptions.Item>
            <Descriptions.Item label="Status">{latest.status}</Descriptions.Item>
            <Descriptions.Item label="Current due date">
              <Typography.Text strong>
                <DueDate iso={latest.newDueDate} />
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Times changed">{history.length}</Descriptions.Item>
          </Descriptions>

          {!screens.sm && <ViewJobButton change={latest} block />}

          <div>
            <Typography.Title level={5}>All due date changes</Typography.Title>
            <Timeline
              items={history.map((c) => ({
                key: c.key,
                color: c.shiftDays !== null && c.shiftDays < 0 ? 'green' : 'red',
                content: (
                  <Flex vertical gap={4}>
                    <Flex gap={8} wrap align="center">
                      <DueDate iso={c.previousDueDate} strike />
                      <span aria-hidden>→</span>
                      <Typography.Text strong>
                        <DueDate iso={c.newDueDate} />
                      </Typography.Text>
                      <ShiftTag change={c} />
                    </Flex>
                    <Typography.Text type="secondary" className="cell-sub">
                      {c.changedBy} · {formatDateTime(c.changedAt)}
                    </Typography.Text>
                  </Flex>
                ),
              }))}
            />
          </div>
        </Flex>
      )}
    </Drawer>
  )
}
