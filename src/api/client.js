import axios from 'axios'

// Vite proxies /api to the Django backend (see vite.config.js), so we always call relative
// paths here and never need to know the backend's real host/port from the browser's side.
const ACCESS_KEY = 'rental.access'
const REFRESH_KEY = 'rental.refresh'

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setTokens: (access, refresh) => {
    localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  setAccess: (access) => localStorage.setItem(ACCESS_KEY, access),
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

export const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const access = tokenStorage.getAccess()
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

// Queue of requests waiting on a single in-flight refresh, so a burst of parallel 401s
// doesn't trigger a burst of parallel refresh calls.
let refreshPromise = null

async function refreshAccessToken() {
  const refresh = tokenStorage.getRefresh()
  if (!refresh) throw new Error('No refresh token available')
  const { data } = await axios.post('/api/auth/token/refresh/', { refresh })
  tokenStorage.setAccess(data.access)
  return data.access
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const isAuthEndpoint = config?.url?.includes('/auth/token/')

    if (response?.status === 401 && !config._retried && !isAuthEndpoint && tokenStorage.getRefresh()) {
      config._retried = true
      try {
        refreshPromise = refreshPromise || refreshAccessToken()
        const access = await refreshPromise
        refreshPromise = null
        config.headers.Authorization = `Bearer ${access}`
        return api(config)
      } catch (refreshError) {
        refreshPromise = null
        tokenStorage.clear()
        // Let the app know so it can drop the stale user out of context / redirect to login.
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// Flattens DRF's various error shapes ({detail}, {non_field_errors}, {field: [msgs]}, or a
// plain string) into one readable message for a form/alert to show. A 500 (or anything that
// isn't a JSON DRF error body, e.g. Django's own DEBUG=True HTML traceback page) never gets
// rendered as-is - only clean, JSON validation errors are shown verbatim.
export function formatApiError(error) {
  const data = error?.response?.data
  const status = error?.response?.status
  if (!data) return error?.message || 'Something went wrong. Please try again.'
  if (status >= 500) return 'The server ran into an unexpected error processing this request. Please try again or contact support.'
  if (typeof data === 'string') {
    return data.trim().startsWith('<') ? 'Something went wrong. Please try again.' : data
  }
  if (data.detail) return data.detail
  const parts = []
  for (const [field, value] of Object.entries(data)) {
    const messages = Array.isArray(value) ? value.join(' ') : String(value)
    parts.push(field === 'non_field_errors' ? messages : `${field}: ${messages}`)
  }
  return parts.join(' ') || 'Something went wrong. Please try again.'
}
