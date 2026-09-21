import { api } from './client'

export const BookingStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
}

export const BOOKING_STATUS_LABELS = {
  pending: 'Pending confirmation',
  confirmed: 'Confirmed',
  rejected: 'Rejected by owner',
  cancelled: 'Cancelled',
  completed: 'Completed',
  expired: 'Expired (owner did not respond in time)',
}

export function listBookings(page = 1) {
  return api.get('/bookings/', { params: { page } }).then((r) => r.data)
}

// BookingSerializer never returns `tenant` (also a write-only HiddenField, same as `owner` on
// listings) and `/api/bookings/` deliberately returns ONE combined list: bookings where you're
// the tenant OR bookings on listings you own (BookingViewSet.get_queryset). There's no field
// to tell which is which, so callers fetch everything once and split by listing ownership
// (see ownerListingIds in the booking pages) instead of trusting page-by-page server pagination.
export async function fetchAllBookings() {
  const all = []
  let page = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const data = await listBookings(page)
    all.push(...data.results)
    if (!data.next) break
    page += 1
  }
  return all
}

export function createBooking(payload) {
  return api.post('/bookings/', payload).then((r) => r.data)
}

export function updateBooking(id, payload) {
  return api.patch(`/bookings/${id}/`, payload).then((r) => r.data)
}

export function confirmBooking(id) {
  return api.post(`/bookings/${id}/confirm/`).then((r) => r.data)
}

export function rejectBooking(id) {
  return api.post(`/bookings/${id}/reject/`).then((r) => r.data)
}

export function cancelBooking(id) {
  return api.post(`/bookings/${id}/cancel/`).then((r) => r.data)
}

export function cancelBookingByOwner(id) {
  return api.post(`/bookings/${id}/cancel-by-owner/`).then((r) => r.data)
}
