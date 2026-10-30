import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { PROJECTS } from './mockData'
import type { Project, ProjectStatus } from '../types'
import { api, ApiError, API_ENABLED } from '../api/client'
import type { ApiProject } from '../api/dto'
import { monogram, projectFromApi, toDayString } from '../api/mappers'
import { useAuth } from '../auth/AuthContext'

/**
 * Хранилище проектов.
 *
 * В обычном режиме данные живут в PostgreSQL и запрашиваются через /projects.
 * Автономная сборка (file://) работает без сервера: тогда используется localStorage.
 */

export interface ProjectDraft {
  name: string
  description: string
  due: string
  tech: string[]
  status: ProjectStatus
  accent: string
}

interface ProjectsContextValue {
  projects: Project[]
  /** false, пока первый запрос к API не завершён. */
  ready: boolean
  error: string
  reload: () => Promise<void>
  createProject: (draft: ProjectDraft) => Promise<string | null>
  updateProject: (id: string, draft: ProjectDraft) => Promise<string | null>
  setStatus: (id: string, status: ProjectStatus) => Promise<void>
  removeProject: (id: string) => Promise<void>
}

const STORAGE_KEY = 'devboard.projects'

export const ACCENTS = ['#3B62F6', '#7C5CFC', '#12B981', '#F5A524', '#0EA5E9', '#EF4444']

type SerializedProject = Omit<Project, 'dueDate'> & { dueDate: string | null }

function loadLocal(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return PROJECTS
    const parsed = JSON.parse(raw) as SerializedProject[]
    if (!Array.isArray(parsed) || parsed.length === 0) return PROJECTS
    return parsed.map((item) => ({
      ...item,
      dueDate: item.dueDate ? new Date(item.dueDate) : null,
    }))
  } catch {
    return PROJECTS
  }
}

function saveLocal(projects: Project[]): void {
  const payload: SerializedProject[] = projects.map((item) => ({
    ...item,
    dueDate: item.dueDate ? item.dueDate.toISOString() : null,
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>(() => (API_ENABLED ? [] : loadLocal()))
  const [ready, setReady] = useState(!API_ENABLED)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!API_ENABLED) return
    try {
      const items = await api.get<ApiProject[]>('/projects')
      setProjects(items.map(projectFromApi))
      setError('')
    } catch (cause) {
      setProjects([])
      if (cause instanceof ApiError && cause.status !== 401) setError(cause.message)
    } finally {
      setReady(true)
    }
  }, [])

  // Данные перезапрашиваются при входе и смене пользователя
  useEffect(() => {
    if (!API_ENABLED) return
    if (!user) {
      setProjects([])
      setReady(false)
      return
    }
    void reload()
  }, [user, reload])

  const createProject = useCallback(
    async (draft: ProjectDraft): Promise<string | null> => {
      const name = draft.name.trim()
      if (name.length < 2) return 'Название должно содержать минимум 2 символа'
      if (projects.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        return 'Проект с таким названием уже существует'
      }

      const dueDate = draft.due ? new Date(`${draft.due}T00:00:00`) : null

      if (API_ENABLED) {
        try {
          const created = await api.post<ApiProject>('/projects', {
            name,
            description: draft.description.trim(),
            status: draft.status,
            color: draft.accent,
            due_date: toDayString(dueDate),
            technologies: draft.tech,
          })
          setProjects((prev) => [...prev, projectFromApi(created)])
          return null
        } catch (cause) {
          return cause instanceof Error ? cause.message : 'Не удалось создать проект'
        }
      }

      const project: Project = {
        id: `p-${Date.now().toString(36)}`,
        name,
        short: monogram(name),
        description: draft.description.trim(),
        status: draft.status,
        icon: 'folder',
        accent: draft.accent,
        tech: draft.tech,
        progress: 0,
        dueDate,
      }

      const next = [...projects, project]
      saveLocal(next)
      setProjects(next)
      return null
    },
    [projects],
  )

  const updateProject = useCallback(
    async (id: string, draft: ProjectDraft): Promise<string | null> => {
      const name = draft.name.trim()
      if (name.length < 2) return 'Название должно содержать минимум 2 символа'
      if (
        projects.some(
          (item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        return 'Проект с таким названием уже существует'
      }

      const dueDate = draft.due ? new Date(`${draft.due}T00:00:00`) : null

      if (API_ENABLED) {
        try {
          const updated = await api.patch<ApiProject>(`/projects/${id}`, {
            name,
            description: draft.description.trim(),
            status: draft.status,
            color: draft.accent,
            due_date: toDayString(dueDate),
            technologies: draft.tech,
          })
          setProjects((prev) =>
            prev.map((item) => (item.id === id ? projectFromApi(updated) : item)),
          )
          return null
        } catch (cause) {
          return cause instanceof Error ? cause.message : 'Не удалось сохранить проект'
        }
      }

      const next = projects.map((item) =>
        item.id === id
          ? {
              ...item,
              name,
              short: monogram(name),
              description: draft.description.trim(),
              status: draft.status,
              accent: draft.accent,
              tech: draft.tech,
              dueDate,
            }
          : item,
      )
      saveLocal(next)
      setProjects(next)
      return null
    },
    [projects],
  )

  const setStatus = useCallback(
    async (id: string, status: ProjectStatus) => {
      if (API_ENABLED) {
        try {
          const updated = await api.patch<ApiProject>(`/projects/${id}`, { status })
          setProjects((prev) =>
            prev.map((item) => (item.id === id ? projectFromApi(updated) : item)),
          )
        } catch {
          await reload()
        }
        return
      }

      const next = projects.map((item) => (item.id === id ? { ...item, status } : item))
      saveLocal(next)
      setProjects(next)
    },
    [projects, reload],
  )

  const removeProject = useCallback(
    async (id: string) => {
      if (API_ENABLED) {
        try {
          await api.delete(`/projects/${id}`)
        } catch {
          await reload()
          return
        }
        setProjects((prev) => prev.filter((item) => item.id !== id))
        return
      }

      const next = projects.filter((item) => item.id !== id)
      saveLocal(next)
      setProjects(next)
    },
    [projects, reload],
  )

  const value = useMemo<ProjectsContextValue>(
    () => ({
      projects,
      ready,
      error,
      reload,
      createProject,
      updateProject,
      setStatus,
      removeProject,
    }),
    [projects, ready, error, reload, createProject, updateProject, setStatus, removeProject],
  )

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
}

export function useProjects(): ProjectsContextValue {
  const context = useContext(ProjectsContext)
  if (!context) {
    throw new Error('useProjects должен вызываться внутри ProjectsProvider')
  }
  return context
}

export function toDateInputValue(date: Date | null): string {
  if (!date) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
