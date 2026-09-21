import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { LandlordRoute, ProtectedRoute } from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import ListingDetailPage from './pages/ListingDetailPage'
import LoginPage from './pages/LoginPage'
import MyBookingsPage from './pages/MyBookingsPage'
import NotFoundPage from './pages/NotFoundPage'
import OwnerBookingsPage from './pages/OwnerBookingsPage'
import OwnerListingBlockedDatesPage from './pages/OwnerListingBlockedDatesPage'
import OwnerListingFormPage from './pages/OwnerListingFormPage'
import OwnerListingPhotosPage from './pages/OwnerListingPhotosPage'
import OwnerListingsPage from './pages/OwnerListingsPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="listings/:id" element={<ListingDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
        </Route>

        <Route element={<LandlordRoute />}>
          <Route path="owner/listings" element={<OwnerListingsPage />} />
          <Route path="owner/listings/new" element={<OwnerListingFormPage />} />
          <Route path="owner/listings/:id/edit" element={<OwnerListingFormPage />} />
          <Route path="owner/listings/:id/photos" element={<OwnerListingPhotosPage />} />
          <Route path="owner/listings/:id/blocked-dates" element={<OwnerListingBlockedDatesPage />} />
          <Route path="owner/bookings" element={<OwnerBookingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
