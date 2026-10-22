import { useMemo, useState } from 'react'
import Icon from './Icon'
import { Panel } from './ui'
import { activeProjects } from '../data/mockData'

type SortMode = 'progress' | 'name'

/** Область построения диаграммы в координатах viewBox (880 × 220). */
const PLOT = { left: 34, right: 868, top: 18, bottom: 168 }

function truncate(text: string, limit = 18): string {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
}

export default function ProgressPanel() {
  const [sort, setSort] = useState<SortMode>('progress')

  const projects = useMemo(
    () =>
      sort === 'progress'
        ? [...activeProjects].sort((a, b) => b.progress - a.progress)
        : [...activeProjects].sort((a, b) => a.name.localeCompare(b.name)),
    [sort],
  )

  const plotWidth = PLOT.right - PLOT.left
  const plotHeight = PLOT.bottom - PLOT.top
  const slot = plotWidth / Math.max(projects.length, 1)
  const barWidth = Math.min(52, slot * 0.38)

  const yFor = (value: number) => PLOT.bottom - (value / 100) * plotHeight

  return (
    <Panel
      title="Прогресс по проектам"
      subtitle="Автоматический расчёт: доля закрытых задач по каждому активному проекту"
      action={
        <label className="select">
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            aria-label="Сортировка диаграммы"
          >
            <option value="progress">По убыванию прогресса</option>
            <option value="name">По названию</option>
          </select>
          <Icon name="chevron-down" size={14} />
        </label>
      }
    >
      <svg
        className="bar-chart"
        viewBox="0 0 880 220"
        role="img"
        aria-label="Столбчатая диаграмма прогресса по активным проектам"
      >
        <title>Прогресс по активным проектам</title>

        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line
              x1={PLOT.left}
              x2={PLOT.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
              className="bar-chart__grid"
            />
            <text
              x={PLOT.left - 8}
              y={yFor(tick)}
              className="bar-chart__tick"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {tick}%
            </text>
          </g>
        ))}

        {projects.map((project, index) => {
          const center = PLOT.left + slot * index + slot / 2
          const top = yFor(project.progress)
          const labelY = PLOT.bottom + 14

          return (
            <g key={project.id}>
              <rect
                x={center - barWidth / 2}
                y={top}
                width={barWidth}
                height={PLOT.bottom - top}
                rx="4"
                fill={project.accent}
              />
              <text x={center} y={top - 8} className="bar-chart__value" textAnchor="middle">
                {project.progress}%
              </text>
              <text
                x={center}
                y={labelY}
                className="bar-chart__label"
                textAnchor="end"
                transform={`rotate(-35 ${center} ${labelY})`}
              >
                {truncate(project.name)}
              </text>
            </g>
          )
        })}
      </svg>
    </Panel>
  )
}
