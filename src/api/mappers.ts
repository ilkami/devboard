import type { ApiProject, ApiTask, ApiTechnology, ApiUser } from './dto'
import type { Project, TaskItem } from '../types'
import type { TechEntry } from '../data/techStore'
import type { StoredTask } from '../data/tasksStore'

/** Преобразование ответов API в доменные модели интерфейса. */

export function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'NP'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Дата без времени: API отдаёт ISO-дату (YYYY-MM-DD). */
export function parseDay(value: string | null): Date | null {
  if (!value) return null
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function toDayString(date: Date | null): string | null {
  if (!date) return null
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function projectFromApi(item: ApiProject): Project {
  return {
    id: String(item.id),
    name: item.name,
    short: monogram(item.name),
    description: item.description,
    status: item.status,
    icon: 'folder',
    accent: item.color,
    tech: item.technologies,
    progress: item.progress,
    dueDate: parseDay(item.due_date),
  }
}

export function taskFromApi(item: ApiTask, projectName: string): StoredTask {
  return {
    id: String(item.id),
    projectId: String(item.project_id),
    title: item.title,
    project: projectName,
    priority: item.priority,
    done: item.is_done,
    status: item.status,
    dueDate: parseDay(item.due_date),
    parentId: item.parent_id === null ? null : String(item.parent_id),
  }
}

export function taskToApi(task: TaskItem): { due_date: string | null } {
  return { due_date: toDayString(task.dueDate) }
}

export function technologyFromApi(item: ApiTechnology): TechEntry {
  return {
    id: String(item.id),
    name: item.name,
    short: item.short,
    color: item.color,
    category: item.category,
  }
}

export interface UiUser {
  id: string
  name: string
  email: string
  roleTitle: string
  createdAt: string
}

export function userFromApi(item: ApiUser): UiUser {
  return {
    id: String(item.id),
    name: item.name,
    email: item.email,
    roleTitle: item.role_title ?? 'Разработчик',
    createdAt: item.created_at ?? new Date().toISOString(),
  }
}
