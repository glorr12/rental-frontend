import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatApiError } from '../api/client'
import { createListing, getListing, HOUSING_TYPE_LABELS, HousingType, updateListing } from '../api/listings'
import Alert from '../components/Alert'
import OwnerListingTabs from '../components/OwnerListingTabs'
import Spinner from '../components/Spinner'

const EMPTY_FORM = {
  title: '',
  description: '',
  city: '',
  district: '',
  price: '',
  rooms_count: 1,
  housing_type: HousingType.APARTMENT,
  max_guests: 1,
  is_active: true,
}

export default function OwnerListingFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    getListing(id)
      .then((listing) =>
        setForm({
          title: listing.title,
          description: listing.description,
          city: listing.city,
          district: listing.district,
          price: listing.price,
          rooms_count: listing.rooms_count,
          housing_type: listing.housing_type,
          max_guests: listing.max_guests,
          is_active: listing.is_active,
        }),
      )
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    const payload = {
      ...form,
      price: String(form.price),
      rooms_count: Number(form.rooms_count),
      max_guests: Number(form.max_guests),
    }
    try {
      if (isEdit) {
        await updateListing(id, payload)
        setSuccess('Listing updated.')
      } else {
        const created = await createListing(payload)
        navigate(`/owner/listings/${created.id}/edit`, { replace: true })
      }
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit listing' : 'New listing'}</h1>
        </div>
      </div>

      {isEdit && <OwnerListingTabs id={id} />}

      <div className="card card-pad" style={{ maxWidth: 640 }}>
        <Alert type="error">{error}</Alert>
        <Alert type="success">{success}</Alert>

        <form className="form-grid" onSubmit={submit}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" required value={form.title} onChange={update('title')} />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" required value={form.description} onChange={update('description')} />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="city">City</label>
              <input id="city" required value={form.city} onChange={update('city')} />
            </div>
            <div className="field">
              <label htmlFor="district">District</label>
              <input id="district" value={form.district} onChange={update('district')} />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="price">Price / night (EUR)</label>
              <input id="price" type="number" min="0.01" step="0.01" required value={form.price} onChange={update('price')} />
            </div>
            <div className="field">
              <label htmlFor="rooms_count">Rooms</label>
              <input id="rooms_count" type="number" min="1" required value={form.rooms_count} onChange={update('rooms_count')} />
            </div>
            <div className="field">
              <label htmlFor="max_guests">Max guests</label>
              <input id="max_guests" type="number" min="1" required value={form.max_guests} onChange={update('max_guests')} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="housing_type">Type</label>
            <select id="housing_type" value={form.housing_type} onChange={update('housing_type')}>
              {Object.entries(HOUSING_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field checkbox-field">
            <input id="is_active" type="checkbox" checked={form.is_active} onChange={update('is_active')} />
            <label htmlFor="is_active">Accepting bookings</label>
          </div>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create listing'}
          </button>
        </form>
      </div>
    </>
  )
}
