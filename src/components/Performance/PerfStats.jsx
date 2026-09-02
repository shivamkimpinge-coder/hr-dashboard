// Shared stat-card row for Performance pages — same visual language as the
// admin Dashboard overview, just scoped to whatever's currently filtered.
function PerfStats({ items }) {
  return (
    <section className="stats-grid perf-stats-row">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <article className="stat-card" key={item.label}>
            <span className={`stat-card-icon stat-card-icon--${item.tone || 'primary'}`}>
              <Icon />
            </span>
            <p>{item.label}</p>
            <h2>{item.value}</h2>
            {item.hint ? <span>{item.hint}</span> : null}
          </article>
        )
      })}
    </section>
  )
}

export default PerfStats
