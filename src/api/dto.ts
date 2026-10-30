import type { Priority, ProjectStatus } from '../types'

/** Формы ответов FastAPI. Имена полей совпадают с backend/app/serializers.py. */

export interface ApiUser {
  id: number
  email: string
  name: string
  role_title: string | null
  created_at: string | null
}

export interface ApiSession {
  user: ApiUser
  expires_in: number
  csrf_token: string
}

export interface ApiProject {
  id: number
  name: string
  description: string
  status: ProjectStatus
  color: string
  due_date: string | null
  created_at: string | null
  technologies: string[]
  tasks_total: number
  tasks_done: number
  tasks_overdue: number
  progress: number
}

export type ApiTaskStatus = 'todo' | 'in_progress' | 'done'

export interface ApiTask {
  id: number
  project_id: number
  parent_id: number | null
  title: string
  description: string
  status: ApiTaskStatus
  priority: Priority
  due_date: string | null
  estimate_hours: number | null
  order_index: number
  completed_at: string | null
  is_done: boolean
}

export interface ApiTechnology {
  id: number
  name: string
  category: 'language' | 'framework' | 'database' | 'devops'
  short: string
  color: string
  project_count: number
}
