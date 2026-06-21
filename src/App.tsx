import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'
import SwipePage from './pages/SwipePage'
import MessagesPage from './pages/MessagesPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import ArtinDashboardPage from './pages/ArtinDashboardPage'
import CreateMoodPage from './pages/CreateMoodPage'
import EditMoodPage from './pages/EditMoodPage'
import UserProfileViewPage from './pages/UserProfileViewPage'
import Layout from './components/Layout'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  const needsOnboarding = !profile || !profile.age

  if (needsOnboarding) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<SwipePage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:matchId" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {profile?.is_artin && (
          <>
            <Route path="/artin" element={<ArtinDashboardPage />} />
            <Route path="/artin/create-mood" element={<CreateMoodPage />} />
            <Route path="/artin/edit-mood/:moodId" element={<EditMoodPage />} />
            <Route path="/artin/user/:userId" element={<UserProfileViewPage />} />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
