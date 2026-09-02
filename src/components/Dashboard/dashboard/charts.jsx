import { useState } from 'react'

// Full-circle progress gauge (SVG stroke-dasharray ring) — mirrors the
// reference dashboard's "Monthly Target" card, driven by a real percent.
export function RadialGauge({ percent, caption }) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0))
  const size = 176
  const stroke = 14
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className="gauge-wrap">
      <div className="gauge-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(clamped)} percent`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--p-100)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--p)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 420ms var(--ease)' }}
          />
        </svg>
        <span className="gauge-value">{Math.round(clamped)}%</span>
      </div>
      {caption ? <p className="gauge-caption">{caption}</p> : null}
    </div>
  )
}

// Thin single-hue bar chart. `data` is [{ label, value }]; range bucketing
// (monthly/quarterly/annually) happens in the caller — this just renders
// whatever buckets it's given.
export function TrendBarChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null)

  if (!data || data.length === 0) {
    return <div className="empty-state">No hiring data yet.</div>
  }

  const width = 640
  const height = 200
  const bottomPad = 24
  const topPad = 10
  const plotHeight = height - bottomPad - topPad
  const slot = width / data.length
  const barWidth = Math.min(24, slot * 0.5)
  const maxValue = Math.max(1, ...data.map((d) => d.value))

  const bars = data.map((d, i) => {
    const barHeight = (d.value / maxValue) * plotHeight
    const x = i * slot + (slot - barWidth) / 2
    const y = topPad + (plotHeight - barHeight)
    return { ...d, x, y, barHeight, cx: x + barWidth / 2 }
  })

  const hovered = hoverIndex != null ? bars[hoverIndex] : null

  return (
    <div className="bar-chart">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="200" role="img" aria-label="Hiring trend">
        <line x1={0} y1={topPad + plotHeight} x2={width} y2={topPad + plotHeight} className="bar-chart-baseline" />
        {bars.map((bar, i) => (
          <g key={bar.label}>
            <rect
              x={bar.x}
              y={bar.y}
              width={barWidth}
              height={Math.max(bar.barHeight, 2)}
              rx={4}
              tabIndex={0}
              className={`bar-chart-bar${hoverIndex === i ? ' is-hovered' : ''}`}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
            >
              <title>{`${bar.label}: ${bar.value}`}</title>
            </rect>
            <text x={bar.cx} y={height - 6} textAnchor="middle" className="bar-chart-label">
              {bar.label}
            </text>
          </g>
        ))}
      </svg>

      {hovered ? (
        <div
          className="bar-chart-tooltip"
          style={{ left: `${(hovered.cx / width) * 100}%`, top: `${(hovered.y / height) * 100}%` }}
        >
          <strong>{hovered.value}</strong> {hovered.value === 1 ? 'hire' : 'hires'} · {hovered.label}
        </div>
      ) : null}
    </div>
  )
}

// Horizontal ranked bars (plain HTML/CSS) for a short category list, e.g.
// headcount by department.
export function RankedBarList({ data }) {
  if (!data || data.length === 0) {
    return <div className="empty-state">No department data yet.</div>
  }

  const maxValue = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="ranked-bar-list">
      {data.map((d) => (
        <div className="ranked-bar-row" key={d.label}>
          <span className="ranked-bar-label" title={d.label}>
            {d.label}
          </span>
          <span className="ranked-bar-track">
            <span className="ranked-bar-fill" style={{ width: `${(d.value / maxValue) * 100}%` }} />
          </span>
          <span className="ranked-bar-value">{d.value}</span>
        </div>
      ))}
    </div>
  )
}
