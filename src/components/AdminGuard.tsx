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
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Diagnostic admin</h1>
          <p className="mt-3 text-sm text-slate-600">Session présente : {user ? 'OUI' : 'NON'}</p>
          <p className="mt-1 break-all text-sm text-slate-600">UID : {user?.id || 'AUCUN'}</p>
          <p className="mt-1 text-sm text-slate-600">Est admin : {estAdmin ? 'OUI' : 'NON'}</p>
        </div>
      </div>
    )
  }

  return <Outlet />
}
