import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatApiError } from '../api/client'
import { createBlockedDate, deleteBlockedDate, getListing, listBlockedDates } from '../api/listings'
import Alert from '../components/Alert'
import OwnerListingTabs from '../components/OwnerListingTabs'
import Spinner from '../components/Spinner'

export default function OwnerListingBlockedDatesPage() {
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [blocked, setBlocked] = useState([])
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getListing(id), listBlockedDates(id)])
      .then(([listingData, blockedData]) => {
        setListing(listingData)
        setBlocked(blockedData.results)
      })
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createBlockedDate({ listing: id, ...form })
      setForm({ start_date: '', end_date: '', reason: '' })
      load()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (blockedId) => {
    setError('')
    try {
      await deleteBlockedDate(blockedId)
      load()
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  if (loading) return <Spinner />

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Blocked dates</h1>
          <p>{listing?.title} - dates you take off the market yourself (maintenance, personal use, etc.) without a fake booking.</p>
        </div>
      </div>

      <OwnerListingTabs id={id} />

      <Alert type="error">{error}</Alert>

      <div className="detail-grid">
        <div className="card card-pad">
          <h3>Currently blocked</h3>
          {blocked.length === 0 ? (
            <p className="text-muted">No blocked date ranges.</p>
          ) : (
            <div className="stack">
              {blocked.map((b) => (
                <div key={b.id} className="list-item" style={{ padding: 0 }}>
                  <div className="info">
                    <strong>
                      {b.start_date} &rarr; {b.end_date}
                    </strong>
                    {b.reason && <span className="text-muted">{b.reason}</span>}
                  </div>
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => handleDelete(b.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h3>Block new dates</h3>
          <form className="form-grid" onSubmit={submit}>
            <div className="field">
              <label htmlFor="start_date">From</label>
              <input id="start_date" type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="end_date">To</label>
              <input id="end_date" type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="reason">Reason (optional)</label>
              <input id="reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Block these dates'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
