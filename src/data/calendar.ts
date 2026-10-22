import { MILESTONES, TASKS } from './mockData'
import type { Priority } from '../types'

/**
 * Единая модель событий календаря.
 * В календарь попадают сроки задач и этапы (вехи) проектов,
 * поэтому и на главной, и на отдельной странице показываются одни и те же данные.
 */

export type CalendarEventKind = 'task' | 'milestone'

export interface CalendarEvent {
  id: string
  kind: CalendarEventKind
  title: string
  project: string
  date: Date
  color: string
  done?: boolean
  priority?: Priority
}

const PRIORITY_COLOR: Record<Priority, string> = {
  high: '#EF4444',
  medium: '#F5A524',
  low: '#8A94AC',
}

export const KIND_LABEL: Record<CalendarEventKind, string> = {
  task: 'задача',
  milestone: 'этап',
}

function buildEvents(): CalendarEvent[] {
  const tasks: CalendarEvent[] = TASKS.map((task) => ({
    id: `task-${task.id}`,
    kind: 'task',
    title: task.title,
    project: task.project,
    date: task.dueDate,
    color: PRIORITY_COLOR[task.priority],
    done: task.done,
    priority: task.priority,
  }))

  const milestones: CalendarEvent[] = MILESTONES.map((item) => ({
    id: `milestone-${item.id}`,
    kind: 'milestone',
    title: item.title,
    project: item.project,
    date: item.date,
    color: item.color,
  }))

  return [...tasks, ...milestones].sort((a, b) => a.date.getTime() - b.date.getTime())
}

export const EVENTS: CalendarEvent[] = buildEvents()

export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export interface DayCell {
  key: string
  date: Date
  inMonth: boolean
}

/** Сетка месяца с понедельником в качестве первого дня недели. */
export function buildMonth(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1)
  const leading = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const total = Math.ceil((leading + daysInMonth) / 7) * 7

  const cells: DayCell[] = []
  for (let index = 0; index < total; index += 1) {
    const date = new Date(year, month, index - leading + 1)
    cells.push({ key: dayKey(date), date, inMonth: date.getMonth() === month })
  }
  return cells
}

export function groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()

  events.forEach((event) => {
    const key = dayKey(event.date)
    const list = map.get(key)
    if (list) {
      list.push(event)
    } else {
      map.set(key, [event])
    }
  })

  return map
}

export function filterByKind(events: CalendarEvent[], kind: 'all' | CalendarEventKind): CalendarEvent[] {
  return kind === 'all' ? events : events.filter((event) => event.kind === kind)
}
