import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="empty-state">
      <h2>Page not found</h2>
      <p>
        <Link to="/">Back to browsing listings</Link>
      </p>
    </div>
  )
}
