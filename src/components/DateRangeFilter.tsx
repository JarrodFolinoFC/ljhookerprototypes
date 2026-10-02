import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, DatePicker, Flex, Segmented } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'

export type RangeMode = 'day' | 'week' | 'custom'

export interface DateRangeValue {
  mode: RangeMode
  from: Dayjs
  to: Dayjs
}

export const rangeFor = (mode: Exclude<RangeMode, 'custom'>, anchor: Dayjs): DateRangeValue => ({
  mode,
  from: anchor.startOf(mode),
  to: anchor.endOf(mode),
})

interface Props {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
}

export function DateRangeFilter({ value, onChange }: Props) {
  const { mode, from, to } = value

  const setMode = (next: RangeMode) => {
    if (next === 'custom') onChange({ mode: 'custom', from, to })
    else onChange(rangeFor(next, mode === 'custom' ? dayjs() : from))
  }

  const step = (dir: 1 | -1) => {
    if (mode !== 'custom') onChange(rangeFor(mode, from.add(dir, mode)))
  }

  const isCurrent = mode !== 'custom' && from.isSame(dayjs(), mode)

  return (
    <Flex gap={12} wrap align="center" className="date-range-filter">
      <Segmented<RangeMode>
        value={mode}
        onChange={setMode}
        options={[
          { label: 'Day', value: 'day' },
          { label: 'Week', value: 'week' },
          { label: 'Custom', value: 'custom' },
        ]}
      />

      {mode === 'custom' ? (
        <DatePicker.RangePicker
          className="date-range-filter__picker"
          value={[from, to]}
          format="DD/MM/YYYY"
          allowClear={false}
          disabledDate={(d) => d.isAfter(dayjs(), 'day')}
          presets={[
            { label: 'Last 7 days', value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] },
            { label: 'Last 30 days', value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')] },
            { label: 'This month', value: [dayjs().startOf('month'), dayjs().endOf('day')] },
            {
              label: 'Last month',
              value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')],
            },
          ]}
          onChange={(dates) => {
            if (dates?.[0] && dates[1]) {
              onChange({ mode: 'custom', from: dates[0].startOf('day'), to: dates[1].endOf('day') })
            }
          }}
        />
      ) : (
        <Flex gap={4} align="center" className="date-range-filter__stepper">
          <Button shape="circle" icon={<LeftOutlined />} aria-label={`Previous ${mode}`} onClick={() => step(-1)} />
          <DatePicker
            className="date-range-filter__picker"
            picker={mode === 'week' ? 'week' : 'date'}
            value={from}
            allowClear={false}
            format={mode === 'week' ? () => `${from.format('D MMM')} – ${to.format('D MMM YYYY')}` : 'ddd D MMM YYYY'}
            disabledDate={(d) => d.isAfter(dayjs(), 'day')}
            onChange={(d) => d && onChange(rangeFor(mode, d))}
          />
          <Button
            shape="circle"
            icon={<RightOutlined />}
            aria-label={`Next ${mode}`}
            disabled={isCurrent}
            onClick={() => step(1)}
          />
          {!isCurrent && (
            <Button type="link" onClick={() => onChange(rangeFor(mode, dayjs()))}>
              {mode === 'day' ? 'Today' : 'This week'}
            </Button>
          )}
        </Flex>
      )}
    </Flex>
  )
}
