import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { formatApiError } from '../api/client'
import { HOUSING_TYPE_LABELS, listListings } from '../api/listings'
import { popularListings, popularSearches } from '../api/statistics'
import Alert from '../components/Alert'
import ListingCard from '../components/ListingCard'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'

// Not a real DRF `ordering` value: the backend's ListingViewSet.ordering_fields covers
// price/created_at/average_rating/reviews_count but not the view counter, which lives in
// apps.statistics. Selecting this switches the grid over to
// /api/statistics/popular-listings/ (top N by ListingView rows) instead of /api/listings/.
const VIEWS_ORDERING = 'views'

const ORDERING_OPTIONS = [
  { value: '-created_at', label: 'Newest first' },
  { value: 'created_at', label: 'Oldest first' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
  { value: '-average_rating', label: 'Highest rated' },
  { value: '-reviews_count', label: 'Most reviewed' },
  { value: VIEWS_ORDERING, label: 'Most viewed' },
]

// EN: Matches the backend's own booking rule (BookingSerializer.validate(): start_date can't be
// in the past, and a stay can't exceed 30 nights) - the search filters below are informational
// (they don't create a booking), but there's no reason to let someone pick a check-in of, say,
// year 0000 or a check-out 10 years out when no real booking could ever use those dates anyway.
// RU: Повторяет собственное правило бронирования бэкенда (BookingSerializer.validate():
// start_date не может быть в прошлом, а бронь не может быть длиннее 30 ночей) - фильтры поиска
// ниже не создают бронь напрямую, но нет смысла разрешать выбрать check-in года 0000 или
// check-out на 10 лет вперёд, если такая бронь всё равно невозможна.
const todayStr = () => new Date().toISOString().slice(0, 10)
const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function FiltersForm({ params, onSubmit }) {
  const [draft, setDraft] = useState(params)

  useEffect(() => setDraft(params), [params])

  const update = (key) => (e) => {
    const value = e.target.value
    setDraft((d) => {
      const next = { ...d, [key]: value }
      if (key === 'check_in' && next.check_out && (next.check_out < value || next.check_out > addDays(value, 30))) {
        // Keep check-out consistent with the newly picked check-in instead of silently
        // submitting a now-invalid combination.
        next.check_out = ''
      }
      return next
    })
  }

  return (
    <form
      className="card card-pad filter-bar"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(draft)
      }}
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor="search">Search</label>
          <input id="search" placeholder="Title, description, city..." value={draft.search || ''} onChange={update('search')} />
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" value={draft.city || ''} onChange={update('city')} />
        </div>
        <div className="field">
          <label htmlFor="district">District</label>
          <input id="district" value={draft.district || ''} onChange={update('district')} />
        </div>
        <div className="field">
          <label htmlFor="housing_type">Type</label>
          <select id="housing_type" value={draft.housing_type || ''} onChange={update('housing_type')}>
            <option value="">Any</option>
            {Object.entries(HOUSING_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row" style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="price_min">Min price / night</label>
          <input id="price_min" type="number" min="0" step="0.01" value={draft.price_min || ''} onChange={update('price_min')} />
        </div>
        <div className="field">
          <label htmlFor="price_max">Max price / night</label>
          <input id="price_max" type="number" min="0" step="0.01" value={draft.price_max || ''} onChange={update('price_max')} />
        </div>
        <div className="field">
          <label htmlFor="rooms_count_min">Min rooms</label>
          <input id="rooms_count_min" type="number" min="1" value={draft.rooms_count_min || ''} onChange={update('rooms_count_min')} />
        </div>
        <div className="field">
          <label htmlFor="rooms_count_max">Max rooms</label>
          <input id="rooms_count_max" type="number" min="1" value={draft.rooms_count_max || ''} onChange={update('rooms_count_max')} />
        </div>
      </div>

      <div className="form-row" style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="check_in">Check-in</label>
          <input id="check_in" type="date" min={todayStr()} value={draft.check_in || ''} onChange={update('check_in')} />
        </div>
        <div className="field">
          <label htmlFor="check_out">Check-out</label>
          <input
            id="check_out"
            type="date"
            min={draft.check_in || todayStr()}
            max={addDays(draft.check_in || todayStr(), 30)}
            value={draft.check_out || ''}
            onChange={update('check_out')}
          />
        </div>
        <div className="field">
          <label htmlFor="ordering">Sort by</label>
          <select id="ordering" value={draft.ordering || '-created_at'} onChange={update('ordering')}>
            {ORDERING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <label>&nbsp;</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn">
              Apply filters
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => onSubmit({})}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = Object.fromEntries(searchParams.entries())
  const page = Number(params.page || 1)
  const sortedByViews = params.ordering === VIEWS_ORDERING

  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [trending, setTrending] = useState([])
  const [popular, setPopular] = useState([])
  const hasActiveFilters = Object.keys(params).some((k) => k !== 'page')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    // "Most viewed" comes from the statistics app, which returns a plain top-N array with no
    // pagination and no filtering - wrap it in the same shape the rest of this page expects.
    const request = sortedByViews
      ? popularListings().then((results) => ({ results, count: results.length, next: null, previous: null }))
      : listListings(params, page)

    request
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => !cancelled && setError(formatApiError(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  useEffect(() => {
    popularSearches()
      .then(setTrending)
      .catch(() => setTrending([]))
    popularListings()
      .then(setPopular)
      .catch(() => setPopular([]))
  }, [])

  const applyFilters = (next) => {
    const cleaned = Object.fromEntries(Object.entries(next).filter(([, v]) => v))
    setSearchParams(cleaned)
  }

  const goToPage = (nextPage) => setSearchParams({ ...params, page: String(nextPage) })

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Find a place to stay</h1>
          <p>Browse listings and filter by city, price, dates and more.</p>
        </div>
      </div>

      <FiltersForm params={params} onSubmit={applyFilters} />

      {trending.length > 0 && (
        <div style={{ margin: '16px 0 8px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            Trending searches:
          </span>
          {trending.slice(0, 6).map((t) => (
            <button key={t.keyword} type="button" className="btn btn-secondary btn-sm" onClick={() => applyFilters({ ...params, search: t.keyword })}>
              {t.keyword}
            </button>
          ))}
        </div>
      )}

      {!hasActiveFilters && popular.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="section-title">
            <h2 className="mb-0">Most viewed</h2>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              Ranked by how often each listing has been opened
            </span>
          </div>
          <div className="listing-grid">
            {popular.slice(0, 4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      <Alert type="error">{error}</Alert>

      {sortedByViews && (
        <Alert type="info">
          Sorted by view count, which comes from the statistics API: it returns the overall top listings, so the filters above
          are not applied in this mode.
        </Alert>
      )}

      {loading && <Spinner />}

      {!loading && data && data.results.length === 0 && (
        <div className="empty-state">No listings match these filters yet. Try widening your search.</div>
      )}

      {!loading && data && data.results.length > 0 && (
        <>
          {!hasActiveFilters && popular.length > 0 && (
            <div className="section-title">
              <h2 className="mb-0">All listings</h2>
            </div>
          )}
          <div className="listing-grid" style={{ marginTop: 8 }}>
            {data.results.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          {!sortedByViews && (
            <Pagination page={page} total={data.count} hasNext={Boolean(data.next)} hasPrevious={Boolean(data.previous)} onChange={goToPage} />
          )}
        </>
      )}
    </>
  )
}
