import { api } from './client'

export const AccountRole = {
  TENANT: 'tenant',
  LANDLORD: 'landlord',
}

export function register({ email, password, name, role }) {
  return api.post('/auth/register/', { email, password, name, role }).then((r) => r.data)
}

export function obtainToken({ email, password }) {
  return api.post('/auth/token/', { email, password }).then((r) => r.data)
}

export function fetchMe() {
  return api.get('/auth/me/').then((r) => r.data)
}

export function becomeLandlord() {
  return api.post('/auth/become-landlord/').then((r) => r.data)
}
