import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import KpiCard from '../components/KpiCard'
import { Panel } from '../components/ui'
import { today } from '../data/mockData'
import { useProjects } from '../data/projectsStore'
import { useTasks } from '../data/tasksStore'
import type { StoredTask } from '../data/tasksStore'
import type { Priority } from '../types'

const DAY = 86_400_000
const WEEKS = 6

const PRIORITY_LABEL: Record<Priority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
}

const PRIORITY_COLOR: Record<Priority, string> = {
  high: '#EF4444',
  medium: '#F5A524',
  low: '#8A94AC',
}

type RiskLevel = 'high' | 'medium' | 'ok'

const RISK_LABEL: Record<RiskLevel, string> = {
  high: 'Высокий риск',
  medium: 'Требует внимания',
  ok: 'В графике',
}

const RISK_CLASS: Record<RiskLevel, string> = {
  high: 'badge badge--high',
  medium: 'badge badge--medium',
  ok: 'badge badge--ok',
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfWeek(date: Date): Date {
  const flat = startOfDay(date)
  const shift = (flat.getDay() + 6) % 7
  return new Date(flat.getFullYear(), flat.getMonth(), flat.getDate() - shift)
}

function dayDiff(date: Date | null): number {
  if (!date) return Number.POSITIVE_INFINITY
  return Math.round((startOfDay(date).getTime() - today.getTime()) / DAY)
}

/** Геометрия столбчатой диаграммы в координатах viewBox. */
const CHART = { left: 34, right: 618, top: 18, bottom: 190 }

export default function ReportsPage() {
  const { projects } = useProjects()
  const { rootTasks } = useTasks()

  const total = rootTasks.length
  const done = rootTasks.filter((task) => task.done).length
  const donePercent = total === 0 ? 0 : Math.round((done / total) * 100)
  const overdueTotal = rootTasks.filter((task) => !task.done && dayDiff(task.dueDate) < 0).length
  const activeProjects = projects.filter((project) => project.status === 'active')

  const weeks = useMemo(() => {
    const current = startOfWeek(today)
    return Array.from({ length: WEEKS }, (_, index) => {
      const offset = (WEEKS - 1 - index) * 7
      const start = new Date(current.getFullYear(), current.getMonth(), current.getDate() - offset)
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)

      const items = rootTasks.filter(
        (task): task is StoredTask & { dueDate: Date } =>
          task.dueDate !== null && task.dueDate >= start && task.dueDate < end,
      )

      return {
        key: `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`,
        label: `${String(start.getDate()).padStart(2, '0')}.${String(start.getMonth() + 1).padStart(2, '0')}`,
        done: items.filter((task) => task.done).length,
        rest: items.filter((task) => !task.done).length,
      }
    })
  }, [rootTasks])

  const priorityStats = useMemo(
    () =>
      (['high', 'medium', 'low'] as Priority[]).map((priority) => ({
        priority,
        count: rootTasks.filter((task) => task.priority === priority).length,
      })),
    [rootTasks],
  )

  const prioritySum = Math.max(
    1,
    priorityStats.reduce((sum, item) => sum + item.count, 0),
  )

  const projectLoad = useMemo(
    () =>
      projects
        .filter((project) => project.status !== 'archived')
        .map((project) => {
          const items = rootTasks.filter((task) => task.project === project.name)
          const doneItems = items.filter((task) => task.done).length
          return {
            project,
            total: items.length,
            doneItems,
            percent: items.length === 0 ? 0 : Math.round((doneItems / items.length) * 100),
          }
        })
        .sort((a, b) => b.total - a.total),
    [projects, rootTasks],
  )

  const risks = useMemo(
    () =>
      activeProjects
        .map((project) => {
          const items = rootTasks.filter((task) => task.project === project.name)
          const overdue = items.filter((task) => !task.done && dayDiff(task.dueDate) < 0).length
          const daysLeft = dayDiff(project.dueDate)

          let level: RiskLevel = 'ok'
          if (daysLeft < 0 || (overdue > 0 && daysLeft <= 7)) level = 'high'
          else if (overdue > 0 || daysLeft <= 3) level = 'medium'

          return { project, overdue, daysLeft, level }
        })
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [activeProjects, rootTasks],
  )

  const plotWidth = CHART.right - CHART.left
  const plotHeight = CHART.bottom - CHART.top
  const maxValue = Math.max(1, ...weeks.map((week) => week.done + week.rest))
  const tickStep = Math.max(1, Math.ceil(maxValue / 4))

  const ticks: number[] = []
  for (let value = 0; value <= maxValue; value += tickStep) ticks.push(value)

  const slot = plotWidth / weeks.length
  const barWidth = Math.min(46, slot * 0.44)
  const yFor = (value: number) => CHART.bottom - (value / maxValue) * plotHeight
  const heightFor = (value: number) => (value / maxValue) * plotHeight

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Отчёты</h1>
          <p className="page-subtitle">
            Выполнение задач, загрузка проектов и риски по срокам
          </p>
        </div>
      </header>

      <div className="kpi-grid">
        <KpiCard
          label="Всего задач"
          value={String(total)}
          icon="list"
          accent="#3B62F6"
          hint={`в ${activeProjects.length} активных проектах`}
        />
        <KpiCard
          label="Выполнено"
          value={`${donePercent}%`}
          icon="check-square"
          accent="#12B981"
          hint={`${done} из ${total} задач`}
        />
        <KpiCard
          label="Просрочено"
          value={String(overdueTotal)}
          icon="alert"
          accent="#EF4444"
          warning
          hint="задачи с истёкшим сроком"
        />
        <KpiCard
          label="Проектов в работе"
          value={String(activeProjects.length)}
          icon="folder"
          accent="#7C5CFC"
          hint={`всего в системе: ${projects.length}`}
        />
      </div>

      <div className="reports__grid">
        <Panel
          className="reports__weeks"
          title="Задачи по неделям"
          subtitle={`Последние ${WEEKS} недель: закрытые и оставшиеся задачи по сроку`}
        >
          <svg
            className="bar-chart"
            viewBox="0 0 640 214"
            role="img"
            aria-label="Количество задач по неделям"
          >
            {ticks.map((value) => (
              <g key={value}>
                <line
                  className="bar-chart__grid"
                  x1={CHART.left}
                  y1={yFor(value)}
                  x2={CHART.right}
                  y2={yFor(value)}
                />
                <text
                  className="bar-chart__tick"
                  x={CHART.left - 8}
                  y={yFor(value)}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {value}
                </text>
              </g>
            ))}

            {weeks.map((week, index) => {
              const center = CHART.left + slot * (index + 0.5)
              const x = center - barWidth / 2
              const doneHeight = heightFor(week.done)
              const restHeight = heightFor(week.rest)
              const sum = week.done + week.rest

              return (
                <g key={week.key}>
                  {restHeight > 0 && (
                    <rect
                      x={x}
                      y={CHART.bottom - doneHeight - restHeight}
                      width={barWidth}
                      height={restHeight}
                      rx={3}
                      fill="#CBD5E1"
                    />
                  )}
                  {doneHeight > 0 && (
                    <rect
                      x={x}
                      y={CHART.bottom - doneHeight}
                      width={barWidth}
                      height={doneHeight}
                      rx={3}
                      fill="#12B981"
                    />
                  )}
                  {sum > 0 && (
                    <text
                      className="bar-chart__value"
                      x={center}
                      y={CHART.bottom - doneHeight - restHeight - 6}
                      textAnchor="middle"
                    >
                      {sum}
                    </text>
                  )}
                  <text
                    className="bar-chart__label"
                    x={center}
                    y={CHART.bottom + 16}
                    textAnchor="middle"
                  >
                    {week.label}
                  </text>
                </g>
              )
            })}

            <line
              x1={CHART.left}
              y1={CHART.bottom}
              x2={CHART.right}
              y2={CHART.bottom}
              stroke="#E7EBF3"
            />
          </svg>

          <div className="chart-legend">
            <span className="chart-legend__item">
              <span className="chart-legend__dot" style={{ background: '#12B981' }} />
              Выполнено
            </span>
            <span className="chart-legend__item">
              <span className="chart-legend__dot" style={{ background: '#CBD5E1' }} />
              Осталось
            </span>
          </div>
        </Panel>

        <Panel className="reports__priority" title="Приоритеты" subtitle="Распределение задач">
          <div className="segment-bar">
            {priorityStats.map((item) =>
              item.count === 0 ? null : (
                <span
                  key={item.priority}
                  className="segment-bar__part"
                  style={{
                    width: `${(item.count / prioritySum) * 100}%`,
                    background: PRIORITY_COLOR[item.priority],
                  }}
                />
              ),
            )}
          </div>

          <ul className="legend-list">
            {priorityStats.map((item) => (
              <li key={item.priority} className="legend-list__row">
                <span
                  className="legend-list__dot"
                  style={{ background: PRIORITY_COLOR[item.priority] }}
                />
                <span className="legend-list__name">{PRIORITY_LABEL[item.priority]}</span>
                <span className="legend-list__value">{item.count}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          className="reports__load"
          title="Загрузка по проектам"
          subtitle="Сколько задач закрыто из общего числа"
        >
          <ul className="load-list">
            {projectLoad.map((row) => (
              <li key={row.project.id} className="load-row">
                <span className="load-row__name">{row.project.name}</span>
                <span className="load-row__bar">
                  <span
                    className="load-row__fill"
                    style={{ width: `${row.percent}%`, background: row.project.accent }}
                  />
                </span>
                <span className="load-row__value">
                  {row.doneItems}/{row.total}
                </span>
              </li>
            ))}
            {projectLoad.length === 0 && <li className="empty">Проектов пока нет</li>}
          </ul>
        </Panel>

        <Panel
          className="reports__risk"
          title="Риски по срокам"
          subtitle="Просроченные задачи и близость дедлайна"
        >
          <ul className="risk-list">
            {risks.map((row) => (
              <li key={row.project.id} className="risk-row">
                <span className="risk-row__main">
                  <Link className="risk-row__name" to={`/projects/${row.project.id}`}>
                    {row.project.name}
                  </Link>
                  <span className="risk-row__meta">
                    {row.daysLeft >= 0
                      ? `до дедлайна ${row.daysLeft} дн.`
                      : `дедлайн прошёл ${Math.abs(row.daysLeft)} дн. назад`}
                    {row.overdue > 0 ? ` · просрочено задач: ${row.overdue}` : ''}
                  </span>
                </span>
                <span className={RISK_CLASS[row.level]}>{RISK_LABEL[row.level]}</span>
              </li>
            ))}
            {risks.length === 0 && <li className="empty">Нет активных проектов</li>}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
