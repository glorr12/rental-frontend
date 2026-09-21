import { BOOKING_STATUS_LABELS } from '../api/bookings'

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{BOOKING_STATUS_LABELS[status] || status}</span>
}
