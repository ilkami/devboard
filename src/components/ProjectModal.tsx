import { useState } from 'react'
import type { FormEvent } from 'react'
import Icon from './Icon'
import { ACCENTS, toDateInputValue } from '../data/projectsStore'
import type { ProjectDraft } from '../data/projectsStore'
import { useTechnologies } from '../data/techStore'
import type { Project, ProjectStatus } from '../types'

interface ProjectModalProps {
  initial?: Project
  onClose: () => void
  /** Возвращает текст ошибки или null, если сохранение прошло успешно. */
  onSubmit: (draft: ProjectDraft) => Promise<string | null> | string | null
}

export default function ProjectModal({ initial, onClose, onSubmit }: ProjectModalProps) {
  const { technologies } = useTechnologies()

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [due, setDue] = useState(
    initial
      ? toDateInputValue(initial.dueDate)
      : toDateInputValue(new Date(Date.now() + 14 * 86_400_000)),
  )
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? 'active')
  const [tech, setTech] = useState<string[]>(initial?.tech ?? [])
  const [accent, setAccent] = useState(initial?.accent ?? ACCENTS[0])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const toggleTech = (value: string) => {
    setTech((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      const message = await onSubmit({ name, description, due, tech, status, accent })
      if (message) setError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? 'Редактирование проекта' : 'Новый проект'}
    >
      <button type="button" className="modal__backdrop" onClick={onClose} aria-label="Закрыть" />

      <div className="modal__card">
        <div className="modal__head">
          <h2 className="modal__title">
            {initial ? 'Редактирование проекта' : 'Новый проект'}
          </h2>
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
              placeholder="Например, Task Tracker API"
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field__label">Описание</span>
            <textarea
              className="field__input field__textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Коротко о проекте"
              rows={3}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Дедлайн</span>
              <input
                type="date"
                className="field__input"
                value={due}
                onChange={(event) => setDue(event.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">Статус</span>
              <select
                className="field__input"
                value={status}
                onChange={(event) => setStatus(event.target.value as ProjectStatus)}
              >
                <option value="active">В работе</option>
                <option value="paused">Пауза</option>
                <option value="archived">Архив</option>
              </select>
            </label>
          </div>

          <div className="field">
            <span className="field__label">Стек технологий</span>
            <div className="tech-picker">
              {technologies.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className={tech.includes(item.name) ? 'tech-picker__item is-active' : 'tech-picker__item'}
                  onClick={() => toggleTech(item.name)}
                >
                  <span className="tech-picker__mark" style={{ background: item.color }} />
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label">Цвет проекта</span>
            <div className="swatches">
              {ACCENTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={item === accent ? 'swatch is-active' : 'swatch'}
                  style={{ background: item }}
                  onClick={() => setAccent(item)}
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
              {busy ? 'Сохраняем…' : initial ? 'Сохранить' : 'Создать проект'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
