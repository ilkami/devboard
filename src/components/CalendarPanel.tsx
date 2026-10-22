import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { Panel } from './ui'
import { EVENTS, buildMonth, dayKey, groupByDay, type CalendarEvent } from '../data/calendar'
import { MONTHS_FULL, WEEKDAYS_SHORT, formatShortDate, today } from '../data/mockData'

export default function CalendarPanel() {
  const navigate = useNavigate()
  const [monthOffset, setMonthOffset] = useState(0)

  const year = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1).getFullYear()
  const month = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1).getMonth()

  const cells = useMemo(() => buildMonth(year, month), [year, month])
  const byDay = useMemo(() => groupByDay(EVENTS), [])

  const upcoming = useMemo<CalendarEvent[]>(
    () =>
      EVENTS.filter((event) => event.date.getTime() >= today.getTime())
        .slice(0, 4),
    [],
  )

  return (
    <Panel
      title="Календарь и дедлайны"
      action={
        <div className="calendar__nav">
          <button
            type="button"
            className="icon-button icon-button--sm"
            onClick={() => setMonthOffset((value) => value - 1)}
            aria-label="Предыдущий месяц"
          >
            <Icon name="chevron-left" size={15} />
          </button>
          <span className="calendar__month">
            {MONTHS_FULL[month]} {year}
          </span>
          <button
            type="button"
            className="icon-button icon-button--sm"
            onClick={() => setMonthOffset((value) => value + 1)}
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
          const events = byDay.get(cell.key) ?? []
          const classes = ['calendar__cell']

          if (!cell.inMonth) classes.push('is-outside')
          if (cell.key === dayKey(today)) classes.push('is-today')

          return (
            <button
              key={cell.key}
              type="button"
              className={classes.join(' ')}
              onClick={() => navigate(`/calendar?date=${cell.key}`)}
              title={events.length > 0 ? `${events.length} событий` : 'Открыть день'}
            >
              <span>{cell.date.getDate()}</span>
              {events.length > 0 && (
                <span className="calendar__dots">
                  {events.slice(0, 3).map((event) => (
                    <span
                      key={event.id}
                      className="calendar__dot"
                      style={{ background: event.color }}
                    />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <ul className="deadline-list">
        {upcoming.map((event) => (
          <li key={event.id} className="deadline-row">
            <span className="deadline-row__dot" style={{ background: event.color }} />
            <span className="deadline-row__text">
              <span className="deadline-row__title">{event.title}</span>
              <span className="deadline-row__project">{event.project}</span>
            </span>
            <span className="deadline-row__date">{formatShortDate(event.date)}</span>
          </li>
        ))}
        {upcoming.length === 0 && <li className="deadline-row">Ближайших дедлайнов нет</li>}
      </ul>
    </Panel>
  )
}
