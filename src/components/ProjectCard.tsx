import Icon from './Icon'
import { ProgressBar, TechTag } from './ui'
import { formatShortDate, isOverdue, relativeDeadline } from '../data/mockData'
import type { Project } from '../types'

export default function ProjectCard({ project }: { project: Project }) {
  const overdue = isOverdue(project.dueDate)

  return (
    <article className="project-card">
      <div className="project-card__top">
        <span
          className="project-card__icon"
          style={{ color: project.accent, background: `${project.accent}14` }}
        >
          <Icon name={project.icon} size={19} />
        </span>
        <div className="project-card__headings">
          <h3 className="project-card__name">{project.name}</h3>
          <p className="project-card__description">{project.description}</p>
        </div>
      </div>

      <div className="project-card__tags">
        {project.tech.map((tech) => (
          <TechTag key={tech} name={tech} />
        ))}
      </div>

      <ProgressBar value={project.progress} color={project.accent} />

      <div className="project-card__footer">
        <span className={overdue ? 'project-card__deadline is-overdue' : 'project-card__deadline'}>
          <Icon name="clock" size={13} />
          Дедлайн: {formatShortDate(project.dueDate)}
        </span>
        {project.status === 'paused' && <span className="badge badge--paused">Пауза</span>}
        {overdue && <span className="badge badge--overdue">{relativeDeadline(project.dueDate)}</span>}
      </div>
    </article>
  )
}
