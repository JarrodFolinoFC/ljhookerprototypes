import { ArrowDownOutlined, ArrowUpOutlined, ExportOutlined } from '@ant-design/icons'
import { Button, Tag, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'
import { PROPERTYME_JOB_URL } from '../api/dueDateChanges'
import type { DueDateChange } from '../types/propertyme'

export const formatDue = (iso: string | null) => (iso ? dayjs(iso).format('ddd D MMM YYYY') : '—')
export const formatDateTime = (iso: string) => dayjs(iso).format('D MMM YYYY, h:mm a')

export function DueDate({ iso, strike }: { iso: string | null; strike?: boolean }) {
  return iso ? (
    <Typography.Text delete={strike} type={strike ? 'secondary' : undefined}>
      {formatDue(iso)}
    </Typography.Text>
  ) : (
    <Typography.Text type="secondary" italic>
      Not set
    </Typography.Text>
  )
}

export function ShiftTag({ change }: { change: DueDateChange }) {
  const { shiftDays, newDueDate } = change
  if (shiftDays === null) {
    return <Tag color="default">{newDueDate ? 'Due date set' : 'Due date removed'}</Tag>
  }
  const days = Math.abs(shiftDays)
  const label = `${days} day${days === 1 ? '' : 's'}`
  return shiftDays > 0 ? (
    <Tooltip title="Pushed out (later)">
      <Tag className="shift-tag shift-tag--later" icon={<ArrowDownOutlined />}>
        +{label}
      </Tag>
    </Tooltip>
  ) : (
    <Tooltip title="Brought forward (earlier)">
      <Tag className="shift-tag shift-tag--earlier" icon={<ArrowUpOutlined />}>
        −{label}
      </Tag>
    </Tooltip>
  )
}

export function ViewJobButton({ change, block }: { change: DueDateChange; block?: boolean }) {
  return (
    <Button
      size="small"
      block={block}
      href={PROPERTYME_JOB_URL(change.jobTaskId)}
      target="_blank"
      rel="noopener noreferrer"
      icon={<ExportOutlined />}
      iconPlacement="end"
    >
      View job in PropertyMe
    </Button>
  )
}
