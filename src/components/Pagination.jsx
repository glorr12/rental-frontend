export default function Pagination({ page, hasNext, hasPrevious, onChange, total }) {
  if (!hasNext && !hasPrevious && !total) return null
  return (
    <div className="pagination">
      <button type="button" className="btn btn-secondary btn-sm" disabled={!hasPrevious} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span>
        Page {page}
        {typeof total === 'number' ? ` - ${total} total` : ''}
      </span>
      <button type="button" className="btn btn-secondary btn-sm" disabled={!hasNext} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  )
}
