const PERF_TONE_ALIAS = { primary: 'purple' }

function PerfStats({ items }) {
  return (
    <section className="stats-grid perf-stats-row">
      {items.map((item) => {
        const Icon = item.icon
        const tone = PERF_TONE_ALIAS[item.tone] || item.tone || 'purple'
        return (
          <article className={`stat-card stat-card--${tone}`} key={item.label}>
            <div className="stat-card-head">
              <span className="stat-card-icon">
                <Icon />
              </span>
              <p>{item.label}</p>
            </div>
            <h2>{item.value}</h2>
            {item.hint ? <span className="stat-card-trend">{item.hint}</span> : null}
          </article>
        )
      })}
    </section>
  )
}

export default PerfStats
