import { useState } from 'react'
import type { FormEvent } from 'react'
import Icon from '../components/Icon'
import { PriorityBadge } from '../components/ui'
import { dayKey } from '../data/calendar'
import { PROJECTS, formatShortDate, today } from '../data/mockData'
import { useTasks } from '../data/tasksStore'
import type { StoredTask, TaskDraft } from '../data/tasksStore'
import type { Priority } from '../types'

type Period = 'all' | 'today' | 'week' | 'overdue'
type Bucket = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later'

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: 'Неделя' },
  { key: 'overdue', label: 'Просроченные' },
]

const PRIORITY_OPTIONS: Array<{ value: 'all' | Priority; label: string }> = [
  { value: 'all', label: 'Все приоритеты' },
  { value: 'high', label: 'Высокий' },
  { value: 'medium', label: 'Средний' },
  { value: 'low', label: 'Низкий' },
]

const BUCKET_LABEL: Record<Bucket, string> = {
  overdue: 'Просроченные',
  today: 'Сегодня',
  tomorrow: 'Завтра',
  week: 'На этой неделе',
  later: 'Позже',
}

const BUCKET_ORDER: Bucket[] = ['overdue', 'today', 'tomorrow', 'week', 'later']

const DAY = 86_400_000

function diffDays(date: Date): number {
  const flat = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  return Math.round((flat - today.getTime()) / DAY)
}

function bucketOf(task: StoredTask): Bucket {
  const diff = diffDays(task.dueDate)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff <= 7) return 'week'
  return 'later'
}

function isoIn(days: number): string {
  return dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days))
}

export default function TasksPage() {
  const { rootTasks, subtasksOf, toggleTask, removeTask, createTask, addSubtask } = useTasks()

  const [period, setPeriod] = useState<Period>('all')
  const [project, setProject] = useState('all')
  const [priority, setPriority] = useState<'all' | Priority>('all')
  const [query, setQuery] = useState('')
  const [hideDone, setHideDone] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [modalOpen, setModalOpen] = useState(false)

  const text = query.trim().toLowerCase()

  const visible = rootTasks.filter((task) => {
    if (project !== 'all' && task.project !== project) return false
    if (priority !== 'all' && task.priority !== priority) return false
    if (hideDone && task.done) return false
    if (text && !task.title.toLowerCase().includes(text)) return false
    return true
  })

  const counts: Record<Period, number> = {
    all: visible.length,
    today: visible.filter((task) => diffDays(task.dueDate) <= 0).length,
    week: visible.filter((task) => diffDays(task.dueDate) <= 7).length,
    overdue: visible.filter((task) => !task.done && diffDays(task.dueDate) < 0).length,
  }

  const listed = visible.filter((task) => {
    if (period === 'all') return true
    const diff = diffDays(task.dueDate)
    if (period === 'overdue') return diff < 0 && !task.done
    if (period === 'today') return diff <= 0
    return diff <= 7
  })

  const groups = BUCKET_ORDER.map((bucket) => ({
    bucket,
    items: listed.filter((task) => bucketOf(task) === bucket),
  })).filter((group) => group.items.length > 0)

  const doneCount = rootTasks.filter((task) => task.done).length
  const overdueCount = rootTasks.filter((task) => !task.done && diffDays(task.dueDate) < 0).length

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Задачи</h1>
          <p className="page-subtitle">
            {rootTasks.length} задач · {doneCount} выполнено · {overdueCount} просрочено
          </p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="button button--primary" onClick={() => setModalOpen(true)}>
            <Icon name="plus" size={15} />
            Новая задача
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="filters">
          {PERIODS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={period === item.key ? 'chip chip--active' : 'chip'}
              onClick={() => setPeriod(item.key)}
            >
              {item.label}
              <span className="chip__count">{counts[item.key]}</span>
            </button>
          ))}
        </div>

        <div className="toolbar__right">
          <label className="search search--compact">
            <Icon name="search" size={15} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по названию"
              aria-label="Поиск задач"
            />
          </label>

          <label className="select">
            <select
              value={project}
              onChange={(event) => setProject(event.target.value)}
              aria-label="Проект"
            >
              <option value="all">Все проекты</option>
              {PROJECTS.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={14} />
          </label>

          <label className="select">
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as 'all' | Priority)}
              aria-label="Приоритет"
            >
              {PRIORITY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={14} />
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={hideDone}
              onChange={(event) => setHideDone(event.target.checked)}
            />
            <span>Скрыть выполненные</span>
          </label>
        </div>
      </div>

      <section className="panel">
        <div className="panel__body">
          {groups.length === 0 && (
            <p className="empty">Под выбранные условия задач нет</p>
          )}

          {groups.map((group) => (
            <div key={group.bucket} className="task-group">
              <div className="task-group__head">
                <span
                  className={
                    group.bucket === 'overdue' ? 'task-group__title is-overdue' : 'task-group__title'
                  }
                >
                  {BUCKET_LABEL[group.bucket]}
                </span>
                <span className="task-group__count">{group.items.length}</span>
              </div>

              <ul className="task-table">
                {group.items.map((task) => {
                  const subs = subtasksOf(task.id)
                  const doneSubs = subs.filter((sub) => sub.done).length
                  const isOpen = Boolean(expanded[task.id])
                  const overdue = !task.done && diffDays(task.dueDate) < 0

                  return (
                    <li key={task.id} className="task-item">
                      <div className={task.done ? 'task-line is-done' : 'task-line'}>
                        <input
                          type="checkbox"
                          className="task-line__check"
                          checked={task.done}
                          onChange={() => toggleTask(task.id)}
                          aria-label={`Выполнено: ${task.title}`}
                        />

                        {subs.length > 0 ? (
                          <button
                            type="button"
                            className={isOpen ? 'task-line__toggle is-open' : 'task-line__toggle'}
                            onClick={() =>
                              setExpanded((prev) => ({ ...prev, [task.id]: !prev[task.id] }))
                            }
                            aria-label="Показать подзадачи"
                            aria-expanded={isOpen}
                          >
                            <Icon name="chevron-right" size={14} />
                          </button>
                        ) : (
                          <span className="task-line__toggle is-empty" />
                        )}

                        <span className="task-line__body">
                          <span className="task-line__title">{task.title}</span>
                          <span className="task-line__meta">
                            {task.project}
                            {subs.length > 0 ? ` · подзадачи ${doneSubs}/${subs.length}` : ''}
                          </span>
                        </span>

                        <span className={overdue ? 'task-line__date is-overdue' : 'task-line__date'}>
                          {formatShortDate(task.dueDate)}
                        </span>

                        <PriorityBadge priority={task.priority} />

                        <button
                          type="button"
                          className="task-line__remove"
                          onClick={() => removeTask(task.id)}
                          aria-label="Удалить задачу"
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </div>

                      {isOpen && (
                        <div className="subtasks">
                          <ul className="subtasks__list">
                            {subs.map((sub) => (
                              <li key={sub.id} className={sub.done ? 'subtask is-done' : 'subtask'}>
                                <input
                                  type="checkbox"
                                  className="task-line__check"
                                  checked={sub.done}
                                  onChange={() => toggleTask(sub.id)}
                                  aria-label={`Выполнено: ${sub.title}`}
                                />
                                <span className="subtask__title">{sub.title}</span>
                                <button
                                  type="button"
                                  className="task-line__remove"
                                  onClick={() => removeTask(sub.id)}
                                  aria-label="Удалить подзадачу"
                                >
                                  <Icon name="x" size={13} />
                                </button>
                              </li>
                            ))}
                          </ul>

                          <form
                            className="subtasks__form"
                            onSubmit={(event) => {
                              event.preventDefault()
                              addSubtask(task.id, drafts[task.id] ?? '')
                              setDrafts((prev) => ({ ...prev, [task.id]: '' }))
                            }}
                          >
                            <input
                              className="field__input field__input--sm"
                              value={drafts[task.id] ?? ''}
                              onChange={(event) =>
                                setDrafts((prev) => ({ ...prev, [task.id]: event.target.value }))
                              }
                              placeholder="Новая подзадача"
                              aria-label="Название подзадачи"
                            />
                            <button type="submit" className="button button--ghost button--sm">
                              Добавить
                            </button>
                          </form>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {modalOpen && (
        <TaskModal
          onClose={() => setModalOpen(false)}
          onCreate={createTask}
        />
      )}
    </div>
  )
}

interface TaskModalProps {
  onClose: () => void
  onCreate: (draft: TaskDraft) => void
}

function TaskModal({ onClose, onCreate }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [project, setProject] = useState(PROJECTS[0]?.name ?? '')
  const [priority, setPriority] = useState<Priority>('medium')
  const [due, setDue] = useState(() => isoIn(7))
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (title.trim().length < 3) {
      setError('Название должно содержать минимум 3 символа')
      return
    }
    onCreate({ title, project, priority, due })
    onClose()
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Новая задача">
      <button type="button" className="modal__backdrop" onClick={onClose} aria-label="Закрыть" />

      <div className="modal__card">
        <div className="modal__head">
          <h2 className="modal__title">Новая задача</h2>
          <button type="button" className="icon-button icon-button--sm" onClick={onClose} aria-label="Закрыть">
            <Icon name="x" size={15} />
          </button>
        </div>

        <form className="form" onSubmit={submit}>
          <label className="field">
            <span className="field__label">Название</span>
            <input
              className="field__input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Что нужно сделать"
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field__label">Проект</span>
            <select
              className="field__input"
              value={project}
              onChange={(event) => setProject(event.target.value)}
            >
              {PROJECTS.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Приоритет</span>
              <select
                className="field__input"
                value={priority}
                onChange={(event) => setPriority(event.target.value as Priority)}
              >
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
            </label>

            <label className="field">
              <span className="field__label">Срок</span>
              <input
                type="date"
                className="field__input"
                value={due}
                onChange={(event) => setDue(event.target.value)}
              />
            </label>
          </div>

          {error && <p className="form__error">{error}</p>}

          <div className="modal__actions">
            <button type="button" className="button button--ghost" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="button button--primary">
              Создать задачу
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
