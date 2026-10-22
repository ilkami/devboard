import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import ProjectCard from '../components/ProjectCard'
import { PROJECTS } from '../data/mockData'
import { plural } from '../utils/plural'
import type { ProjectStatus } from '../types'

type Filter = 'all' | ProjectStatus
type Sort = 'due' | 'progress' | 'name'

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'В работе' },
  { key: 'paused', label: 'Пауза' },
  { key: 'archived', label: 'Архив' },
]

export default function ProjectsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('due')
  const [query, setQuery] = useState('')

  const counts = useMemo<Record<Filter, number>>(
    () => ({
      all: PROJECTS.length,
      active: PROJECTS.filter((item) => item.status === 'active').length,
      paused: PROJECTS.filter((item) => item.status === 'paused').length,
      archived: PROJECTS.filter((item) => item.status === 'archived').length,
    }),
    [],
  )

  const projects = useMemo(() => {
    const text = query.trim().toLowerCase()

    const filtered = PROJECTS.filter((item) => (filter === 'all' ? true : item.status === filter))
      .filter((item) => {
        if (!text) return true
        return (
          item.name.toLowerCase().includes(text) ||
          item.description.toLowerCase().includes(text) ||
          item.tech.some((tech) => tech.toLowerCase().includes(text))
        )
      })

    const sorted = [...filtered]
    if (sort === 'due') sorted.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    if (sort === 'progress') sorted.sort((a, b) => b.progress - a.progress)
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))

    return sorted
  }, [filter, sort, query])

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Проекты</h1>
          <p className="page-subtitle">
            {PROJECTS.length} {plural(PROJECTS.length, 'проект', 'проекта', 'проектов')} ·{' '}
            {counts.active} в работе · {counts.paused} на паузе
          </p>
        </div>

        <div className="page-head__actions">
          <label className="search search--compact">
            <Icon name="search" size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Название, описание, технология"
              aria-label="Поиск проектов"
            />
          </label>

          <label className="select">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              aria-label="Сортировка проектов"
            >
              <option value="due">По дедлайну</option>
              <option value="progress">По прогрессу</option>
              <option value="name">По названию</option>
            </select>
            <Icon name="chevron-down" size={14} />
          </label>
        </div>
      </header>

      <div className="filters">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={filter === item.key ? 'chip chip--active' : 'chip'}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
            <span className="chip__count">{counts[item.key]}</span>
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <Icon name="folder" size={26} />
          <p>По этому фильтру проектов нет</p>
        </div>
      ) : (
        <div className="project-grid project-grid--page">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="project-link">
              <ProjectCard project={project} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
