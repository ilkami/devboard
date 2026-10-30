import { useMemo, useState } from 'react'
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
  tasks: TaskItem[]
  /** Перемещение карточки: статус задачи сохраняется через API. */
  onMove?: (taskId: string, column: ColumnKey) => void
}

export default function KanbanBoard({ tasks, onMove }: KanbanBoardProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<ColumnKey | null>(null)

  const grouped = useMemo(() => {
    const map: Record<ColumnKey, TaskItem[]> = { todo: [], in_progress: [], done: [] }

    tasks.forEach((task) => {
      // Колонка берётся из статуса задачи в базе, а не из порядка в списке
      const column: ColumnKey = task.status ?? (task.done ? 'done' : 'todo')
      map[column].push(task)
    })

    return map
  }, [tasks])

  const doneCount = grouped.done.length
  const percent = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100)

  const move = (taskId: string, column: ColumnKey) => {
    onMove?.(taskId, column)
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
