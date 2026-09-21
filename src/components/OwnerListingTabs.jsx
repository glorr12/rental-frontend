import { NavLink } from 'react-router-dom'

export default function OwnerListingTabs({ id }) {
  return (
    <div className="tabs">
      <NavLink to={`/owner/listings/${id}/edit`} className={({ isActive }) => (isActive ? 'active' : undefined)}>
        Details
      </NavLink>
      <NavLink to={`/owner/listings/${id}/photos`} className={({ isActive }) => (isActive ? 'active' : undefined)}>
        Photos
      </NavLink>
      <NavLink to={`/owner/listings/${id}/blocked-dates`} className={({ isActive }) => (isActive ? 'active' : undefined)}>
        Blocked dates
      </NavLink>
    </div>
  )
}
