import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RequireRole } from './components/RequireRole'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Profile } from './pages/Profile'
import { Home } from './pages/Home'
import { Availability } from './pages/Availability'
import { MyLessons } from './pages/MyLessons'
import { AdminCursisten } from './pages/admin/Cursisten'
import { AdminBeschikbaarheid } from './pages/admin/BeschikbaarheidOverzicht'
import { AdminLabels } from './pages/admin/Labels'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registreren" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profiel"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/beschikbaarheid"
              element={
                <ProtectedRoute>
                  <Availability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mijn-lessen"
              element={
                <ProtectedRoute>
                  <MyLessons />
                </ProtectedRoute>
              }
            />
            <Route
              path="/beheer/cursisten"
              element={
                <ProtectedRoute>
                  <RequireRole role="beheerder">
                    <AdminCursisten />
                  </RequireRole>
                </ProtectedRoute>
              }
            />
            <Route
              path="/beheer/beschikbaarheid"
              element={
                <ProtectedRoute>
                  <RequireRole role="beheerder">
                    <AdminBeschikbaarheid />
                  </RequireRole>
                </ProtectedRoute>
              }
            />
            <Route
              path="/beheer/labels"
              element={
                <ProtectedRoute>
                  <RequireRole role="beheerder">
                    <AdminLabels />
                  </RequireRole>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
