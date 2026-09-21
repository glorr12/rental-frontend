import { api } from './client'

export function listReviews(listingId, page = 1) {
  return api.get('/reviews/', { params: { listing: listingId, page } }).then((r) => r.data)
}

export function createReview(payload) {
  return api.post('/reviews/', payload).then((r) => r.data)
}
