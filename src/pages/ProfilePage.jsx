import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatApiError } from '../api/client'
import Alert from '../components/Alert'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user, becomeLandlord } = useAuth()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!user) return null

  const handleBecomeLandlord = async () => {
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      await becomeLandlord()
      setSuccess('You can now list properties.')
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card card-pad" style={{ maxWidth: 520 }}>
      <h1>My profile</h1>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{success}</Alert>

      <div className="stack">
        <div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
            Name
          </div>
          <strong>{user.name}</strong>
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
            Email
          </div>
          <strong>{user.email}</strong>
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
            Role
          </div>
          <strong style={{ textTransform: 'capitalize' }}>{user.role}</strong>
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
            Member since
          </div>
          <strong>{new Date(user.created_at).toLocaleDateString()}</strong>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {!user.is_landlord ? (
          <button className="btn" type="button" onClick={handleBecomeLandlord} disabled={submitting}>
            {submitting ? 'Please wait...' : 'Start listing properties'}
          </button>
        ) : (
          <Link className="btn btn-secondary" to="/owner/listings">
            Go to my listings
          </Link>
        )}
      </div>
    </div>
  )
}
