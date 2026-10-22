import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { Panel, PriorityBadge } from './ui'
import { isOverdue, tasksForPeriod } from '../data/mockData'

const PERIODS = [
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: 'Неделя' },
  { key: 'all', label: 'Все' },
] as const

type Period = (typeof PERIODS)[number]['key']

export default function TasksPanel() {
  const [period, setPeriod] = useState<Period>('today')
  const [doneIds, setDoneIds] = useState<string[]>([])
  const tasks = tasksForPeriod(period)

  const toggle = (id: string) => {
    setDoneIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  return (
    <Panel
      title="Мои задачи"
      action={
        <Link className="panel__link" to="/tasks">
          Смотреть все →
        </Link>
      }
    >
      <div className="tabs" role="tablist" aria-label="Период задач">
        {PERIODS.map((item) => {
          const active = period === item.key
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? 'tabs__item tabs__item--active' : 'tabs__item'}
              onClick={() => setPeriod(item.key)}
            >
              {item.label}
              <span className="tabs__count">{tasksForPeriod(item.key).length}</span>
            </button>
          )
        })}
      </div>

      <ul className="task-list">
        {tasks.map((task) => {
          const done = task.done || doneIds.includes(task.id)
          const overdue = isOverdue(task.dueDate) && !done

          return (
            <li key={task.id} className={done ? 'task-row is-done' : 'task-row'}>
              <input
                type="checkbox"
                className="task-row__check"
                checked={done}
                onChange={() => toggle(task.id)}
                aria-label={`Отметить выполненной задачу «${task.title}»`}
              />
              <span className="task-row__text">
                <span className="task-row__title">{task.title}</span>
                <span className="task-row__project">{task.project}</span>
              </span>
              {overdue && (
                <span className="task-row__overdue" title="Срок истёк">
                  <Icon name="alert" size={13} />
                </span>
              )}
              <PriorityBadge priority={task.priority} />
            </li>
          )
        })}

        {tasks.length === 0 && <li className="task-row task-row--empty">На этот период задач нет</li>}
      </ul>
    </Panel>
  )
}
