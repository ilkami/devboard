/** Доменные типы DevBoard. Совпадают с сущностями схемы БД (см. tz-devboard.md). */

export type Priority = 'high' | 'medium' | 'low'

export type ProjectStatus = 'active' | 'paused' | 'archived'

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
  dueDate: Date
}

export interface TaskItem {
  id: string
  title: string
  project: string
  priority: Priority
  done: boolean
  dueDate: Date
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
