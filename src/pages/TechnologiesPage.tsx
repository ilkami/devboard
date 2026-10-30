import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { ProgressBar } from '../components/ui'
import { formatShortDate } from '../data/mockData'
import { useProjects } from '../data/projectsStore'
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  TECH_PALETTE,
  useTechnologies,
} from '../data/techStore'
import type { TechCategory, TechDraft } from '../data/techStore'
import { plural } from '../utils/plural'

type CategoryFilter = 'all' | TechCategory

export default function TechnologiesPage() {
  const { technologies, addTechnology } = useTechnologies()
  const { projects } = useProjects()

  const [category, setCategory] = useState<CategoryFilter>('all')
  const [query, setQuery] = useState('')
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const projectsOf = (name: string) =>
    projects.filter((project) => project.tech.includes(name))

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    return technologies.filter((tech) => {
      if (category !== 'all' && tech.category !== category) return false
      if (text && !tech.name.toLowerCase().includes(text)) return false
      return true
    })
  }, [technologies, category, query])

  const selected = filtered.find((tech) => tech.name === selectedName) ?? filtered[0] ?? null
  const selectedProjects = selected ? projectsOf(selected.name) : []

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: technologies.length,
      language: 0,
      framework: 0,
      database: 0,
      devops: 0,
    }
    technologies.forEach((tech) => {
      counts[tech.category] += 1
    })
    return counts
  }, [technologies])

  const usedCount = technologies.filter((tech) => projectsOf(tech.name).length > 0).length

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Технологии</h1>
          <p className="page-subtitle">
            {technologies.length} {plural(technologies.length, 'технология', 'технологии', 'технологий')} в
            справочнике · {usedCount} используется в проектах
          </p>
        </div>
        <div className="page-head__actions">
          <label className="search search--compact">
            <Icon name="search" size={15} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск технологии"
              aria-label="Поиск технологии"
            />
          </label>
          <button
            type="button"
            className="button button--primary"
            onClick={() => setModalOpen(true)}
          >
            <Icon name="plus" size={15} />
            Добавить
          </button>
        </div>
      </header>

      <div className="filters">
        <button
          type="button"
          className={category === 'all' ? 'chip chip--active' : 'chip'}
          onClick={() => setCategory('all')}
        >
          Все
          <span className="chip__count">{categoryCounts.all}</span>
        </button>

        {CATEGORY_ORDER.map((item) => (
          <button
            key={item}
            type="button"
            className={category === item ? 'chip chip--active' : 'chip'}
            onClick={() => setCategory(item)}
          >
            {CATEGORY_LABEL[item]}
            <span className="chip__count">{categoryCounts[item]}</span>
          </button>
        ))}
      </div>

      <div className="tech-layout">
        <section className="panel">
          <div className="panel__body">
            {filtered.length === 0 && <p className="empty">По вашему запросу технологий нет</p>}

            <div className="tech-cards">
              {filtered.map((tech) => {
                const count = projectsOf(tech.name).length
                const isSelected = selected?.name === tech.name

                return (
                  <button
                    key={tech.name}
                    type="button"
                    className={isSelected ? 'tech-card is-selected' : 'tech-card'}
                    onClick={() => setSelectedName(tech.name)}
                  >
                    <span
                      className="tech-card__mark"
                      style={{
                        color: tech.color,
                        background: `${tech.color}14`,
                        borderColor: `${tech.color}33`,
                      }}
                    >
                      {tech.short}
                    </span>
                    <span className="tech-card__name">{tech.name}</span>
                    <span className="tech-card__meta">
                      {CATEGORY_LABEL[tech.category]} · {count}{' '}
                      {plural(count, 'проект', 'проекта', 'проектов')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <aside className="panel">
          <div className="panel__body">
            {selected ? (
              <>
                <div className="tech-detail__head">
                  <span
                    className="tech-card__mark"
                    style={{
                      color: selected.color,
                      background: `${selected.color}14`,
                      borderColor: `${selected.color}33`,
                    }}
                  >
                    {selected.short}
                  </span>
                  <div>
                    <div className="tech-detail__name">{selected.name}</div>
                    <div className="tech-detail__meta">
                      {CATEGORY_LABEL[selected.category]} ·{' '}
                      {selectedProjects.length}{' '}
                      {plural(selectedProjects.length, 'проект', 'проекта', 'проектов')}
                    </div>
                  </div>
                </div>

                {selectedProjects.length === 0 ? (
                  <p className="tech-detail__empty">
                    Технология добавлена в справочник, но пока не привязана ни к одному проекту.
                  </p>
                ) : (
                  <ul className="tech-detail__list">
                    {selectedProjects.map((project) => (
                      <li key={project.id}>
                        <Link className="tech-detail__row" to={`/projects/${project.id}`}>
                          <span className="tech-detail__row-top">
                            <span className="tech-detail__row-name">{project.name}</span>
                            <span className="tech-detail__row-date">
                              {formatShortDate(project.dueDate)}
                            </span>
                          </span>
                          <ProgressBar value={project.progress} color={project.accent} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className="empty">Выберите технологию слева</p>
            )}
          </div>
        </aside>
      </div>

      {modalOpen && (
        <TechnologyModal
          onClose={() => setModalOpen(false)}
          onSubmit={async (draft) => {
            const error = await addTechnology(draft)
            if (error) return error
            setSelectedName(draft.name.trim())
            setModalOpen(false)
            return null
          }}
        />
      )}
    </div>
  )
}

interface TechnologyModalProps {
  onClose: () => void
  onSubmit: (draft: TechDraft) => Promise<string | null> | string | null
}

function TechnologyModal({ onClose, onSubmit }: TechnologyModalProps) {
  const [name, setName] = useState('')
  const [short, setShort] = useState('')
  const [category, setCategory] = useState<TechCategory>('framework')
  const [color, setColor] = useState(TECH_PALETTE[0])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      const message = await onSubmit({ name, short, category, color })
      if (message) setError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Новая технология">
      <button type="button" className="modal__backdrop" onClick={onClose} aria-label="Закрыть" />

      <div className="modal__card">
        <div className="modal__head">
          <h2 className="modal__title">Новая технология</h2>
          <button
            type="button"
            className="icon-button icon-button--sm"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        <form className="form" onSubmit={submit}>
          <label className="field">
            <span className="field__label">Название</span>
            <input
              className="field__input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Например, Django"
              autoFocus
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Категория</span>
              <select
                className="field__input"
                value={category}
                onChange={(event) => setCategory(event.target.value as TechCategory)}
              >
                {CATEGORY_ORDER.map((item) => (
                  <option key={item} value={item}>
                    {CATEGORY_LABEL[item]}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Метка</span>
              <input
                className="field__input"
                value={short}
                maxLength={3}
                onChange={(event) => setShort(event.target.value)}
                placeholder="Dj"
              />
            </label>
          </div>

          <div className="field">
            <span className="field__label">Цвет метки</span>
            <div className="swatches">
              {TECH_PALETTE.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={item === color ? 'swatch is-active' : 'swatch'}
                  style={{ background: item }}
                  onClick={() => setColor(item)}
                  aria-label={`Выбрать цвет ${item}`}
                />
              ))}
            </div>
          </div>

          {error && <p className="form__error">{error}</p>}

          <div className="modal__actions">
            <button type="button" className="button button--ghost" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="button button--primary" disabled={busy}>
              {busy ? 'Добавляем…' : 'Добавить технологию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
