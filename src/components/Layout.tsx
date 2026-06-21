import { Outlet, NavLink } from 'react-router-dom'
import { Heart, MessageCircle, User, Plus, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { isArtin } = useAuth()

  return (
    <div className="h-screen flex flex-col max-w-md mx-auto bg-white overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-center py-4 border-b border-gray-100">
        <span className="text-2xl font-bold tracking-tight text-primary">Artinder</span>
      </header>
      <main className="flex-1 overflow-hidden min-h-0">
        <Outlet />
      </main>
      <nav className="border-t border-gray-100 bg-white safe-bottom">
        <div className={`flex justify-around py-2 ${isArtin ? 'grid-cols-4' : 'grid grid-cols-3'}`}>
          <NavLink to="/" end className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 ${isActive ? 'text-primary' : 'text-gray-400'}`
          }>
            <Heart size={24} />
            <span className="text-xs mt-1">Discover</span>
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 ${isActive ? 'text-primary' : 'text-gray-400'}`
          }>
            <MessageCircle size={24} />
            <span className="text-xs mt-1">Messages</span>
          </NavLink>
          {isArtin && (
            <>
              <NavLink to="/artin" className={({ isActive }) =>
                `flex flex-col items-center py-2 px-4 ${isActive ? 'text-primary' : 'text-gray-400'}`
              }>
                <LayoutDashboard size={24} />
                <span className="text-xs mt-1">Dashboard</span>
              </NavLink>
              <NavLink to="/artin/create-mood" className={({ isActive }) =>
                `flex flex-col items-center py-2 px-4 ${isActive ? 'text-primary' : 'text-gray-400'}`
              }>
                <Plus size={24} />
                <span className="text-xs mt-1">Ny Persona</span>
              </NavLink>
            </>
          )}
          <NavLink to="/profile" className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 ${isActive ? 'text-primary' : 'text-gray-400'}`
          }>
            <User size={24} />
            <span className="text-xs mt-1">Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
