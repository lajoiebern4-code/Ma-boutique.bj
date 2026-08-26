import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminGuard() {
  const { user, estAdmin, chargement } = useAuth()

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-6 py-5 text-sm font-semibold text-slate-600 shadow-sm">
          Vérification de sécurité…
        </div>
      </div>
    )
  }

  if (!user || !estAdmin) {
    return <Navigate to="/admin-cs2026/login" replace />
  }

  return <Outlet />
}
