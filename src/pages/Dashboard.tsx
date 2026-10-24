import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import KpiCard from '../components/KpiCard'
import ProjectCard from '../components/ProjectCard'
import TasksPanel from '../components/TasksPanel'
import CalendarPanel from '../components/CalendarPanel'
import TechPanel from '../components/TechPanel'
import ProgressPanel from '../components/ProgressPanel'
import { Panel } from '../components/ui'
import { formatShortDate, relativeDeadline, today } from '../data/mockData'
import { useProjects } from '../data/projectsStore'
import { useTasks } from '../data/tasksStore'
import type { ProjectStatus } from '../types'

type FilterKey = 'all' | ProjectStatus
type SortMode = 'due' | 'name'

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'В работе' },
  { key: 'paused', label: 'Пауза' },
  { key: 'archived', label: 'Архив' },
]

const DAY = 86_400_000

function dayDiff(date: Date): number {
  const flat = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  return Math.round((flat - today.getTime()) / DAY)
}

export default function Dashboard() {
  const { projects } = useProjects()
  const { rootTasks } = useTasks()

  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortMode>('due')

  const counts = useMemo(
    () => ({
      all: projects.length,
      active: projects.filter((project) => project.status === 'active').length,
      paused: projects.filter((project) => project.status === 'paused').length,
      archived: projects.filter((project) => project.status === 'archived').length,
    }),
    [projects],
  )

  const visibleProjects = useMemo(() => {
    const list = filter === 'all' ? projects : projects.filter((project) => project.status === filter)
    return sort === 'due'
      ? [...list].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      : [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [projects, filter, sort])

  const activeProjects = projects.filter((project) => project.status === 'active')

  const averageProgress =
    activeProjects.length === 0
      ? 0
      : Math.round(
          activeProjects.reduce((sum, project) => sum + project.progress, 0) / activeProjects.length,
        )

  const nearestDeadline =
    activeProjects.length === 0
      ? null
      : [...activeProjects].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]

  const weekTasks = rootTasks.filter((task) => dayDiff(task.dueDate) <= 7).length
  const overdueTasks = rootTasks.filter((task) => !task.done && dayDiff(task.dueDate) < 0).length

  return (
    <div className="dashboard">
      <header className="page-head">
        <div>
          <h1 className="page-title">Главная</h1>
          <p className="page-subtitle">
            Задачи, сроки, технологии и прогресс — всё в одном месте
          </p>
        </div>
        <span className="page-head__today">
          <Icon name="calendar" size={15} />
          {formatShortDate(new Date())}
        </span>
      </header>

      <div className="kpi-grid">
        <KpiCard
          label="Активные проекты"
          value={String(activeProjects.length)}
          icon="folder"
          accent="#3B62F6"
          hint={`всего в системе: ${counts.all}`}
          spark={{ values: [2, 3, 3, 4, 4, 5, 5], variant: 'bars' }}
        />
        <KpiCard
          label="Задачи на неделю"
          value={String(weekTasks)}
          icon="check-square"
          accent="#7C5CFC"
          hint={`просрочено: ${overdueTasks}`}
          spark={{ values: [4, 6, 5, 8, 7, 9, weekTasks], variant: 'bars' }}
        />
        <KpiCard
          label="Ближайший дедлайн"
          value={nearestDeadline ? formatShortDate(nearestDeadline.dueDate) : '—'}
          icon="clock"
          accent="#F5A524"
          warning
          hint={
            nearestDeadline
              ? `${relativeDeadline(nearestDeadline.dueDate)} · ${nearestDeadline.name}`
              : 'нет активных проектов'
          }
        />
        <KpiCard
          label="Средний прогресс"
          value={`${averageProgress}%`}
          icon="chart"
          accent="#12B981"
          hint="по активным проектам"
          spark={{ values: [34, 38, 41, 44, 46, averageProgress], variant: 'line' }}
        />
      </div>

      <div className="dashboard__grid">
        <Panel
          className="dashboard__projects"
          title="Мои проекты"
          subtitle={`Фильтр: ${FILTERS.find((item) => item.key === filter)?.label} · найдено ${visibleProjects.length}`}
          action={
            <label className="select">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                aria-label="Сортировка проектов"
              >
                <option value="due">По дате дедлайна</option>
                <option value="name">По названию</option>
              </select>
              <Icon name="chevron-down" size={14} />
            </label>
          }
        >
          <div className="filters">
            {FILTERS.map((item) => {
              const active = filter === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  className={active ? 'chip chip--active' : 'chip'}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                  <span className="chip__count">{counts[item.key]}</span>
                </button>
              )
            })}
          </div>

          <div className="project-grid">
            {visibleProjects.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`} className="project-link">
                <ProjectCard project={project} />
              </Link>
            ))}
            {visibleProjects.length === 0 && (
              <p className="empty">В этом статусе проектов нет</p>
            )}
          </div>
        </Panel>

        <div className="dashboard__tasks">
          <TasksPanel />
        </div>

        <div className="dashboard__calendar">
          <CalendarPanel />
        </div>

        <div className="dashboard__tech">
          <TechPanel />
        </div>

        <div className="dashboard__progress">
          <ProgressPanel />
        </div>
      </div>
    </div>
  )
}
