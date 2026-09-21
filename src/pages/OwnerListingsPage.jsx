import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatApiError } from '../api/client'
import { deleteListing, fetchAllMyListings, HOUSING_TYPE_LABELS, updateListing } from '../api/listings'
import Alert from '../components/Alert'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'

export default function OwnerListingsPage() {
  const { user } = useAuth()
  const [listings, setListings] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    setError('')
    fetchAllMyListings(user.name)
      .then(setListings)
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (listing) => {
    if (!window.confirm(`Delete "${listing.title}"? This cannot be undone.`)) return
    setError('')
    try {
      await deleteListing(listing.id)
      load()
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  // Deactivating hides the listing from everyone else's search results (ListingViewSet only
  // shows inactive listings to their own owner) and blocks new booking requests, without
  // deleting it or touching the bookings already made.
  const handleToggleActive = async (listing) => {
    setError('')
    setBusyId(listing.id)
    try {
      const updated = await updateListing(listing.id, { is_active: !listing.is_active })
      setListings((current) => current.map((l) => (l.id === listing.id ? { ...l, is_active: updated.is_active } : l)))
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My listings</h1>
          <p>Properties you've listed.</p>
        </div>
        <Link className="btn" to="/owner/listings/new">
          + Add listing
        </Link>
      </div>

      <Alert type="error">{error}</Alert>

      {loading && <Spinner />}

      {!loading && listings && listings.length === 0 && <div className="empty-state">You haven't listed a property yet.</div>}

      {!loading && listings && listings.length > 0 && (
        <div className="stack">
          {listings.map((listing) => {
            const busy = busyId === listing.id
            return (
              <div key={listing.id} className="card list-item">
                <div className="info">
                  <Link to={`/listings/${listing.id}`}>
                    <strong>{listing.title}</strong>
                  </Link>
                  <span className="text-muted">
                    {listing.city}
                    {listing.district ? `, ${listing.district}` : ''} &middot; {HOUSING_TYPE_LABELS[listing.housing_type]} &middot; &euro;
                    {listing.price}/night
                  </span>
                  <span>
                    <span className={`badge ${listing.is_active ? 'badge-confirmed' : 'badge-cancelled'}`}>
                      {listing.is_active ? 'Accepting bookings' : 'Not accepting bookings'}
                    </span>
                  </span>
                </div>
                <div className="actions">
                  <button
                    className={`btn btn-sm ${listing.is_active ? 'btn-outline' : ''}`}
                    type="button"
                    disabled={busy}
                    onClick={() => handleToggleActive(listing)}
                  >
                    {busy ? 'Saving...' : listing.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link className="btn btn-secondary btn-sm" to={`/owner/listings/${listing.id}/edit`}>
                    Edit
                  </Link>
                  <Link className="btn btn-secondary btn-sm" to={`/owner/listings/${listing.id}/photos`}>
                    Photos
                  </Link>
                  <Link className="btn btn-secondary btn-sm" to={`/owner/listings/${listing.id}/blocked-dates`}>
                    Blocked dates
                  </Link>
                  <button className="btn btn-danger btn-sm" type="button" disabled={busy} onClick={() => handleDelete(listing)}>
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
