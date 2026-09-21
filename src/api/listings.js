import { api } from './client'

export const HousingType = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  STUDIO: 'studio',
}

export const HOUSING_TYPE_LABELS = {
  apartment: 'Apartment',
  house: 'House',
  studio: 'Studio',
}

// `params` mirrors apps/listings/filters.py: city, district, housing_type, rooms_count,
// rooms_count_min, rooms_count_max, price_min, price_max, check_in, check_out, plus DRF's
// own `search` and `ordering` query params. Empty/undefined values are dropped so they don't
// end up as literal "undefined" strings in the querystring.
export function listListings(params = {}, page = 1) {
  const cleaned = Object.fromEntries(
    Object.entries({ ...params, page }).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  )
  return api.get('/listings/', { params: cleaned }).then((r) => r.data)
}

export function getListing(id) {
  return api.get(`/listings/${id}/`).then((r) => r.data)
}

export function createListing(payload) {
  return api.post('/listings/', payload).then((r) => r.data)
}

export function updateListing(id, payload) {
  return api.patch(`/listings/${id}/`, payload).then((r) => r.data)
}

export function deleteListing(id) {
  return api.delete(`/listings/${id}/`)
}

// ListingSerializer never returns an `owner` id (it's a write-only HiddenField, only
// `owner_name` is readable) and the API has no `?owner=me` filter - so there's no exact way
// to ask the backend for "my listings" without changing it. ListingViewSet's own visibility
// rule already includes the current user's listings (active or not) in `/api/listings/`, so
// this pages through everything visible to the authenticated owner and matches by name - the
// best available signal. Good enough at course-project scale; if two landlords ever share an
// exact display name, the real fix is adding an `owner` id (or `?owner=me`) to the backend.
export async function fetchAllMyListings(ownerName) {
  const mine = []
  let page = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const data = await listListings({}, page)
    mine.push(...data.results.filter((listing) => listing.owner_name === ownerName))
    if (!data.next) break
    page += 1
  }
  return mine
}

export function uploadListingImage(listingId, file, order = 0) {
  const formData = new FormData()
  formData.append('listing', listingId)
  formData.append('image', file)
  formData.append('order', order)
  return api.post('/listings/images/', formData).then((r) => r.data)
}

export function deleteListingImage(imageId) {
  return api.delete(`/listings/images/${imageId}/`)
}

export function listBlockedDates(listingId) {
  return api.get('/listings/blocked-dates/', { params: { listing: listingId } }).then((r) => r.data)
}

export function createBlockedDate(payload) {
  return api.post('/listings/blocked-dates/', payload).then((r) => r.data)
}

export function deleteBlockedDate(id) {
  return api.delete(`/listings/blocked-dates/${id}/`)
}
