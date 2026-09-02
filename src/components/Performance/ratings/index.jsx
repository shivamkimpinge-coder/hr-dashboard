import { useEffect, useState } from 'react'
import SectionTabs from '../../../utils/SectionTabs/sectionTabs'
import { IconTrendingUp } from '../../Layout/Sidebar/icons'
import { PERFORMANCE_TABS } from '../performanceTabs'
import PerfAvatar from '../PerfAvatar'
import StarRating from '../StarRating'
import { formatDateDisplay, getEmployeeRatings, ratingLabel } from '../performanceStore'

function rankBadgeClass(index) {
  if (index === 0) return 'rank-badge rank-badge--gold'
  if (index === 1) return 'rank-badge rank-badge--silver'
  if (index === 2) return 'rank-badge rank-badge--bronze'
  return 'rank-badge'
}

function Ratings({ currentUser }) {
  const isAdmin = currentUser?.role === 'Admin'
  const [ratings, setRatings] = useState([])

  useEffect(() => {
    setRatings(getEmployeeRatings())
  }, [])

  const myRating = !isAdmin ? ratings.find((entry) => entry.employeeEmail === currentUser?.email) : null

  return (
    <div className="panel detail-panel">
      <SectionTabs tabs={PERFORMANCE_TABS} />

      <div className="panel-heading">
        <div>
          <p className="eyebrow">Performance</p>
          <h3>{isAdmin ? 'Team Ratings' : 'My Rating'}</h3>
        </div>
      </div>

      {isAdmin ? (
        ratings.length === 0 ? (
          <div className="empty-state">
            <span className="perf-empty-icon">
              <IconTrendingUp />
            </span>
            <p>No ratings yet — ratings are calculated automatically from submitted performance reviews.</p>
          </div>
        ) : (
          <div className="perf-card-grid">
            {ratings.map((entry, index) => (
              <div className="perf-card" key={entry.employeeId}>
                <div className="rating-row">
                  <span className={rankBadgeClass(index)}>#{index + 1}</span>
                  <div className="rating-row-person">
                    <PerfAvatar name={entry.employeeName} />
                    <div>
                      <div className="perf-card-person-name">{entry.employeeName}</div>
                      <div className="perf-card-person-meta">
                        {entry.reviewCount} review{entry.reviewCount === 1 ? '' : 's'} · Last{' '}
                        {formatDateDisplay(entry.lastReviewAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="perf-card-meta-row">
                  <StarRating value={entry.averageRating} readOnly size={16} />
                  <span className="pill pill-muted">{ratingLabel(entry.averageRating)}</span>
                </div>

                <div className="perf-card-foot perf-card-foot--plain">
                  <span className="perf-rating-number perf-rating-number--sm">{entry.averageRating.toFixed(1)}</span>
                  <span className="text-muted">&nbsp;/ 5 average</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : myRating ? (
        <div className="perf-card perf-card--summary">
          <div className="perf-rating-summary">
            <PerfAvatar name={myRating.employeeName} size="lg" />
            <div>
              <div className="perf-card-title">{myRating.employeeName}</div>
              <div className="perf-rating-number">{myRating.averageRating.toFixed(1)}</div>
              <StarRating value={myRating.averageRating} readOnly />
            </div>
          </div>
          <span className="pill pill-muted">{ratingLabel(myRating.averageRating)}</span>
          <p className="perf-card-meta-row">
            Based on {myRating.reviewCount} review{myRating.reviewCount === 1 ? '' : 's'}, last updated{' '}
            {formatDateDisplay(myRating.lastReviewAt)}.
          </p>
        </div>
      ) : (
        <div className="empty-state">
          <span className="perf-empty-icon">
            <IconTrendingUp />
          </span>
          <p>You don't have any performance reviews yet — your rating will appear here once one is submitted.</p>
        </div>
      )}
    </div>
  )
}

export default Ratings
