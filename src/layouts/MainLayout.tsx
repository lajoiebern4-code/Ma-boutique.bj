import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#F7F5F1] text-[#0B1E3D]">
      <Header />

      <main>
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
