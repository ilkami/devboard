import { useMemo, useState } from 'react'
import Icon from './Icon'
import { Panel } from './ui'
import {
  MILESTONES,
  MONTHS_FULL,
  WEEKDAYS_SHORT,
  formatShortDate,
  today,
} from '../data/mockData'

interface DayCell {
  key: string
  date: Date
  inMonth: boolean
}

function buildMonth(year: number, month: number): DayCell[] {
  const firstOfMonth = new Date(year, month, 1)
  const leading = (firstOfMonth.getDay() + 6) % 7 // понедельник — первый день недели
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: DayCell[] = []

  for (let i = leading; i > 0; i -= 1) {
    const date = new Date(year, month, 1 - i)
    cells.push({ key: `prev-${date.toISOString()}`, date, inMonth: false })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    cells.push({ key: `cur-${day}`, date, inMonth: true })
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    const date = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)
    cells.push({ key: `next-${date.toISOString()}`, date, inMonth: false })
  }

  return cells
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function CalendarPanel() {
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const cells = useMemo(() => buildMonth(cursor.getFullYear(), cursor.getMonth()), [cursor])

  const upcoming = useMemo(
    () =>
      [...MILESTONES]
        .filter((item) => item.date.getTime() >= today.getTime())
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 4),
    [],
  )

  const shiftMonth = (delta: number) => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  return (
    <Panel
      title="Календарь и дедлайны"
      action={
        <div className="calendar__nav">
          <button
            type="button"
            className="icon-button icon-button--sm"
            onClick={() => shiftMonth(-1)}
            aria-label="Предыдущий месяц"
          >
            <Icon name="chevron-left" size={15} />
          </button>
          <span className="calendar__month">
            {MONTHS_FULL[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <button
            type="button"
            className="icon-button icon-button--sm"
            onClick={() => shiftMonth(1)}
            aria-label="Следующий месяц"
          >
            <Icon name="chevron-right" size={15} />
          </button>
        </div>
      }
    >
      <div className="calendar__weekdays">
        {WEEKDAYS_SHORT.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="calendar__grid">
        {cells.map((cell) => {
          const isToday = sameDay(cell.date, today)
          const marks = MILESTONES.filter((item) => sameDay(item.date, cell.date))

          const classes = ['calendar__cell']
          if (!cell.inMonth) classes.push('is-outside')
          if (isToday) classes.push('is-today')

          return (
            <div key={cell.key} className={classes.join(' ')}>
              <span className="calendar__day">{cell.date.getDate()}</span>
              <span className="calendar__dots">
                {marks.slice(0, 3).map((mark) => (
                  <span
                    key={mark.id}
                    className="calendar__dot"
                    style={{ background: mark.color }}
                    title={`${mark.title} · ${mark.project}`}
                  />
                ))}
              </span>
            </div>
          )
        })}
      </div>

      <ul className="deadline-list">
        {upcoming.map((item) => (
          <li key={item.id} className="deadline-row">
            <span className="deadline-row__dot" style={{ background: item.color }} />
            <span className="deadline-row__text">
              <span className="deadline-row__title">{item.title}</span>
              <span className="deadline-row__project">{item.project}</span>
            </span>
            <span className="deadline-row__date">{formatShortDate(item.date)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
