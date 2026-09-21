import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookingStatus, cancelBooking, fetchAllBookings } from '../api/bookings'
import { formatApiError } from '../api/client'
import { fetchAllMyListings } from '../api/listings'
import { createReview } from '../api/reviews'
import Alert from '../components/Alert'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 10

// "Active" = still on the calendar (awaiting the owner's answer, or confirmed and upcoming).
// "Completed" = the stay happened, which is also the only state the API accepts a review for.
// Everything that fell through (owner said no, tenant cancelled, request expired unanswered)
// is grouped separately so it doesn't clutter the two lists the assignment asks for.
const TABS = [
  { key: 'active', label: 'Active', statuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
  { key: 'completed', label: 'Completed', statuses: [BookingStatus.COMPLETED] },
  {
    key: 'closed',
    label: 'Cancelled & rejected',
    statuses: [BookingStatus.CANCELLED, BookingStatus.REJECTED, BookingStatus.EXPIRED],
  },
  { key: 'all', label: 'All', statuses: null },
]

function ReviewForm({ booking, onDone }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ rating: 5, text: '' })
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (submitted) return <span className="text-muted">Thanks for your review!</span>
  if (!open) {
    return (
      <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>
        Leave a review
      </button>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createReview({ booking: booking.id, rating: Number(form.rating), text: form.text })
      setSubmitted(true)
      onDone?.()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="form-grid" style={{ minWidth: 260 }}>
      <Alert type="error">{error}</Alert>
      <div className="form-row">
        <div className="field">
          <label htmlFor={`rating-${booking.id}`}>Rating</label>
          <select id={`rating-${booking.id}`} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? '' : 's'}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor={`text-${booking.id}`}>Review</label>
        <textarea id={`text-${booking.id}`} required value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-sm" type="submit" disabled={submitting}>
          {submitting ? 'Sending...' : 'Submit review'}
        </button>
        <button className="btn btn-secondary btn-sm" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function MyBookingsPage() {
  const { user, isLandlord } = useAuth()
  const [bookings, setBookings] = useState(null)
  const [tab, setTab] = useState('active')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    // /api/bookings/ mixes "bookings I made" with "bookings on listings I own" - exclude the
    // latter (see fetchAllBookings) so this page only shows what I booked as a tenant.
    Promise.all([fetchAllBookings(), isLandlord ? fetchAllMyListings(user.name) : Promise.resolve([])])
      .then(([allBookings, myListings]) => {
        const ownedIds = new Set(myListings.map((l) => l.id))
        setBookings(allBookings.filter((b) => !ownedIds.has(b.listing)))
      })
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCancel = async (booking) => {
    setActionError('')
    try {
      await cancelBooking(booking.id)
      load()
    } catch (err) {
      setActionError(formatApiError(err))
    }
  }

  const counts = useMemo(() => {
    const result = {}
    for (const t of TABS) {
      result[t.key] = !bookings ? 0 : t.statuses ? bookings.filter((b) => t.statuses.includes(b.status)).length : bookings.length
    }
    return result
  }, [bookings])

  const filtered = useMemo(() => {
    if (!bookings) return []
    const active = TABS.find((t) => t.key === tab)
    if (!active?.statuses) return bookings
    return bookings.filter((b) => active.statuses.includes(b.status))
  }, [bookings, tab])

  const pageItems = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  const selectTab = (key) => {
    setTab(key)
    setPage(1)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My bookings</h1>
          <p>Requests you have made as a tenant.</p>
        </div>
      </div>

      <Alert type="error">{error || actionError}</Alert>

      {loading && <Spinner />}

      {!loading && bookings && bookings.length === 0 && (
        <div className="empty-state">
          You haven't booked anything yet. <Link to="/">Browse listings</Link>.
        </div>
      )}

      {!loading && bookings && bookings.length > 0 && (
        <>
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t.key} type="button" className={t.key === tab ? 'active' : undefined} onClick={() => selectTab(t.key)}>
                {t.label} <span className="count">({counts[t.key]})</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">Nothing in this group.</div>
          ) : (
            <>
              <div className="stack">
                {pageItems.map((booking) => (
                  <div key={booking.id} className="card list-item">
                    <div className="info">
                      <Link to={`/listings/${booking.listing}`}>
                        <strong>{booking.listing_title}</strong>
                      </Link>
                      <span className="text-muted">
                        {booking.start_date} &rarr; {booking.end_date} &middot; {booking.guests_count} guest(s)
                      </span>
                      <span>
                        <strong>&euro;{booking.total_price}</strong> total
                      </span>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="actions">
                      {(booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED) && (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleCancel(booking)}>
                          Cancel
                        </button>
                      )}
                      {booking.status === BookingStatus.COMPLETED && <ReviewForm booking={booking} />}
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                page={page}
                total={filtered.length}
                hasNext={page * PAGE_SIZE < filtered.length}
                hasPrevious={page > 1}
                onChange={setPage}
              />
            </>
          )}
        </>
      )}
    </>
  )
}
