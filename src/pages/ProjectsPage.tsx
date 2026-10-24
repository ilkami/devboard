import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import ProjectCard from '../components/ProjectCard'
import ProjectModal from '../components/ProjectModal'
import { useProjects } from '../data/projectsStore'
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
  const { projects, createProject } = useProjects()
  const [params, setParams] = useSearchParams()

  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('due')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  // Кнопка «Новый проект» в шапке открывает эту страницу с ?new=1
  useEffect(() => {
    if (params.get('new') === '1') {
      setModalOpen(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const counts = useMemo(
    () => ({
      all: projects.length,
      active: projects.filter((project) => project.status === 'active').length,
      paused: projects.filter((project) => project.status === 'paused').length,
      archived: projects.filter((project) => project.status === 'archived').length,
    }),
    [projects],
  )

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase()
    const list = projects.filter((project) => {
      if (filter !== 'all' && project.status !== filter) return false
      if (!text) return true
      return (
        project.name.toLowerCase().includes(text) ||
        project.description.toLowerCase().includes(text) ||
        project.tech.some((item) => item.toLowerCase().includes(text))
      )
    })

    if (sort === 'due') return [...list].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    if (sort === 'progress') return [...list].sort((a, b) => b.progress - a.progress)
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [projects, filter, sort, query])

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Проекты</h1>
          <p className="page-subtitle">
            {counts.all} {plural(counts.all, 'проект', 'проекта', 'проектов')} · {counts.active} в работе ·{' '}
            {counts.archived} в архиве
          </p>
        </div>

        <div className="page-head__actions">
          <label className="search search--compact">
            <Icon name="search" size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по названию, описанию, технологии"
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

          <button
            type="button"
            className="button button--primary"
            onClick={() => setModalOpen(true)}
          >
            <Icon name="plus" size={15} />
            Новый проект
          </button>
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

      {visible.length === 0 ? (
        <div className="empty-state">
          <Icon name="folder" size={26} />
          <p>Под выбранные условия проектов нет</p>
          <button type="button" className="button button--primary" onClick={() => setModalOpen(true)}>
            Создать проект
          </button>
        </div>
      ) : (
        <div className="project-grid project-grid--page">
          {visible.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="project-link">
              <ProjectCard project={project} />
            </Link>
          ))}
        </div>
      )}

      {modalOpen && (
        <ProjectModal
          onClose={() => setModalOpen(false)}
          onSubmit={(draft) => {
            const error = createProject(draft)
            if (error) return error
            setModalOpen(false)
            return null
          }}
        />
      )}
    </div>
  )
}
