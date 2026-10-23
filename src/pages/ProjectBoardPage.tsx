import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import KanbanBoard from '../components/KanbanBoard'
import { ProgressBar, TechTag } from '../components/ui'
import { PROJECTS, formatShortDate, isOverdue, relativeDeadline } from '../data/mockData'
import { useTasks } from '../data/tasksStore'

const STATUS_LABEL = {
  active: 'В работе',
  paused: 'Пауза',
  archived: 'Архив',
} as const

export default function ProjectBoardPage() {
  const { projectId } = useParams()
  const { allTasks } = useTasks()
  const project = PROJECTS.find((item) => item.id === projectId)

  if (!project) {
    return (
      <div className="page">
        <div className="empty-state">
          <Icon name="folder" size={26} />
          <p>Проект не найден</p>
          <Link className="button button--primary" to="/projects">
            К списку проектов
          </Link>
        </div>
      </div>
    )
  }

  const tasks = allTasks.filter((task) => task.project === project.name && task.parentId === null)
  const overdue = isOverdue(project.dueDate)

  return (
    <div className="page">
      <Link to="/projects" className="back-link">
        <Icon name="chevron-left" size={15} />
        Все проекты
      </Link>

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
          <span className={project.status === 'active' ? 'badge badge--active' : 'badge badge--paused'}>
            {STATUS_LABEL[project.status]}
          </span>
          <span className={overdue ? 'project-head__deadline is-overdue' : 'project-head__deadline'}>
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
              Перетащите задачу между колонками — положение сохраняется в браузере
            </p>
          </div>
        </header>

        <div className="panel__body">
          <KanbanBoard projectId={project.id} tasks={tasks} />
        </div>
      </section>
    </div>
  )
}
