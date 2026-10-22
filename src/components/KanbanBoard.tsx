import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon'
import { PriorityBadge } from './ui'
import { formatShortDate, isOverdue } from '../data/mockData'
import type { TaskItem } from '../types'

export type ColumnKey = 'todo' | 'in_progress' | 'done'

const COLUMNS: Array<{ key: ColumnKey; title: string }> = [
  { key: 'todo', title: 'To Do' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'done', title: 'Done' },
]

interface KanbanBoardProps {
  projectId: string
  tasks: TaskItem[]
}

export default function KanbanBoard({ projectId, tasks }: KanbanBoardProps) {
  const storageKey = `devboard.board.${projectId}`

  // Перемещения задач хранятся отдельно от исходных данных,
  // поэтому доска сохраняется даже после перезагрузки страницы.
  const [moves, setMoves] = useState<Record<string, ColumnKey>>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as Record<string, ColumnKey>) : {}
    } catch {
      return {}
    }
  })

  const [dragId, setDragId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<ColumnKey | null>(null)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(moves))
  }, [storageKey, moves])

  const grouped = useMemo(() => {
    const map: Record<ColumnKey, TaskItem[]> = { todo: [], in_progress: [], done: [] }

    tasks.forEach((task, index) => {
      const column = moves[task.id] ?? (task.done ? 'done' : index % 2 === 0 ? 'in_progress' : 'todo')
      map[column].push(task)
    })

    return map
  }, [tasks, moves])

  const doneCount = grouped.done.length
  const percent = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100)

  const move = (taskId: string, column: ColumnKey) => {
    setMoves((previous) => ({ ...previous, [taskId]: column }))
  }

  return (
    <>
      <div className="kanban">
        {COLUMNS.map((column) => (
          <div
            key={column.key}
            className={overColumn === column.key ? 'kanban__col kanban__col--over' : 'kanban__col'}
            onDragOver={(event) => {
              event.preventDefault()
              setOverColumn(column.key)
            }}
            onDragLeave={() => setOverColumn(null)}
            onDrop={(event) => {
              event.preventDefault()
              if (dragId) move(dragId, column.key)
              setDragId(null)
              setOverColumn(null)
            }}
          >
            <div className="kanban__head">
              <span className={`kanban__dot kanban__dot--${column.key}`} />
              <span className="kanban__title">{column.title}</span>
              <span className="kanban__count">{grouped[column.key].length}</span>
            </div>

            <div className="kanban__list">
              {grouped[column.key].map((task) => {
                const overdue = isOverdue(task.dueDate) && column.key !== 'done'

                return (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => setDragId(null)}
                    className={dragId === task.id ? 'kanban-card is-dragging' : 'kanban-card'}
                  >
                    <p className="kanban-card__title">{task.title}</p>
                    <div className="kanban-card__meta">
                      <span className={overdue ? 'kanban-card__date is-overdue' : 'kanban-card__date'}>
                        <Icon name="calendar" size={12} />
                        {formatShortDate(task.dueDate)}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </article>
                )
              })}

              {grouped[column.key].length === 0 && (
                <p className="kanban__empty">Перетащите задачу сюда</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="kanban__summary">
        <span>
          Прогресс по задачам: <strong>{percent}%</strong>
        </span>
        <span>
          {doneCount} из {tasks.length} выполнено
        </span>
      </div>
    </>
  )
}
