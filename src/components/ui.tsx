import type { ReactNode } from 'react'
import { technologyByName } from '../data/mockData'
import type { Priority } from '../types'

/* ------------------------------------------------------------------ */
/* Панель с заголовком                                                 */
/* ------------------------------------------------------------------ */

interface PanelProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  flush?: boolean
}

export function Panel({ title, subtitle, action, children, className, flush }: PanelProps) {
  return (
    <section className={className ? `panel ${className}` : 'panel'}>
      <header className="panel__head">
        <div className="panel__headings">
          <h2 className="panel__title">{title}</h2>
          {subtitle && <p className="panel__subtitle">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className={flush ? 'panel__body panel__body--flush' : 'panel__body'}>{children}</div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Полоса прогресса                                                    */
/* ------------------------------------------------------------------ */

interface ProgressBarProps {
  value: number
  color?: string
}

export function ProgressBar({ value, color = '#3B62F6' }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value))
  return (
    <div className="progress" role="progressbar" aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100}>
      <span className="progress__track">
        <span className="progress__fill" style={{ width: `${safeValue}%`, background: color }} />
      </span>
      <span className="progress__value">{safeValue}%</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Мини-график для KPI-карточек                                        */
/* ------------------------------------------------------------------ */

interface SparklineProps {
  values: number[]
  color: string
  variant?: 'bars' | 'line'
}

export function Sparkline({ values, color, variant = 'bars' }: SparklineProps) {
  const max = Math.max(...values, 1)

  if (variant === 'line') {
    const step = 62 / (values.length - 1)
    const points = values
      .map((value, index) => `${1 + index * step},${26 - (value / max) * 21}`)
      .join(' ')
    return (
      <svg className="sparkline" viewBox="0 0 64 28" aria-hidden="true">
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  const gap = 3
  const barWidth = (64 - gap * (values.length - 1)) / values.length
  return (
    <svg className="sparkline" viewBox="0 0 64 28" aria-hidden="true">
      {values.map((value, index) => {
        const height = Math.max(3, (value / max) * 24)
        return (
          <rect
            key={index}
            x={index * (barWidth + gap)}
            y={27 - height}
            width={barWidth}
            height={height}
            rx="1.4"
            fill={color}
            opacity={index === values.length - 1 ? 1 : 0.55}
          />
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Бейдж приоритета                                                    */
/* ------------------------------------------------------------------ */

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge badge--${priority}`}>{PRIORITY_LABELS[priority]}</span>
}

/* ------------------------------------------------------------------ */
/* Тег технологии                                                      */
/* ------------------------------------------------------------------ */

export function TechTag({ name }: { name: string }) {
  const tech = technologyByName(name)
  return (
    <span
      className="tech-tag"
      style={{ color: tech.color, background: `${tech.color}14`, borderColor: `${tech.color}33` }}
    >
      {name}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Круглая иконка технологии                                           */
/* ------------------------------------------------------------------ */

export function TechMark({ name, size = 34 }: { name: string; size?: number }) {
  const tech = technologyByName(name)
  return (
    <span
      className="tech-mark"
      style={{
        width: size,
        height: size,
        color: tech.color,
        background: `${tech.color}14`,
        borderColor: `${tech.color}33`,
        fontSize: size <= 30 ? 11 : 12,
      }}
    >
      {tech.short}
    </span>
  )
}
