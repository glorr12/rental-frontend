import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AccountRole } from '../api/auth'
import { formatApiError } from '../api/client'
import Alert from '../components/Alert'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', name: '', role: AccountRole.TENANT })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card card-pad" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1>Create an account</h1>
      <Alert type="error">{error}</Alert>
      <form className="form-grid" onSubmit={submit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="role">I am mainly here to</label>
          <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value={AccountRole.TENANT}>Book a place to stay</option>
            <option value={AccountRole.LANDLORD}>List my property</option>
          </select>
          <span className="field-hint">You can list a property later from your profile either way.</span>
        </div>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
