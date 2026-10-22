import { useMemo, useState } from 'react'
import Icon from './Icon'
import { Panel, TechMark } from './ui'
import { technologyUsage } from '../data/mockData'
import { plural } from '../utils/plural'

type SortMode = 'count' | 'name'

export default function TechPanel() {
  const [sort, setSort] = useState<SortMode>('count')

  const usage = useMemo(() => {
    const list = technologyUsage()
    return sort === 'count'
      ? [...list].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      : [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [sort])

  return (
    <Panel
      title="Технологии и стек"
      action={
        <label className="select">
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            aria-label="Сортировка технологий"
          >
            <option value="count">По проектам</option>
            <option value="name">По алфавиту</option>
          </select>
          <Icon name="chevron-down" size={14} />
        </label>
      }
    >
      <div className="tech-grid">
        {usage.map((tech) => (
          <div key={tech.name} className="tech-tile">
            <TechMark name={tech.name} />
            <span className="tech-tile__name">{tech.name}</span>
            <span className="tech-tile__count">
              {tech.count} {plural(tech.count, 'проект', 'проекта', 'проектов')}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
