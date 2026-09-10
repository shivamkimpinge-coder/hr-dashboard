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

// Compact trend line for the mini metric cards — no axes or labels, just the
// shape of the series with a soft wash underneath. `id` must be unique per
// instance because the gradient is referenced by url().
export function Sparkline({ data, tone = 'positive', id }) {
  if (!data || data.length < 2) {
    return <div className="sparkline sparkline--empty" aria-hidden="true" />
  }

  const width = 132
  const height = 44
  const pad = 4
  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = max - min || 1
  const step = (width - pad * 2) / (data.length - 1)

  const points = data.map((value, i) => [pad + i * step, pad + (height - pad * 2) * (1 - (value - min) / span)])
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  const area = `${line} L${last[0].toFixed(1)},${height} L${points[0][0].toFixed(1)},${height} Z`

  return (
    <svg
      className={`sparkline sparkline--${tone}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Trend: ${data.join(', ')}`}
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="sparkline-stop-top" />
          <stop offset="100%" className="sparkline-stop-bottom" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${id})`} />
      <path d={line} fill="none" className="sparkline-line" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Stacked columns with a value axis, mirroring the reference's funnel chart.
// `buckets` is [{ label, values: { seriesKey: number } }] and `series` is
// [{ key, label }] in stacking order (bottom first).
export function StackedBarChart({ buckets, series }) {
  const [hoverIndex, setHoverIndex] = useState(null)

  if (!buckets || buckets.length === 0 || series.length === 0) {
    return <div className="empty-state">No hiring data yet.</div>
  }

  const width = 720
  const height = 260
  const leftPad = 30
  const bottomPad = 26
  const topPad = 10
  const plotHeight = height - bottomPad - topPad
  const plotWidth = width - leftPad
  const slot = plotWidth / buckets.length
  const barWidth = Math.min(34, slot * 0.52)

  const totals = buckets.map((b) => series.reduce((sum, s) => sum + (b.values[s.key] || 0), 0))
  const maxTotal = Math.max(1, ...totals)

  // Round the axis to a 1/2/5/10 step and extend the top to the next one, so
  // gridlines land on whole readable numbers (5, 10, 15) rather than whatever
  // dividing the max by four happens to produce (4, 7, 11, 14).
  const rawStep = maxTotal / 4
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalised = rawStep / magnitude
  const step = Math.max(1, (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10) * magnitude)
  const axisMax = Math.ceil(maxTotal / step) * step

  const ticks = []
  for (let value = step; value <= axisMax + 1e-9; value += step) ticks.push(Math.round(value))

  return (
    <div className="stacked-chart">
      <div className="chart-legend">
        {series.map((s, i) => (
          <span className="chart-legend-item" key={s.key}>
            <span className={`chart-legend-dot chart-legend-dot--${i % 5}`} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Hiring by department">
        {ticks.map((value) => {
          const y = topPad + plotHeight * (1 - value / axisMax)
          return (
            <g key={value}>
              <line x1={leftPad} y1={y} x2={width} y2={y} className="stacked-gridline" />
              <text x={leftPad - 8} y={y + 3.5} textAnchor="end" className="stacked-axis-label">
                {value}
              </text>
            </g>
          )
        })}

        <line x1={leftPad} y1={topPad + plotHeight} x2={width} y2={topPad + plotHeight} className="bar-chart-baseline" />
        <text x={leftPad - 8} y={topPad + plotHeight + 3.5} textAnchor="end" className="stacked-axis-label">
          0
        </text>

        {buckets.map((bucket, index) => {
          const x = leftPad + index * slot + (slot - barWidth) / 2
          const columnTotal = totals[index]
          const columnHeight = (columnTotal / axisMax) * plotHeight
          const columnTop = topPad + (plotHeight - columnHeight)
          let cursor = topPad + plotHeight

          return (
            <g
              key={bucket.label}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              className={hoverIndex === index ? 'is-hovered' : ''}
            >
              {/* Rounding the clip, not each rect, keeps the join between
                  segments square while the column reads as one rounded bar. */}
              <clipPath id={`stack-clip-${index}`}>
                <rect x={x} y={columnTop} width={barWidth} height={Math.max(columnHeight, 3)} rx={5} />
              </clipPath>

              <rect
                x={x}
                y={topPad}
                width={barWidth}
                height={plotHeight}
                className="stacked-hit"
                rx={5}
              />

              {series.map((s, seriesIndex) => {
                const value = bucket.values[s.key] || 0
                if (value <= 0) return null
                const segmentHeight = (value / axisMax) * plotHeight
                cursor -= segmentHeight
                return (
                  <rect
                    key={s.key}
                    x={x}
                    y={cursor}
                    width={barWidth}
                    height={segmentHeight}
                    clipPath={`url(#stack-clip-${index})`}
                    className={`stacked-segment stacked-segment--${seriesIndex % 5}`}
                  >
                    <title>{`${s.label} — ${bucket.label}: ${value}`}</title>
                  </rect>
                )
              })}

              <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" className="bar-chart-label">
                {bucket.label}
              </text>
            </g>
          )
        })}
      </svg>

    </div>
  )
}
