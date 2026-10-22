import Icon from './Icon'
import { Sparkline } from './ui'
import type { IconName } from '../types'

interface KpiCardProps {
  label: string
  value: string
  icon: IconName
  accent: string
  delta?: string
  hint?: string
  warning?: boolean
  spark?: { values: number[]; variant: 'bars' | 'line' }
}

export default function KpiCard({
  label,
  value,
  icon,
  accent,
  delta,
  hint,
  warning,
  spark,
}: KpiCardProps) {
  return (
    <article className={warning ? 'kpi kpi--warning' : 'kpi'}>
      <div className="kpi__head">
        <span className="kpi__icon" style={{ color: accent, background: `${accent}14` }}>
          <Icon name={icon} size={18} />
        </span>
        <span className="kpi__label">{label}</span>
      </div>

      <div className="kpi__body">
        <strong className="kpi__value">{value}</strong>
        {delta && <span className="kpi__delta">{delta}</span>}
      </div>

      {hint && <p className="kpi__hint">{hint}</p>}

      {spark && (
        <div className="kpi__spark">
          <Sparkline values={spark.values} color={accent} variant={spark.variant} />
        </div>
      )}
    </article>
  )
}
