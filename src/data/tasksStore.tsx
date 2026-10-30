import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { TASKS } from './mockData'
import type { Priority, TaskItem, TaskStatus } from '../types'
import { useProjects } from './projectsStore'
import { useAuth } from '../auth/AuthContext'
import { api, ApiError, API_ENABLED } from '../api/client'
import type { ApiTask } from '../api/dto'
import { taskFromApi, toDayString } from '../api/mappers'

/**
 * Хранилище задач.
 *
 * В обычном режиме задачи читаются и изменяются через /tasks, поэтому изменения
 * видны на всех устройствах. Автономная сборка (file://) работает на localStorage.
 */

export interface StoredTask extends TaskItem {
  parentId: string | null
  projectId: string | null
  status: TaskStatus
  done: boolean
}

export interface TaskDraft {
  title: string
  project: string
  priority: Priority
  due: string
}

interface TasksContextValue {
  allTasks: StoredTask[]
  rootTasks: StoredTask[]
  ready: boolean
  subtasksOf: (parentId: string) => StoredTask[]
  createTask: (draft: TaskDraft) => Promise<string | null>
  addSubtask: (parentId: string, title: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  moveTask: (id: string, column: TaskStatus) => Promise<void>
  removeTask: (id: string) => Promise<void>
}

const STORAGE_KEY = 'devboard.tasks'

type SerializedTask = Omit<StoredTask, 'dueDate'> & { dueDate: string | null }

function withStatus(task: TaskItem): StoredTask {
  const status: TaskStatus = task.status ?? (task.done ? 'done' : 'todo')
  return {
    ...task,
    status,
    done: status === 'done',
    parentId: null,
    projectId: null,
  }
}

function seedLocal(): StoredTask[] {
  const roots: StoredTask[] = TASKS.map((task) => withStatus(task))
  const first = roots[0]
  if (!first) return roots

  const subtasks: StoredTask[] = [
    { ...first, id: 'sub-auth-1', title: 'Сгенерировать пару ключей и секрет', parentId: first.id, done: true, status: 'done' },
    { ...first, id: 'sub-auth-2', title: 'Написать зависимость get_current_user', parentId: first.id, done: false, status: 'todo' },
  ]

  return [...roots, ...subtasks]
}

function loadLocal(): StoredTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedLocal()
    const parsed = JSON.parse(raw) as SerializedTask[]
    return parsed.map((item) => ({
      ...item,
      done: item.status === 'done',
      dueDate: item.dueDate ? new Date(item.dueDate) : null,
    }))
  } catch {
    return seedLocal()
  }
}

function saveLocal(tasks: StoredTask[]): void {
  const payload: SerializedTask[] = tasks.map((item) => ({
    ...item,
    dueDate: item.dueDate ? item.dueDate.toISOString() : null,
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function TasksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { projects, ready: projectsReady, reload: reloadProjects } = useProjects()

  const [tasks, setTasks] = useState<StoredTask[]>(() => (API_ENABLED ? [] : loadLocal()))
  const [ready, setReady] = useState(!API_ENABLED)

  const projectNames = useMemo(() => {
    const map = new Map<string, string>()
    projects.forEach((project) => map.set(project.id, project.name))
    return map
  }, [projects])

  const reload = useCallback(async () => {
    try {
      const items = await api.get<ApiTask[]>('/tasks')
      setTasks(
        items.map((item) => taskFromApi(item, projectNames.get(String(item.project_id)) ?? '—')),
      )
    } catch (cause) {
      if (cause instanceof ApiError && cause.status !== 401) {
        console.error('Не удалось загрузить задачи', cause)
      }
      setTasks([])
    } finally {
      setReady(true)
    }
  }, [projectNames])

  useEffect(() => {
    if (!API_ENABLED) return
    if (!user) {
      setTasks([])
      setReady(false)
      return
    }
    // Ждём проекты: без них не определить название проекта у задачи
    if (!projectsReady) return
    void reload()
  }, [user, projectsReady, reload])

  /** Обновление прогресса проектов после изменения задач. */
  const syncProjects = useCallback(async () => {
    if (API_ENABLED) await reloadProjects()
  }, [reloadProjects])

  const createTask = useCallback(
    async (draft: TaskDraft): Promise<string | null> => {
      const title = draft.title.trim()
      if (title.length < 3) return 'Название должно содержать минимум 3 символа'

      const project = projects.find((item) => item.name === draft.project)
      if (!project) return 'Сначала создайте проект, к которому относится задача'
      if (!draft.due) return 'Укажите срок задачи'

      const dueDate = new Date(`${draft.due}T00:00:00`)

      if (API_ENABLED) {
        try {
          const created = await api.post<ApiTask>('/tasks', {
            project_id: Number(project.id),
            title,
            priority: draft.priority,
            status: 'todo',
            due_date: toDayString(dueDate),
          })
          setTasks((prev) => [...prev, taskFromApi(created, project.name)])
          await syncProjects()
          return null
        } catch (cause) {
          return cause instanceof Error ? cause.message : 'Не удалось создать задачу'
        }
      }

      const task: StoredTask = {
        id: `t-${Date.now().toString(36)}`,
        title,
        project: project.name,
        projectId: project.id,
        priority: draft.priority,
        done: false,
        status: 'todo',
        dueDate,
        parentId: null,
      }
      const next = [...tasks, task]
      saveLocal(next)
      setTasks(next)
      return null
    },
    [projects, tasks, syncProjects],
  )

  const addSubtask = useCallback(
    async (parentId: string, title: string) => {
      const text = title.trim()
      const parent = tasks.find((item) => item.id === parentId)
      if (!parent || text.length === 0) return

      if (API_ENABLED) {
        try {
          const created = await api.post<ApiTask>('/tasks', {
            project_id: Number(parent.projectId),
            parent_id: Number(parent.id),
            title: text,
            priority: parent.priority,
            status: 'todo',
            due_date: toDayString(parent.dueDate),
          })
          setTasks((prev) => [...prev, taskFromApi(created, parent.project)])
          await syncProjects()
        } catch (cause) {
          console.error('Не удалось добавить подзадачу', cause)
        }
        return
      }

      const subtask: StoredTask = {
        ...parent,
        id: `s-${Date.now().toString(36)}`,
        title: text,
        done: false,
        status: 'todo',
        parentId,
      }
      const next = [...tasks, subtask]
      saveLocal(next)
      setTasks(next)
    },
    [tasks, syncProjects],
  )

  const patchStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      if (API_ENABLED) {
        try {
          const updated = await api.patch<ApiTask>(`/tasks/${id}`, { status })
          setTasks((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, status: updated.status, done: updated.is_done }
                : item,
            ),
          )
          await syncProjects()
        } catch (cause) {
          console.error('Не удалось изменить статус задачи', cause)
        }
        return
      }

      const next = tasks.map((item) =>
        item.id === id ? { ...item, status, done: status === 'done' } : item,
      )
      saveLocal(next)
      setTasks(next)
    },
    [tasks, syncProjects],
  )

  const toggleTask = useCallback(
    async (id: string) => {
      const task = tasks.find((item) => item.id === id)
      if (!task) return
      await patchStatus(id, task.status === 'done' ? 'todo' : 'done')
    },
    [tasks, patchStatus],
  )

  const moveTask = useCallback(
    async (id: string, column: TaskStatus) => {
      await patchStatus(id, column)
    },
    [patchStatus],
  )

  const removeTask = useCallback(
    async (id: string) => {
      if (API_ENABLED) {
        try {
          await api.delete(`/tasks/${id}`)
          setTasks((prev) => prev.filter((item) => item.id !== id && item.parentId !== id))
          await syncProjects()
        } catch (cause) {
          console.error('Не удалось удалить задачу', cause)
        }
        return
      }

      const next = tasks.filter((item) => item.id !== id && item.parentId !== id)
      saveLocal(next)
      setTasks(next)
    },
    [tasks, syncProjects],
  )

  const rootTasks = useMemo(() => tasks.filter((item) => item.parentId === null), [tasks])

  const subtasksOf = useCallback(
    (parentId: string) => tasks.filter((item) => item.parentId === parentId),
    [tasks],
  )

  const value = useMemo<TasksContextValue>(
    () => ({
      allTasks: tasks,
      rootTasks,
      ready,
      subtasksOf,
      createTask,
      addSubtask,
      toggleTask,
      moveTask,
      removeTask,
    }),
    [tasks, rootTasks, ready, subtasksOf, createTask, addSubtask, toggleTask, moveTask, removeTask],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext)
  if (!context) {
    throw new Error('useTasks должен вызываться внутри TasksProvider')
  }
  return context
}
