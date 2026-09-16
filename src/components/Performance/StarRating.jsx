function StarRating({ value = 0, onChange, readOnly = false, size = 18 }) {
  const stars = [1, 2, 3, 4, 5]
  const rounded = Math.round(value)

  return (
    <span className={`star-rating${readOnly ? ' star-rating-readonly' : ''}`} role={readOnly ? undefined : 'radiogroup'}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className={`star${star <= rounded ? ' star-filled' : ''}`}
          style={{ fontSize: size }}
          disabled={readOnly}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          onClick={readOnly ? undefined : () => onChange?.(star)}
        >
          ★
        </button>
      ))}
    </span>
  )
}

export default StarRating
