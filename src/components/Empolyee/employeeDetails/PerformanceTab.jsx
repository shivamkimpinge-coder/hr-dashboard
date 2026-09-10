import { useCallback, useEffect, useMemo, useState } from 'react'
import { Doughnut, Line } from 'react-chartjs-2'
import useApi from '../../../hooks/useApi'
import { CHART_COLORS, baseChartOptions, registerCharts } from '../../../utils/chartTheme'
import { GOAL_STATUSES } from '../../Performance/performanceStore'

registerCharts()

function PerformanceTab({ employeeId }) {
  const { listReviews, listGoals } = useApi()

  const [reviews, setReviews] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [reviewData, goalData] = await Promise.all([listReviews({ employeeId }), listGoals({ employeeId })])
      setReviews(reviewData.reviews || [])
      setGoals(goalData.goals || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [listReviews, listGoals, employeeId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const sortedReviews = useMemo(
    () => [...reviews].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [reviews]
  )

  const ratingLineData = {
    labels: sortedReviews.map((r) => r.reviewPeriod),
    datasets: [
      {
        label: 'Overall Rating',
        data: sortedReviews.map((r) => r.rating),
        borderColor: CHART_COLORS.primary,
        backgroundColor: CHART_COLORS.primarySoft,
        pointBackgroundColor: CHART_COLORS.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 6,
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
      },
    ],
  }

  const ratingLineOptions = baseChartOptions({
    scales: {
      x: { grid: { display: false }, ticks: { color: CHART_COLORS.inkMuted, font: { size: 10.5 } } },
      y: {
        min: 0,
        max: 5,
        ticks: { stepSize: 1, color: CHART_COLORS.inkMuted, font: { size: 10.5 } },
        grid: { color: CHART_COLORS.line },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: CHART_COLORS.ink,
        cornerRadius: 8,
        padding: 8,
        displayColors: false,
        callbacks: { label: (context) => `${context.parsed.y} / 5` },
      },
      datalabels: {
        display: true,
        align: 'top',
        anchor: 'end',
        color: CHART_COLORS.primary,
        font: { weight: '700', size: 11 },
        formatter: (value) => value.toFixed(1),
      },
    },
  })

  const goalCounts = useMemo(
    () => GOAL_STATUSES.map((status) => goals.filter((g) => g.status === status).length),
    [goals]
  )

  const goalDoughnutData = {
    labels: GOAL_STATUSES,
    datasets: [
      {
        data: goalCounts,
        backgroundColor: [CHART_COLORS.inkMuted, CHART_COLORS.amber, CHART_COLORS.green],
        borderWidth: 0,
      },
    ],
  }

  const goalDoughnutOptions = baseChartOptions({
    // Doughnut charts don't use cartesian axes — without this, the base
    // x/y scale config still gets instantiated and draws a stray grid.
    scales: { x: { display: false }, y: { display: false } },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { color: CHART_COLORS.inkMuted, font: { size: 10.5 }, boxWidth: 10, boxHeight: 10 },
      },
      tooltip: { backgroundColor: CHART_COLORS.ink, cornerRadius: 8, padding: 8, displayColors: false },
    },
  })

  return (
    <div className="panel mt-3">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Performance</p>
          <h3>Performance</h3>
        </div>
      </div>

      {error ? <div className="feedback-banner feedback-banner-error">{error}</div> : null}

      <div className="panel mt-3">
        <p className="eyebrow">Trend</p>
        <h4>Performance Rating Trend</h4>
        <div className="chart-container">
          {loading ? (
            <p className="form-hint">Loading performance data...</p>
          ) : sortedReviews.length === 0 ? (
            <div className="empty-state">
              <p>No performance reviews found for this employee.</p>
            </div>
          ) : (
            <Line data={ratingLineData} options={ratingLineOptions} />
          )}
        </div>
      </div>

      <div className="panel mt-3">
        <p className="eyebrow">Goals</p>
        <h4>Goals by Status</h4>
        <div className="chart-container">
          {loading ? (
            <p className="form-hint">Loading goals...</p>
          ) : goals.length === 0 ? (
            <div className="empty-state">
              <p>No goals found for this employee.</p>
            </div>
          ) : (
            <Doughnut data={goalDoughnutData} options={goalDoughnutOptions} />
          )}
        </div>
      </div>
    </div>
  )
}

export default PerformanceTab
