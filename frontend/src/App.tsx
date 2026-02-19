import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing   from './pages/Landing'
import AuthPage  from './pages/AuthPage'
import Dashboard from './pages/Dashboard'

type Page = 'landing' | 'login' | 'register' | 'dashboard'

function AppRoutes() {
  const { user, isLoading } = useAuth()
  const [page, setPage] = useState<Page>('landing')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const navigate = (next: string) => {
    if ((next === 'login' || next === 'register') && user) {
      setPage('dashboard')
    } else {
      setPage(next as Page)
    }
  }

  if (page === 'dashboard') {
    if (!user) { navigate('login'); return null }
    return <Dashboard onNavigate={navigate} />
  }

  if (page === 'login')    return <AuthPage mode="login"    onNavigate={navigate} />
  if (page === 'register') return <AuthPage mode="register" onNavigate={navigate} />

  return <Landing onNavigate={navigate} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
