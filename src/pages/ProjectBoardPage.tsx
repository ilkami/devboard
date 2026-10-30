import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import KanbanBoard from '../components/KanbanBoard'
import ProjectModal from '../components/ProjectModal'
import { ProgressBar, TechTag } from '../components/ui'
import { formatShortDate, isOverdue, relativeDeadline } from '../data/mockData'
import { useProjects } from '../data/projectsStore'
import { useTasks } from '../data/tasksStore'
import type { ProjectStatus } from '../types'

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: 'В работе',
  paused: 'Пауза',
  archived: 'Архив',
}

export default function ProjectBoardPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { projects, ready, updateProject, setStatus, removeProject } = useProjects()
  const { allTasks, ready: tasksReady, moveTask } = useTasks()
  const [editing, setEditing] = useState(false)

  const project = projects.find((item) => item.id === projectId)

  if (!ready || !tasksReady) {
    return (
      <div className="page">
        <div className="empty-state">
          <span className="app-loading__spinner" />
          <p>Загружаем проект…</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="page">
        <div className="empty-state">
          <Icon name="folder" size={26} />
          <p>Проект не найден — возможно, он был удалён</p>
          <Link className="button button--primary" to="/projects">
            К списку проектов
          </Link>
        </div>
      </div>
    )
  }

  const tasks = allTasks.filter(
    (task) => task.project === project.name && task.parentId === null,
  )
  const overdue = isOverdue(project.dueDate)

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Удалить проект «${project.name}»? Вместе с ним исчезнет и его доска.`,
    )
    if (confirmed) {
      await removeProject(project.id)
      navigate('/projects')
    }
  }

  return (
    <div className="page">
      <div className="page-topline">
        <Link to="/projects" className="back-link">
          <Icon name="chevron-left" size={15} />
          Все проекты
        </Link>

        <div className="project-actions">
          <button type="button" className="button button--ghost" onClick={() => setEditing(true)}>
            <Icon name="settings" size={15} />
            Редактировать
          </button>

          {project.status === 'archived' ? (
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setStatus(project.id, 'active')}
            >
              <Icon name="folder" size={15} />
              Вернуть в работу
            </button>
          ) : (
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setStatus(project.id, 'archived')}
            >
              <Icon name="box" size={15} />
              В архив
            </button>
          )}

          <button type="button" className="button button--danger" onClick={handleDelete}>
            <Icon name="x" size={15} />
            Удалить
          </button>
        </div>
      </div>

      <header className="page-head page-head--project">
        <div className="project-head">
          <span
            className="project-head__icon"
            style={{ color: project.accent, background: `${project.accent}16` }}
          >
            <Icon name={project.icon} size={22} />
          </span>
          <div>
            <h1 className="page-title">{project.name}</h1>
            <p className="page-subtitle">{project.description}</p>
          </div>
        </div>

        <div className="project-head__meta">
          <span
            className={
              project.status === 'active' ? 'badge badge--active' : 'badge badge--paused'
            }
          >
            {STATUS_LABEL[project.status]}
          </span>
          <span
            className={overdue ? 'project-head__deadline is-overdue' : 'project-head__deadline'}
          >
            <Icon name="clock" size={14} />
            {formatShortDate(project.dueDate)} · {relativeDeadline(project.dueDate)}
          </span>
        </div>
      </header>

      <div className="project-summary">
        <div className="project-summary__cell">
          <span className="project-summary__label">Прогресс</span>
          <ProgressBar value={project.progress} color={project.accent} />
        </div>

        <div className="project-summary__cell">
          <span className="project-summary__label">Стек</span>
          <div className="project-card__tags">
            {project.tech.length === 0 && <span className="empty">Стек не указан</span>}
            {project.tech.map((name) => (
              <TechTag key={name} name={name} />
            ))}
          </div>
        </div>
      </div>

      <section className="panel">
        <header className="panel__head">
          <div className="panel__headings">
            <h2 className="panel__title">Kanban-доска</h2>
            <p className="panel__subtitle">
              Перетащите задачу между колонками — статус сохраняется в базе и влияет на прогресс
            </p>
          </div>
        </header>

        <div className="panel__body">
          <KanbanBoard tasks={tasks} onMove={moveTask} />
        </div>
      </section>

      {editing && (
        <ProjectModal
          initial={project}
          onClose={() => setEditing(false)}
          onSubmit={async (draft) => {
            const error = await updateProject(project.id, draft)
            if (error) return error
            setEditing(false)
            return null
          }}
        />
      )}
    </div>
  )
}
