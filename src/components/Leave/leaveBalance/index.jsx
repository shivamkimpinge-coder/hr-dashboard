import { Doughnut } from 'react-chartjs-2'
import { CHART_COLORS, registerCharts } from '../../../utils/chartTheme'
import { IconCalendar } from '../../Layout/Sidebar/icons'

registerCharts()

// The ring's solid arc is what is still available, the faint arc is what has
// been used (against the type's own unit — days, or Short Leave's count).
const buildRing = (used, total, tone) => ({
  labels: ['Available', 'Used'],
  datasets: [
    {
      data: total > 0 ? [Math.max(total - used, 0), used] : [1, 0],
      backgroundColor: [tone.arc, tone.track],
      borderWidth: 0,
      hoverOffset: 0,
    },
  ],
})

const ringOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: { display: false },
    datalabels: { display: false },
    tooltip: { enabled: false },
  },
}

// One label/value line in the breakdown under the ring. `emphasize` marks the
// LOP row so it reads as a warning rather than a plain fact.
function BreakdownRow({ label, value, emphasize }) {
  return (
    <div className={`leave-balance-breakdown-row${emphasize ? ' is-lop' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function LeaveBalanceCard({ leaveType, info, isActive, onSelect }) {
  const unlimited = Boolean(info.unlimited)
  const isCount = info.unit === 'count'
  const dayWord = (n) => `${n} day${n === 1 ? '' : 's'}`

  const total = unlimited ? 0 : isCount ? info.monthlyCredit : info.totalCredited
  const usedForRing = unlimited ? 0 : total - info.remaining
  const isOut = !unlimited && info.remaining <= 0
  const tone = unlimited ? 'blue' : isOut ? 'red' : 'green'
  const ringTone = unlimited
    ? { arc: CHART_COLORS.blue, track: CHART_COLORS.blueSoft }
    : isOut
      ? { arc: CHART_COLORS.redSoft, track: CHART_COLORS.red }
      : { arc: CHART_COLORS.green, track: CHART_COLORS.greenSoft }

  const select = () => onSelect?.(isActive ? '' : leaveType)

  return (
    <article
      className={`stat-card stat-card--clickable stat-card--${tone}${isActive ? ' is-active' : ''}`}
      onClick={select}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          select()
        }
      }}
    >
      <div className="stat-card-head">
        <span className="stat-card-icon">
          <IconCalendar />
        </span>
        <p>{leaveType}</p>
      </div>

      <div className="leave-balance-body">
        <div className="leave-balance-ring">
          <Doughnut data={buildRing(usedForRing, total, ringTone)} options={ringOptions} />
        </div>
        <div className="leave-balance-figure">
          <h2>{unlimited ? '∞' : info.remaining}</h2>
          <span className="stat-card-trend">Available{isCount ? '' : unlimited ? '' : ' days'}</span>
        </div>
      </div>

      {unlimited ? (
        <span className="stat-card-trend">No balance limit</span>
      ) : (
        <div className="leave-balance-breakdown">
          <BreakdownRow label="Used" value={isCount ? info.used : dayWord(info.used)} />
          <BreakdownRow label="Pending" value={isCount ? info.pending : dayWord(info.pending)} />
          {info.carryForward ? (
            <BreakdownRow label="Carry Forward" value={dayWord(info.carryForwardIn)} />
          ) : (
            <BreakdownRow label="Carry Forward" value="No" />
          )}
          <BreakdownRow
            label={isCount ? 'Monthly Limit' : 'Monthly Credit'}
            value={isCount ? info.monthlyCredit : dayWord(info.monthlyCredit)}
          />
          {info.lop > 0 ? <BreakdownRow label="LOP" value={dayWord(info.lop)} emphasize /> : null}
        </div>
      )}
    </article>
  )
}

const HIDDEN_LEAVE_TYPES = ['Annual Leave', 'Work From Home']

function LeaveBalance({ balance, activeType, onSelect }) {
  if (!balance) return null

  const entries = Object.entries(balance).filter(([leaveType]) => !HIDDEN_LEAVE_TYPES.includes(leaveType))
  if (!entries.length) return null

  return (
    <section className="stats-grid">
      {entries.map(([leaveType, info]) => (
        <LeaveBalanceCard
          key={leaveType}
          leaveType={leaveType}
          info={info}
          isActive={activeType === leaveType}
          onSelect={onSelect}
        />
      ))}
    </section>
  )
}

export default LeaveBalance
