import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { Panel, PriorityBadge } from './ui'
import { isOverdue, today } from '../data/mockData'
import { useTasks } from '../data/tasksStore'
import type { StoredTask } from '../data/tasksStore'

const PERIODS = [
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: 'Неделя' },
  { key: 'all', label: 'Все' },
] as const

type Period = (typeof PERIODS)[number]['key']

const DAY = 86_400_000

function diffDays(task: StoredTask): number {
  const flat = new Date(
    task.dueDate.getFullYear(),
    task.dueDate.getMonth(),
    task.dueDate.getDate(),
  ).getTime()
  return Math.round((flat - today.getTime()) / DAY)
}

export default function TasksPanel() {
  const { rootTasks, toggleTask } = useTasks()
  const [period, setPeriod] = useState<Period>('today')

  const forPeriod = (key: Period): StoredTask[] => {
    if (key === 'all') return rootTasks
    const limit = key === 'today' ? 0 : 7
    return rootTasks.filter((task) => diffDays(task) <= limit)
  }

  const tasks = forPeriod(period)

  return (
    <Panel
      title="Мои задачи"
      action={
        <Link className="panel__link" to="/tasks">
          Смотреть все →
        </Link>
      }
    >
      <div className="tabs" role="tablist">
        {PERIODS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={period === item.key}
            className={period === item.key ? 'tabs__item tabs__item--active' : 'tabs__item'}
            onClick={() => setPeriod(item.key)}
          >
            {item.label}
            <span className="tabs__count">{forPeriod(item.key).length}</span>
          </button>
        ))}
      </div>

      <ul className="task-list">
        {tasks.map((task) => {
          const overdue = isOverdue(task.dueDate) && !task.done

          return (
            <li key={task.id} className={task.done ? 'task-row is-done' : 'task-row'}>
              <input
                type="checkbox"
                className="task-row__check"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                aria-label={`Выполнено: ${task.title}`}
              />

              <span className="task-row__text">
                <span className="task-row__title">{task.title}</span>
                <span className="task-row__project">{task.project}</span>
              </span>

              {overdue && (
                <span className="task-row__overdue" title="Просрочено">
                  <Icon name="alert" size={13} />
                </span>
              )}

              <PriorityBadge priority={task.priority} />
            </li>
          )
        })}

        {tasks.length === 0 && (
          <li className="task-row task-row--empty">На этот период задач нет</li>
        )}
      </ul>
    </Panel>
  )
}
