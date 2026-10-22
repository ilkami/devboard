import Icon from '../components/Icon'
import { Panel } from '../components/ui'

interface PlaceholderProps {
  title: string
  modules: string
  notes: string[]
}

export default function Placeholder({ title, modules, notes }: PlaceholderProps) {
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{modules}</p>
        </div>
      </header>

      <Panel title="Возможности раздела">
        <ul className="checklist">
          {notes.map((note) => (
            <li key={note} className="checklist__item">
              <span className="checklist__icon">
                <Icon name="target" size={15} />
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
