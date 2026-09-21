import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookingStatus, cancelBookingByOwner, confirmBooking, fetchAllBookings, rejectBooking } from '../api/bookings'
import { formatApiError } from '../api/client'
import { fetchAllMyListings } from '../api/listings'
import Alert from '../components/Alert'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 10

export default function OwnerBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([fetchAllBookings(), fetchAllMyListings(user.name)])
      .then(([allBookings, myListings]) => {
        const ownedIds = new Set(myListings.map((l) => l.id))
        setBookings(allBookings.filter((b) => ownedIds.has(b.listing)))
      })
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runAction = async (booking, action) => {
    setActionError('')
    setBusyId(booking.id)
    try {
      await action(booking.id)
      load()
    } catch (err) {
      setActionError(formatApiError(err))
    } finally {
      setBusyId(null)
    }
  }

  const pageItems = useMemo(() => {
    if (!bookings) return []
    return bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  }, [bookings, page])

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Booking requests</h1>
          <p>Requests tenants have made for your listings. Unconfirmed requests expire automatically 48 hours after they're made.</p>
        </div>
      </div>

      <Alert type="error">{error || actionError}</Alert>

      {loading && <Spinner />}

      {!loading && bookings && bookings.length === 0 && <div className="empty-state">No booking requests yet.</div>}

      {!loading && bookings && bookings.length > 0 && (
        <>
          <div className="stack">
            {pageItems.map((booking) => {
              const busy = busyId === booking.id
              return (
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
                    {booking.status === BookingStatus.PENDING && (
                      <>
                        <button className="btn btn-sm" type="button" disabled={busy} onClick={() => runAction(booking, confirmBooking)}>
                          Confirm
                        </button>
                        <button className="btn btn-secondary btn-sm" type="button" disabled={busy} onClick={() => runAction(booking, rejectBooking)}>
                          Reject
                        </button>
                      </>
                    )}
                    {(booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED) && (
                      <button className="btn btn-danger btn-sm" type="button" disabled={busy} onClick={() => runAction(booking, cancelBookingByOwner)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <Pagination page={page} total={bookings.length} hasNext={page * PAGE_SIZE < bookings.length} hasPrevious={page > 1} onChange={setPage} />
        </>
      )}
    </>
  )
}
