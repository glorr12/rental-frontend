import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatApiError } from '../api/client'
import { deleteListingImage, getListing, uploadListingImage } from '../api/listings'
import Alert from '../components/Alert'
import OwnerListingTabs from '../components/OwnerListingTabs'
import Spinner from '../components/Spinner'

export default function OwnerListingPhotosPage() {
  const { id } = useParams()
  const fileInput = useRef(null)

  const [listing, setListing] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const load = () => {
    setLoading(true)
    getListing(id)
      .then(setListing)
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const nextOrder = listing.images.length
      await uploadListingImage(id, file, nextOrder)
      load()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const handleDelete = async (imageId) => {
    setError('')
    try {
      await deleteListingImage(imageId)
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
          <h1>Photos</h1>
          <p>{listing?.title}</p>
        </div>
      </div>

      <OwnerListingTabs id={id} />

      <Alert type="error">{error}</Alert>

      <div className="card card-pad">
        <input ref={fileInput} type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
        {uploading && <p className="text-muted">Uploading...</p>}

        {listing.images.length === 0 ? (
          <p className="text-muted" style={{ marginTop: 16 }}>
            No photos yet.
          </p>
        ) : (
          <div className="gallery" style={{ marginTop: 16 }}>
            {listing.images.map((img) => (
              <div key={img.id} style={{ position: 'relative' }}>
                <img src={img.image} alt={listing.title} />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ position: 'absolute', top: 6, right: 6 }}
                  onClick={() => handleDelete(img.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
