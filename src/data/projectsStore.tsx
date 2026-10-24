import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { PROJECTS } from './mockData'
import type { Project, ProjectStatus } from '../types'

/**
 * Хранилище проектов.
 * Создание, редактирование, архивирование и удаление сохраняются в localStorage.
 * При подключении backend заменяется вызовами /projects.
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
  createProject: (draft: ProjectDraft) => string | null
  updateProject: (id: string, draft: ProjectDraft) => string | null
  setStatus: (id: string, status: ProjectStatus) => void
  removeProject: (id: string) => void
  resetProjects: () => void
}

const STORAGE_KEY = 'devboard.projects'

export const ACCENTS = ['#3B62F6', '#7C5CFC', '#12B981', '#F5A524', '#0EA5E9', '#EF4444']

type SerializedProject = Omit<Project, 'dueDate'> & { dueDate: string }

function monogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'NP'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function load(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return PROJECTS
    const parsed = JSON.parse(raw) as SerializedProject[]
    if (!Array.isArray(parsed) || parsed.length === 0) return PROJECTS
    return parsed.map((item) => ({ ...item, dueDate: new Date(item.dueDate) }))
  } catch {
    return PROJECTS
  }
}

function save(projects: Project[]): void {
  const payload: SerializedProject[] = projects.map((item) => ({
    ...item,
    dueDate: item.dueDate.toISOString(),
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(load)

  const persist = useCallback((next: Project[]) => {
    save(next)
    setProjects(next)
  }, [])

  const createProject = useCallback(
    (draft: ProjectDraft): string | null => {
      const name = draft.name.trim()
      if (name.length < 2) return 'Название должно содержать минимум 2 символа'
      if (projects.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        return 'Проект с таким названием уже существует'
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
        dueDate: new Date(`${draft.due}T00:00:00`),
      }

      persist([...projects, project])
      return null
    },
    [projects, persist],
  )

  const updateProject = useCallback(
    (id: string, draft: ProjectDraft): string | null => {
      const name = draft.name.trim()
      if (name.length < 2) return 'Название должно содержать минимум 2 символа'
      if (
        projects.some(
          (item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        return 'Проект с таким названием уже существует'
      }

      persist(
        projects.map((item) =>
          item.id === id
            ? {
                ...item,
                name,
                short: monogram(name),
                description: draft.description.trim(),
                status: draft.status,
                accent: draft.accent,
                tech: draft.tech,
                dueDate: new Date(`${draft.due}T00:00:00`),
              }
            : item,
        ),
      )
      return null
    },
    [projects, persist],
  )

  const setStatus = useCallback(
    (id: string, status: ProjectStatus) => {
      persist(projects.map((item) => (item.id === id ? { ...item, status } : item)))
    },
    [projects, persist],
  )

  const removeProject = useCallback(
    (id: string) => {
      persist(projects.filter((item) => item.id !== id))
    },
    [projects, persist],
  )

  const resetProjects = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setProjects(PROJECTS)
  }, [])

  const value = useMemo<ProjectsContextValue>(
    () => ({
      projects,
      createProject,
      updateProject,
      setStatus,
      removeProject,
      resetProjects,
    }),
    [projects, createProject, updateProject, setStatus, removeProject, resetProjects],
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

export function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
