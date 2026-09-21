import { api } from './client'

export function popularListings() {
  return api.get('/statistics/popular-listings/').then((r) => r.data)
}

export function popularSearches() {
  return api.get('/statistics/popular-searches/').then((r) => r.data)
}
