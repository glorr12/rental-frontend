import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function NavItem({ to, children, end }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
      {children}
    </NavLink>
  )
}

export default function Layout() {
  const { user, isAuthenticated, isLandlord, logout } = useAuth()

  return (
    <>
      <header className="site-header">
        <div className="container">
          <NavLink to="/" className="brand">
            Rental Housing
          </NavLink>
          <nav className="nav">
            <NavItem to="/" end>
              Browse
            </NavItem>
            {isAuthenticated && <NavItem to="/my-bookings">My bookings</NavItem>}
            {isLandlord && <NavItem to="/owner/listings">My listings</NavItem>}
            {isLandlord && <NavItem to="/owner/bookings">Booking requests</NavItem>}

            {isAuthenticated ? (
              <div className="nav-user">
                <NavItem to="/profile">{user?.name}</NavItem>
                <button type="button" className="link" onClick={logout}>
                  Log out
                </button>
              </div>
            ) : (
              <div className="nav-user">
                <NavItem to="/login">Log in</NavItem>
                <NavItem to="/register">Sign up</NavItem>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="page">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          Rental Housing - ITCareerHub course project frontend. Talks to the Django REST API
          running separately; nothing in the backend was changed to build this UI.
        </div>
      </footer>
    </>
  )
}
