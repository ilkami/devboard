import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { TASKS } from './mockData'
import type { Priority, TaskItem } from '../types'

/**
 * Хранилище задач интерфейса.
 *
 * Задачи, подзадачи, отметки о выполнении и удаления сохраняются в localStorage,
 * поэтому изменения не теряются при перезагрузке страницы.
 * После подключения backend модуль заменяется вызовами /tasks и /tasks/{id}/subtasks.
 */

export interface StoredTask extends TaskItem {
  parentId: string | null
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
  subtasksOf: (parentId: string) => StoredTask[]
  createTask: (draft: TaskDraft) => void
  addSubtask: (parentId: string, title: string) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void
  resetTasks: () => void
}

const STORAGE_KEY = 'devboard.tasks'

type SerializedTask = Omit<StoredTask, 'dueDate'> & { dueDate: string }

function seed(): StoredTask[] {
  const roots: StoredTask[] = TASKS.map((task) => ({ ...task, parentId: null }))
  const first = roots[0]
  if (!first) return roots

  const subtasks: StoredTask[] = [
    { ...first, id: 'sub-auth-1', title: 'Сгенерировать пару ключей и секрет', parentId: first.id, done: true },
    { ...first, id: 'sub-auth-2', title: 'Написать зависимость get_current_user', parentId: first.id, done: false },
  ]

  return [...roots, ...subtasks]
}

function load(): StoredTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as SerializedTask[]
    return parsed.map((item) => ({ ...item, dueDate: new Date(item.dueDate) }))
  } catch {
    return seed()
  }
}

function save(tasks: StoredTask[]): void {
  const payload: SerializedTask[] = tasks.map((item) => ({
    ...item,
    dueDate: item.dueDate.toISOString(),
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<StoredTask[]>(load)

  const persist = useCallback((next: StoredTask[]) => {
    save(next)
    setTasks(next)
  }, [])

  const createTask = useCallback(
    (draft: TaskDraft) => {
      const task: StoredTask = {
        id: `t-${Date.now().toString(36)}`,
        title: draft.title.trim(),
        project: draft.project,
        priority: draft.priority,
        done: false,
        dueDate: new Date(`${draft.due}T00:00:00`),
        parentId: null,
      }
      persist([...tasks, task])
    },
    [tasks, persist],
  )

  const addSubtask = useCallback(
    (parentId: string, title: string) => {
      const parent = tasks.find((item) => item.id === parentId)
      if (!parent || title.trim().length === 0) return

      const subtask: StoredTask = {
        ...parent,
        id: `s-${Date.now().toString(36)}`,
        title: title.trim(),
        done: false,
        parentId,
      }
      persist([...tasks, subtask])
    },
    [tasks, persist],
  )

  const toggleTask = useCallback(
    (id: string) => {
      persist(tasks.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
    },
    [tasks, persist],
  )

  const removeTask = useCallback(
    (id: string) => {
      persist(tasks.filter((item) => item.id !== id && item.parentId !== id))
    },
    [tasks, persist],
  )

  const resetTasks = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setTasks(seed())
  }, [])

  const rootTasks = useMemo(() => tasks.filter((item) => item.parentId === null), [tasks])

  const subtasksOf = useCallback(
    (parentId: string) => tasks.filter((item) => item.parentId === parentId),
    [tasks],
  )

  const value = useMemo<TasksContextValue>(
    () => ({
      allTasks: tasks,
      rootTasks,
      subtasksOf,
      createTask,
      addSubtask,
      toggleTask,
      removeTask,
      resetTasks,
    }),
    [tasks, rootTasks, subtasksOf, createTask, addSubtask, toggleTask, removeTask, resetTasks],
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
