import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createBooking } from '../api/bookings'
import { formatApiError } from '../api/client'
import { getListing, HOUSING_TYPE_LABELS, listBlockedDates } from '../api/listings'
import { listReviews } from '../api/reviews'
import Alert from '../components/Alert'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import StarRating from '../components/StarRating'
import { useAuth } from '../context/AuthContext'

function nightsBetween(start, end) {
  if (!start || !end) return 0
  const ms = new Date(end) - new Date(start)
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

function BookingForm({ listing, onBooked }) {
  const [form, setForm] = useState({ start_date: '', end_date: '', guests_count: 1 })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const nights = nightsBetween(form.start_date, form.end_date)
  const estimatedTotal = nights > 0 ? (nights * Number(listing.price)).toFixed(2) : null

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      const booking = await createBooking({
        listing: listing.id,
        start_date: form.start_date,
        end_date: form.end_date,
        guests_count: Number(form.guests_count),
      })
      setSuccess(`Booking request sent - ${booking.total_price} EUR for ${nights} night(s). The owner has 48 hours to confirm it.`)
      setForm({ start_date: '', end_date: '', guests_count: 1 })
      onBooked?.()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{success}</Alert>
      <div className="form-row">
        <div className="field">
          <label htmlFor="start_date">Check-in</label>
          <input id="start_date" type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="end_date">Check-out</label>
          <input id="end_date" type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="guests_count">Guests</label>
        <input
          id="guests_count"
          type="number"
          min="1"
          max={listing.max_guests}
          required
          value={form.guests_count}
          onChange={(e) => setForm({ ...form, guests_count: e.target.value })}
        />
        <span className="field-hint">This listing sleeps up to {listing.max_guests} guest(s).</span>
      </div>
      {estimatedTotal && (
        <div className="text-muted">
          {nights} night(s) &times; &euro;{listing.price} &asymp; <strong>&euro;{estimatedTotal}</strong> (final price is calculated by the server)
        </div>
      )}
      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? 'Sending request...' : 'Request to book'}
      </button>
    </form>
  )
}

export default function ListingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [listing, setListing] = useState(null)
  const [blockedDates, setBlockedDates] = useState([])
  const [reviews, setReviews] = useState(null)
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setReviewsPage(1)
    Promise.all([getListing(id), listBlockedDates(id).catch(() => ({ results: [] }))])
      .then(([listingData, blocked]) => {
        if (cancelled) return
        setListing(listingData)
        setBlockedDates(blocked.results || [])
      })
      .catch((err) => !cancelled && setError(formatApiError(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id])

  // Reviews are paginated by DRF (PAGE_SIZE = 10), so they load in their own effect and
  // page independently - flipping to page 2 of the reviews shouldn't reload the listing.
  useEffect(() => {
    let cancelled = false
    setReviewsLoading(true)
    listReviews(id, reviewsPage)
      .then((data) => !cancelled && setReviews(data))
      .catch(() => !cancelled && setReviews(null))
      .finally(() => !cancelled && setReviewsLoading(false))
    return () => {
      cancelled = true
    }
  }, [id, reviewsPage])

  if (loading) return <Spinner />
  if (error) return <Alert type="error">{error}</Alert>
  if (!listing) return null

  const isOwner = isAuthenticated && user?.name === listing.owner_name

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="mb-0">{listing.title}</h1>
          <p>
            {listing.city}
            {listing.district ? `, ${listing.district}` : ''} &middot; {HOUSING_TYPE_LABELS[listing.housing_type] || listing.housing_type}
          </p>
        </div>
        {isOwner && (
          <div>
            <Link className="btn btn-secondary" to={`/owner/listings/${listing.id}/edit`}>
              Manage this listing
            </Link>
          </div>
        )}
      </div>

      {!listing.is_active && <Alert type="info">This listing is currently not accepting new bookings.</Alert>}

      {listing.images.length > 0 ? (
        <div className="gallery">
          {listing.images.map((img) => (
            <img key={img.id} src={img.image} alt={listing.title} />
          ))}
        </div>
      ) : (
        <div className="gallery-empty">No photos yet</div>
      )}

      <div className="detail-grid">
        <div className="stack">
          <div className="card card-pad">
            <h3>About this place</h3>
            <p>{listing.description}</p>
            <div className="form-row">
              <div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                  Rooms
                </div>
                <strong>{listing.rooms_count}</strong>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                  Max guests
                </div>
                <strong>{listing.max_guests}</strong>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                  Hosted by
                </div>
                <strong>{listing.owner_name}</strong>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                  Rating
                </div>
                <StarRating value={listing.average_rating} count={listing.reviews_count} />
              </div>
            </div>
          </div>

          {blockedDates.length > 0 && (
            <div className="card card-pad">
              <h3>Unavailable dates</h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {blockedDates.map((b) => (
                  <li key={b.id}>
                    {b.start_date} &rarr; {b.end_date}
                    {b.reason ? ` (${b.reason})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card card-pad">
            <div className="section-title">
              <h3 className="mb-0">Reviews</h3>
              <StarRating value={listing.average_rating} count={listing.reviews_count} />
            </div>
            {reviewsLoading && !reviews ? (
              <p className="text-muted">Loading reviews...</p>
            ) : !reviews || reviews.results.length === 0 ? (
              <p className="text-muted">No reviews yet.</p>
            ) : (
              <>
                <div className="stack" style={{ opacity: reviewsLoading ? 0.6 : 1 }}>
                  {reviews.results.map((review) => (
                    <div key={review.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{review.author_name}</strong>
                        <StarRating value={review.rating} />
                      </div>
                      <p style={{ margin: '4px 0 0' }}>{review.text}</p>
                    </div>
                  ))}
                </div>
                <Pagination
                  page={reviewsPage}
                  total={reviews.count}
                  hasNext={Boolean(reviews.next)}
                  hasPrevious={Boolean(reviews.previous)}
                  onChange={setReviewsPage}
                />
              </>
            )}
          </div>
        </div>

        <div className="sticky-panel">
          <div className="card card-pad">
            <div className="price" style={{ marginBottom: 12 }}>
              &euro;{listing.price} <small>/ night</small>
            </div>
            {!listing.is_active ? (
              <Alert type="info">Not currently accepting bookings.</Alert>
            ) : isOwner ? (
              <Alert type="info">This is your own listing.</Alert>
            ) : isAuthenticated ? (
              <BookingForm listing={listing} />
            ) : (
              <>
                <p className="text-muted">Log in as a tenant to request a booking.</p>
                <button className="btn" type="button" onClick={() => navigate('/login', { state: { from: { pathname: `/listings/${listing.id}` } } })}>
                  Log in to book
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
