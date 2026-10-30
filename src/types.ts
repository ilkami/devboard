/** Доменные типы DevBoard. Совпадают с сущностями схемы БД (см. tz-devboard.md). */

export type Priority = 'high' | 'medium' | 'low'

export type ProjectStatus = 'active' | 'paused' | 'archived'

/** Колонки Kanban-доски; совпадают с кодами статусов в таблице task_statuses. */
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export type IconName =
  | 'home'
  | 'folder'
  | 'check-square'
  | 'calendar'
  | 'layers'
  | 'chart'
  | 'settings'
  | 'search'
  | 'plus'
  | 'bell'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'clock'
  | 'code'
  | 'flag'
  | 'list'
  | 'globe'
  | 'send'
  | 'sparkles'
  | 'box'
  | 'book'
  | 'target'
  | 'alert'
  | 'x'

export interface Project {
  id: string
  name: string
  short: string
  description: string
  status: ProjectStatus
  icon: IconName
  accent: string
  tech: string[]
  progress: number
  /** null — срок не задан (поле due_date в базе допускает NULL). */
  dueDate: Date | null
}

export interface TaskItem {
  id: string
  title: string
  project: string
  priority: Priority
  done: boolean
  dueDate: Date | null
  status?: TaskStatus
}

export interface Technology {
  name: string
  short: string
  color: string
}

export interface MilestoneItem {
  id: string
  title: string
  project: string
  date: Date
  color: string
}
