import { Badge, Button, Flex, Table, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { DueDateChange } from '../types/propertyme'
import { DueDate, ShiftTag, ViewJobButton } from './format'

interface Props {
  changes: DueDateChange[]
  loading: boolean
  changeCountByJob: Map<string, number>
  onOpenJob: (jobTaskId: string) => void
}

export function ChangesTable({ changes, loading, changeCountByJob, onOpenJob }: Props) {
  const columns: ColumnsType<DueDateChange> = [
    {
      title: 'Job',
      key: 'job',
      fixed: 'left',
      width: 260,
      sorter: (a, b) => a.displayNumber.localeCompare(b.displayNumber),
      render: (_, c) => {
        const count = changeCountByJob.get(c.jobTaskId) ?? 1
        return (
          <Flex vertical gap={2}>
            <Flex gap={8} align="center">
              <Button type="link" className="job-link" onClick={() => onOpenJob(c.jobTaskId)}>
                {c.displayNumber}
              </Button>
              {count > 1 && (
                <Tooltip title={`Due date changed ${count} times in this period`}>
                  <Badge count={`${count}×`} className="repeat-badge" />
                </Tooltip>
              )}
            </Flex>
            <Typography.Text strong>{c.summary}</Typography.Text>
            <Typography.Text type="secondary" className="cell-sub">
              {c.lotReference}
            </Typography.Text>
          </Flex>
        )
      },
    },
    {
      title: 'Original due date',
      dataIndex: 'previousDueDate',
      width: 150,
      sorter: (a, b) => dayjs(a.previousDueDate ?? 0).valueOf() - dayjs(b.previousDueDate ?? 0).valueOf(),
      render: (v: string | null) => <DueDate iso={v} strike />,
    },
    {
      title: 'New due date',
      dataIndex: 'newDueDate',
      width: 150,
      sorter: (a, b) => dayjs(a.newDueDate ?? 0).valueOf() - dayjs(b.newDueDate ?? 0).valueOf(),
      render: (v: string | null) => (
        <Typography.Text strong>
          <DueDate iso={v} />
        </Typography.Text>
      ),
    },
    {
      title: 'Shift',
      key: 'shift',
      width: 120,
      sorter: (a, b) => (a.shiftDays ?? 0) - (b.shiftDays ?? 0),
      render: (_, c) => <ShiftTag change={c} />,
    },
    {
      title: 'Changed by',
      dataIndex: 'changedBy',
      width: 160,
      sorter: (a, b) => a.changedBy.localeCompare(b.changedBy),
    },
    {
      title: 'Changed on',
      dataIndex: 'changedAt',
      width: 150,
      defaultSortOrder: 'descend',
      sorter: (a, b) => dayjs(a.changedAt).valueOf() - dayjs(b.changedAt).valueOf(),
      render: (v: string) => (
        <Flex vertical>
          <span>{dayjs(v).format('D MMM YYYY')}</span>
          <Typography.Text type="secondary" className="cell-sub">
            {dayjs(v).format('h:mm a')}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 200,
      align: 'right',
      render: (_, c) => <ViewJobButton change={c} />,
    },
  ]

  return (
    <Table<DueDateChange>
      rowKey="key"
      columns={columns}
      dataSource={changes}
      loading={loading}
      scroll={{ x: 1100 }}
      pagination={{ pageSize: 20, hideOnSinglePage: true, showSizeChanger: false }}
      locale={{ emptyText: 'No due date changes in this period.' }}
    />
  )
}
