# Rental Housing - Frontend

React (Vite) frontend for the ITCareerHub rental housing Django REST API. This project does
not modify the backend in any way - it's a separate app that talks to it over HTTP.

## Stack

- React 19 + React Router 6
- Axios for API calls, with a JWT access/refresh interceptor
- Plain CSS (no UI framework) - see `src/styles/index.css`
- No backend changes required, no CORS setup needed (see below)

## Running it

1. Start the Django backend as usual, on `http://127.0.0.1:8000` (`python manage.py runserver`).
2. In this folder:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://127.0.0.1:5173`.

If your backend runs on a different host/port, set `VITE_BACKEND_URL` before starting the dev
server, e.g. `VITE_BACKEND_URL=http://127.0.0.1:9000 npm run dev`.

### Why there's no CORS setup

`vite.config.js` proxies `/api`, `/media`, `/admin` and `/static` to Django, so the browser only
ever talks to one origin (the Vite dev server) and CORS never comes into play. In production,
build this app (`npm run build`, output in `dist/`) and serve the static files from behind the
same host/reverse proxy as the API, for the same reason - don't point a separately-hosted
frontend straight at the Django API without adding CORS headers there.

`/admin` and `/static` are proxied only for convenience, so the Django admin (and its own CSS)
can be opened at `http://localhost:5173/admin/` instead of switching ports. One catch: through
the proxy the browser still sends `Origin: http://localhost:5173`, which doesn't match Django's
own host, so admin *logins* need that origin listed in Django's `CSRF_TRUSTED_ORIGINS`:

```
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

If you'd rather not add that setting, drop `/admin` and `/static` from the proxy and open the
admin directly on the backend's port (`http://127.0.0.1:8000/admin/`) - then the origin matches
and nothing is needed.

## What's implemented

- Auth: register, log in, log out, JWT access/refresh handled transparently (an expired access
  token triggers a silent refresh; if the refresh token is also invalid, you're sent back to
  `/login`).
- Browsing: search/filter listings (city, district, type, price and room range, check-in/out
  dates, keyword search), sorting by price, date added (newest *and* oldest), rating, review
  count and view count, pagination, plus "most viewed" and "trending searches" sections fed by
  the statistics endpoints.
- Listing detail: photo gallery, rating, reviews, blocked date ranges, and a booking form for
  logged-in tenants (shows the estimated total client-side, the real total comes back from the
  server).
- Tenant side: "My bookings" with cancel, and leaving a review once a booking is `completed`.
- Owner side (visible once your account has `is_landlord`): manage your listings (create/edit/
  delete, accepting-bookings toggle), upload/remove photos, manage blocked date ranges, and
  respond to incoming booking requests (confirm/reject/cancel) - a note reminds you that
  unconfirmed requests auto-expire after 48 hours, matching the backend's
  `expire_pending_bookings` command.

## Соответствие требованиям курсовой

Где в интерфейсе закрыт каждый пункт задания ITCareerHub.

| Требование | Где во фронтенде | Что вызывается на бэкенде |
| --- | --- | --- |
| Создание объявления (заголовок, описание, местоположение, цена, комнаты, тип жилья) | `/owner/listings/new` (`OwnerListingFormPage`) | `POST /api/listings/` |
| Редактирование объявления | `/owner/listings/:id/edit` | `PATCH /api/listings/:id/` |
| Удаление объявления | кнопка **Delete** в `/owner/listings` | `DELETE /api/listings/:id/` |
| Переключение статуса активно/неактивно | кнопка **Activate / Deactivate** в `/owner/listings` (и чекбокс в форме) | `PATCH /api/listings/:id/` с `is_active` |
| Поиск по ключевым словам в заголовке/описании | поле **Search** на главной | `?search=` (`SearchFilter` по `title`, `description`, `city`) |
| Фильтр по цене (мин/макс) | поля **Min / Max price** | `?price_min=&price_max=` |
| Фильтр по местоположению (город/район) | поля **City / District** | `?city=&district=` |
| Фильтр по количеству комнат (диапазон) | поля **Min / Max rooms** | `?rooms_count_min=&rooms_count_max=` |
| Фильтр по типу жилья | селект **Type** | `?housing_type=` |
| Сортировка по цене (возр./убыв.) | **Price: low to high / high to low** | `?ordering=price` / `-price` |
| Сортировка по дате добавления (новые/старые) | **Newest first / Oldest first** | `?ordering=-created_at` / `created_at` |
| Сортировка по популярности (отзывы) | **Most reviewed** | `?ordering=-reviews_count` |
| Сортировка по популярности (просмотры) | **Most viewed** | `GET /api/statistics/popular-listings/` |
| Регистрация (имя, email, пароль) | `/register` | `POST /api/auth/register/` |
| Вход по email + паролю | `/login` | `POST /api/auth/token/` (JWT) |
| Роли: арендатор / арендодатель | выбор роли при регистрации, кнопка «Start listing properties» в `/profile`; разделы арендодателя закрыты `LandlordRoute` | `POST /api/auth/become-landlord/`, `GET /api/auth/me/` |
| Создание брони на даты | форма бронирования на странице объявления | `POST /api/bookings/` |
| Просмотр своих активных / завершённых броней | табы **Active / Completed / Cancelled & rejected / All** в `/my-bookings` | `GET /api/bookings/` |
| Отмена брони до определённой даты | кнопка **Cancel** в `/my-bookings` (бэкенд запрещает позже чем за сутки до заезда, текст ошибки показывается как есть) | `POST /api/bookings/:id/cancel/` |
| Арендодатель подтверждает / отклоняет запросы | кнопки **Confirm / Reject / Cancel** в `/owner/bookings` | `POST /api/bookings/:id/confirm/`, `/reject/`, `/cancel-by-owner/` |
| Отзыв и рейтинг от того, кто снимал жильё | форма **Leave a review** у брони со статусом `completed` в `/my-bookings` | `POST /api/reviews/` |
| Просмотр всех отзывов по объявлению | секция **Reviews** на странице объявления, с пагинацией | `GET /api/reviews/?listing=:id&page=` |
| История поиска: популярные запросы первыми | блок **Trending searches** на главной (клик подставляет запрос в фильтр) | `GET /api/statistics/popular-searches/` |
| История просмотров: самые просматриваемые первыми | блок **Most viewed** на главной + счётчик просмотров на карточке | `GET /api/statistics/popular-listings/` |

Дополнительно к заданию (есть в бэкенде, поэтому закрыто и здесь): загрузка/удаление фотографий
объявления (`/owner/listings/:id/photos`), собственные заблокированные даты владельца
(`/owner/listings/:id/blocked-dates`) и фильтр свободных дат `check_in` / `check_out` на главной.

## A couple of things worth knowing

- **"My listings" / "my bookings" are inferred, not filtered by the API.** `ListingSerializer`
  never returns an owner id (only `owner_name`), `BookingSerializer` never returns a tenant id,
  and neither endpoint has an `?owner=me` filter. Since the backend wasn't to be changed, the
  frontend works around this: it fetches everything the API already scopes to the logged-in
  user (`ListingViewSet`/`BookingViewSet` already include your own listings/bookings) and splits
  it out client-side - by matching `owner_name` to your account name for listings, and by
  listing ownership for bookings. This is reliable at course-project scale, but two landlords
  sharing an exact display name would confuse it. The real fix, if you ever want one, is a small
  backend addition (an `owner` id field, or `?owner=me`) - I did not make it since you asked me
  not to touch the backend.
- **A backend bug I found while building this, not something the frontend caused:** if the same
  tenant completes a second booking for a listing they already reviewed, submitting a second
  review 500s with `IntegrityError: UNIQUE constraint failed: reviews.listing_id,
  reviews.author_id`. `ReviewSerializer.validate()` only checks "does *this booking* already
  have a review", but `Review`'s `UniqueConstraint` is on `(listing, author)` - so the model
  allows only one review per listing per author, ever, while the serializer's own validation
  logic assumes multiple are fine across different bookings. The frontend catches this (and any
  other 5xx) and shows a generic "something went wrong" message instead of dumping the raw
  Django debug page, but the underlying mismatch is in the backend and needs a backend-side fix
  if you want repeat reviews to work.
