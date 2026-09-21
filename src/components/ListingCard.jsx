import { Link } from 'react-router-dom'
import { HOUSING_TYPE_LABELS } from '../api/listings'
import StarRating from './StarRating'

export default function ListingCard({ listing }) {
  const thumb = listing.images?.[0]?.image
  // Only /api/statistics/popular-listings/ returns views_count, so on the plain listing grid
  // this is undefined and the line is skipped.
  const views = listing.views_count

  return (
    <Link
      to={`/listings/${listing.id}`}
      className={`card listing-card${listing.is_active ? '' : ' inactive'}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {!listing.is_active && <div style={{ padding: '4px 12px' }}><span className="badge badge-rejected">Not accepting bookings</span></div>}
      <div className="thumb">
        {thumb ? <img src={thumb} alt={listing.title} /> : <span>No photo yet</span>}
      </div>
      <div className="body">
        <div className="title">{listing.title}</div>
        <div className="meta">
          {listing.city}
          {listing.district ? `, ${listing.district}` : ''} · {HOUSING_TYPE_LABELS[listing.housing_type] || listing.housing_type}
        </div>
        <div className="meta">
          {listing.rooms_count} room{listing.rooms_count === 1 ? '' : 's'} · up to {listing.max_guests} guest
          {listing.max_guests === 1 ? '' : 's'}
        </div>
        <StarRating value={listing.average_rating} count={listing.reviews_count} />
        {typeof views === 'number' && (
          <div className="meta">
            {views} view{views === 1 ? '' : 's'}
          </div>
        )}
        <div className="price">
          &euro;{listing.price} <small>/ night</small>
        </div>
      </div>
    </Link>
  )
}
