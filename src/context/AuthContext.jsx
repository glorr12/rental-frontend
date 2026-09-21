import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { becomeLandlord as apiBecomeLandlord, fetchMe, obtainToken, register as apiRegister } from '../api/auth'
import { tokenStorage } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  const loadMe = useCallback(async () => {
    try {
      const me = await fetchMe()
      setUser(me)
      return me
    } catch {
      tokenStorage.clear()
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    if (tokenStorage.getAccess()) {
      loadMe().finally(() => setBootstrapping(false))
    } else {
      setBootstrapping(false)
    }

    const onForcedLogout = () => setUser(null)
    window.addEventListener('auth:logout', onForcedLogout)
    return () => window.removeEventListener('auth:logout', onForcedLogout)
  }, [loadMe])

  const login = useCallback(
    async (email, password) => {
      const { access, refresh } = await obtainToken({ email, password })
      tokenStorage.setTokens(access, refresh)
      return loadMe()
    },
    [loadMe],
  )

  const register = useCallback(
    async ({ email, password, name, role }) => {
      await apiRegister({ email, password, name, role })
      return login(email, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const becomeLandlord = useCallback(async () => {
    const updated = await apiBecomeLandlord()
    setUser(updated)
    return updated
  }, [])

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLandlord: Boolean(user?.is_landlord),
    bootstrapping,
    login,
    register,
    logout,
    becomeLandlord,
    refreshUser: loadMe,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
