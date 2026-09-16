import { useMemo, useState } from 'react'

function niceStep(span, intervals) {
  const raw = Math.max(span, 1) / Math.max(intervals, 1)
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)))
  const normalised = raw / magnitude
  const factor = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
  return Math.max(1, factor * magnitude)
}

function buildAxis(min, max, tickCount, { zeroBased = false } = {}) {
  const intervals = tickCount - 1
  const lo = zeroBased ? 0 : min
  const step = niceStep(max - lo, intervals)
  const start = zeroBased ? 0 : Math.floor(lo / step) * step

  let end = start + step * intervals
  let finalStep = step
  while (end < max) {
    finalStep += step
    end = start + finalStep * intervals
  }

  const ticks = Array.from({ length: tickCount }, (_, i) => Math.round(start + finalStep * i))
  return { min: start, max: end, ticks }
}

const TICKS = 5

export function HeadcountChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null)
  const [hidden, setHidden] = useState({})

  const geometry = useMemo(() => {
    if (!data || data.length === 0) return null

    const width = 1200
    const height = 300
    const leftPad = 46
    const rightPad = 54
    const topPad = 20
    const bottomPad = 34
    const plotWidth = width - leftPad - rightPad
    const plotHeight = height - topPad - bottomPad

    const hires = data.map((d) => d.hires)
    const headcount = data.map((d) => d.headcount)

    const hiresAxis = buildAxis(0, Math.max(...hires, 1), TICKS, { zeroBased: true })
    const headAxis = buildAxis(Math.min(...headcount), Math.max(...headcount), TICKS)

    const slot = plotWidth / data.length
    const barWidth = Math.min(38, slot * 0.45)

    const yOf = (value, axis) => topPad + plotHeight * (1 - (value - axis.min) / (axis.max - axis.min || 1))
    const xOf = (i) => leftPad + slot * i + slot / 2

    const points = data.map((d, i) => ({
      ...d,
      x: xOf(i),
      lineY: yOf(d.headcount, headAxis),
      barY: yOf(d.hires, hiresAxis),
      barX: xOf(i) - barWidth / 2,
    }))

    const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.lineY.toFixed(1)}`).join(' ')

    return {
      width, height, leftPad, rightPad, topPad, bottomPad, plotWidth, plotHeight,
      hiresAxis, headAxis, slot, barWidth, points, line,
    }
  }, [data])

  if (!geometry) return <div className="empty-state">No headcount data yet.</div>

  const { width, height, leftPad, rightPad, topPad, plotHeight, hiresAxis, headAxis, slot, barWidth, points, line } = geometry

  const latest = data[data.length - 1]
  const first = data[0]

  const hovered = hoverIndex != null ? points[hoverIndex] : null
  const toggle = (key) => setHidden((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="combo-chart">
      <div className="combo-chart-legend">
        {[
          { key: 'hires', label: 'New hires', swatch: 'bar' },
          { key: 'headcount', label: 'Total headcount', swatch: 'line' },
        ].map((series) => (
          <button
            key={series.key}
            type="button"
            className={`combo-legend-item${hidden[series.key] ? ' is-off' : ''}`}
            aria-pressed={!hidden[series.key]}
            onClick={() => toggle(series.key)}
          >
            <span className={`combo-legend-swatch combo-legend-swatch--${series.swatch}`} aria-hidden="true" />
            {series.label}
          </button>
        ))}
        <span className="combo-chart-hint">Click a series to hide it</span>
      </div>

      <div className="combo-chart-plot">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          role="img"
          aria-label={`Headcount and new hires from ${first.label} to ${latest.label}`}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="combo-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="combo-area-top" />
              <stop offset="100%" className="combo-area-bottom" />
            </linearGradient>
          </defs>

          {hiresAxis.ticks.map((tick, i) => {
            const y = topPad + plotHeight * (1 - i / (TICKS - 1))
            return (
              <g key={tick}>
                <line x1={leftPad} y1={y} x2={width - rightPad} y2={y} className="combo-gridline" />
                {!hidden.hires ? (
                  <text x={leftPad - 10} y={y + 4} textAnchor="end" className="combo-axis-label combo-axis-label--bar">
                    {tick}
                  </text>
                ) : null}
                {!hidden.headcount ? (
                  <text x={width - rightPad + 10} y={y + 4} className="combo-axis-label combo-axis-label--line">
                    {headAxis.ticks[i]}
                  </text>
                ) : null}
              </g>
            )
          })}

          {!hidden.hires
            ? points.map((point, i) => (
                <rect
                  key={`bar-${point.label}`}
                  x={point.barX}
                  y={point.barY}
                  width={barWidth}
                  height={Math.max(topPad + plotHeight - point.barY, point.hires > 0 ? 2 : 0)}
                  rx={4}
                  className={`combo-bar${hoverIndex === i ? ' is-hovered' : ''}`}
                />
              ))
            : null}

          {!hidden.headcount ? (
            <>
              <path d={`${line} L${points[points.length - 1].x.toFixed(1)},${topPad + plotHeight} L${points[0].x.toFixed(1)},${topPad + plotHeight} Z`} fill="url(#combo-area)" />
              <path d={line} className="combo-line" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((point, i) => (
                <circle
                  key={`dot-${point.label}`}
                  cx={point.x}
                  cy={point.lineY}
                  r={hoverIndex === i ? 5.5 : 3.5}
                  className="combo-dot"
                />
              ))}
            </>
          ) : null}

          {hovered ? (
            <line x1={hovered.x} y1={topPad} x2={hovered.x} y2={topPad + plotHeight} className="combo-crosshair" />
          ) : null}

          {points.map((point, i) => (
            <g key={`hit-${point.label}`}>
              <rect
                x={leftPad + slot * i}
                y={topPad}
                width={slot}
                height={plotHeight}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${point.label}: ${point.headcount} employees, ${point.hires} new`}
                onMouseEnter={() => setHoverIndex(i)}
                onFocus={() => setHoverIndex(i)}
                onBlur={() => setHoverIndex(null)}
              />
              <text x={point.x} y={height - 10} textAnchor="middle" className="combo-tick-label">
                {point.label}
              </text>
            </g>
          ))}
        </svg>

        {hovered ? (
          <div
            className="chart-tooltip combo-tooltip"
            style={{ left: `${(hovered.x / width) * 100}%`, top: `${(Math.min(hovered.lineY, hovered.barY) / height) * 100}%` }}
          >
            <span className="combo-tooltip-title">{hovered.label}</span>
            {!hidden.headcount ? (
              <span className="combo-tooltip-row">
                <i className="combo-legend-swatch combo-legend-swatch--line" />
                Headcount <strong>{hovered.headcount.toLocaleString()}</strong>
              </span>
            ) : null}
            {!hidden.hires ? (
              <span className="combo-tooltip-row">
                <i className="combo-legend-swatch combo-legend-swatch--bar" />
                New hires <strong>{hovered.hires.toLocaleString()}</strong>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
