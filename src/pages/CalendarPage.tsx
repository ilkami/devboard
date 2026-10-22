import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { EVENTS, KIND_LABEL, buildMonth, dayKey, filterByKind, groupByDay } from '../data/calendar'
import type { CalendarEventKind } from '../data/calendar'
import { MONTHS_FULL, WEEKDAYS_SHORT, formatShortDate, today } from '../data/mockData'

type KindFilter = 'all' | CalendarEventKind

const KIND_FILTERS: Array<{ key: KindFilter; label: string }> = [
  { key: 'all', label: 'Все события' },
  { key: 'task', label: 'Только задачи' },
  { key: 'milestone', label: 'Только этапы' },
]

function parseDate(value: string | null): Date | null {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export default function CalendarPage() {
  const [params] = useSearchParams()
  const initial = parseDate(params.get('date')) ?? new Date(today)

  const [cursor, setCursor] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1))
  const [selected, setSelected] = useState<Date>(initial)
  const [kind, setKind] = useState<KindFilter>('all')

  const events = useMemo(() => filterByKind(EVENTS, kind), [kind])
  const byDay = useMemo(() => groupByDay(events), [events])
  const cells = useMemo(() => buildMonth(cursor.getFullYear(), cursor.getMonth()), [cursor])

  const selectedEvents = byDay.get(dayKey(selected)) ?? []
  const upcoming = useMemo(
    () => events.filter((event) => event.date.getTime() >= today.getTime()).slice(0, 5),
    [events],
  )

  const shiftMonth = (delta: number) =>
    setCursor((previous) => new Date(previous.getFullYear(), previous.getMonth() + delta, 1))

  const goToday = () => {
    const now = new Date(today)
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelected(now)
  }

  const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(selected)
  const monthLabel = `${MONTHS_FULL[cursor.getMonth()]} ${cursor.getFullYear()}`
  const todayKey = dayKey(today)
  const selectedKey = dayKey(selected)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Календарь</h1>
          <p className="page-subtitle">
            Задачи и этапы проектов по дням · {events.length} событий
          </p>
        </div>

        <div className="page-head__actions">
          <div className="month-nav">
            <button
              type="button"
              className="icon-button"
              onClick={() => shiftMonth(-1)}
              aria-label="Предыдущий месяц"
            >
              <Icon name="chevron-left" size={16} />
            </button>
            <span className="month-nav__label">{monthLabel}</span>
            <button
              type="button"
              className="icon-button"
              onClick={() => shiftMonth(1)}
              aria-label="Следующий месяц"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>

          <button type="button" className="button button--ghost" onClick={goToday}>
            Сегодня
          </button>

          <label className="select">
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as KindFilter)}
              aria-label="Тип событий"
            >
              {KIND_FILTERS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={14} />
          </label>
        </div>
      </header>

      <div className="calendar-layout">
        <section className="panel calendar-layout__main">
          <div className="panel__body">
            <div className="bigcal__weekdays">
              {WEEKDAYS_SHORT.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="bigcal__grid">
              {cells.map((cell) => {
                const dayEvents = byDay.get(cell.key) ?? []
                const classes = ['bigcal__cell']

                if (!cell.inMonth) classes.push('is-outside')
                if (cell.key === todayKey) classes.push('is-today')
                if (cell.key === selectedKey) classes.push('is-selected')

                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={classes.join(' ')}
                    onClick={() => setSelected(cell.date)}
                  >
                    <span className="bigcal__num">{cell.date.getDate()}</span>
                    <span className="bigcal__events">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span key={event.id} className="bigcal__event">
                          <span
                            className="bigcal__event-dot"
                            style={{ background: event.color }}
                          />
                          <span className="bigcal__event-text">{event.title}</span>
                        </span>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="bigcal__more">ещё {dayEvents.length - 3}</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <aside className="calendar-layout__side">
          <section className="panel">
            <div className="panel__body">
              <div className="daypanel__head">
                <span className="daypanel__date">
                  {selected.getDate()} {MONTHS_FULL[selected.getMonth()].toLowerCase()}
                </span>
                <span className="daypanel__weekday">{weekday}</span>
              </div>

              <ul className="event-list">
                {selectedEvents.map((event) => (
                  <li key={event.id} className={event.done ? 'event-row is-done' : 'event-row'}>
                    <span className="event-row__dot" style={{ background: event.color }} />
                    <span className="event-row__body">
                      <span className="event-row__title">{event.title}</span>
                      <span className="event-row__meta">
                        <span className="kind-tag">{KIND_LABEL[event.kind]}</span>
                        {event.project}
                      </span>
                    </span>
                  </li>
                ))}

                {selectedEvents.length === 0 && (
                  <li className="event-row event-row--empty">
                    На этот день ничего не запланировано
                  </li>
                )}
              </ul>
            </div>
          </section>

          <section className="panel">
            <header className="panel__head">
              <h2 className="panel__title">Ближайшие дедлайны</h2>
            </header>
            <div className="panel__body">
              <ul className="deadline-list deadline-list--panel">
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
                {upcoming.length === 0 && (
                  <li className="deadline-row">Ближайших дедлайнов нет</li>
                )}
              </ul>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
