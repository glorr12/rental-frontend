export default function StarRating({ value, count }) {
  if (value === null || value === undefined) {
    return <span className="text-muted">No reviews yet</span>
  }
  const rounded = Math.round(value)
  const stars = '★★★★★'.slice(0, rounded) + '☆☆☆☆☆'.slice(0, 5 - rounded)
  return (
    <span>
      <span className="stars">{stars}</span> {value.toFixed(1)}
      {typeof count === 'number' && <span className="text-muted"> ({count})</span>}
    </span>
  )
}
