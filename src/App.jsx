import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.jsx'
import Nav from './components/Nav'
import Landing from './pages/Landing'
import Feed from './pages/Feed'
import SimulationsPage from './pages/SimulationsPage'
import Forums from './pages/Forums'
import ForumThread from './pages/ForumThread'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Admin from './pages/Admin'
import Privacy from './pages/Privacy'
import About from './pages/About'


function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/" replace />
  return children
}

function AdminRoute({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!profile?.is_admin) return <Navigate to="/feed" replace />
  return children
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2EDE3' }}>
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 40 40" fill="none">
          <path d="M20 4C11.2 4 4 11.2 4 20s7.2 16 16 16 16-7.2 16-16S28.8 4 20 4z" stroke="#B5ADA0" strokeWidth="1" fill="none"/>
          <path d="M20 10c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10z" stroke="#B5ADA0" strokeWidth="1" fill="none" opacity="0.6"/>
          <circle cx="20" cy="20" r="3" fill="#B5ADA0" opacity="0.4"/>
        </svg>
        <span className="text-[12px] tracking-widest uppercase" style={{ color: '#B5ADA0' }}>Loading</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/"           element={<Landing />} />
        <Route path="/feed"       element={<Feed />} />
        <Route path="/sims"       element={<SimulationsPage />} />
        <Route path="/forums"     element={<Forums />} />
        <Route path="/forums/:id" element={<ForumThread />} />
        <Route path="/u/:username"element={<Profile />} />
        <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/admin"      element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/about"      element={<About />} />
        <Route path="/privacy"     element={<Privacy />} />
        <Route path="*"           element={<Navigate to="/feed" replace />} />
      </Routes>
    </>
  )
}