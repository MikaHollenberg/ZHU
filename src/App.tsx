import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RequireRole } from './components/RequireRole'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { AlgemeneVoorwaarden } from './pages/AlgemeneVoorwaarden'
import { Privacybeleid } from './pages/Privacybeleid'
import { Profile } from './pages/Profile'
import { Home } from './pages/Home'
import { Availability } from './pages/Availability'
import { MyLessons } from './pages/MyLessons'
import { HandigeInfo } from './pages/HandigeInfo'
import { AdminCursisten } from './pages/admin/Cursisten'
import { AdminBeschikbaarheid } from './pages/admin/BeschikbaarheidOverzicht'
import { AdminLabels } from './pages/admin/Labels'
import { AdminStatistieken } from './pages/admin/Statistieken'
import { InstructeurLessen } from './pages/InstructeurLessen'
import { InstructeurStatistieken } from './pages/InstructeurStatistieken'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registreren" element={<Register />} />
            <Route path="/wachtwoord-vergeten" element={<ForgotPassword />} />
            <Route path="/wachtwoord-instellen" element={<ResetPassword />} />
            <Route path="/algemene-voorwaarden" element={<AlgemeneVoorwaarden />} />
            <Route path="/privacybeleid" element={<Privacybeleid />} />
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
              path="/handige-info"
              element={
                <ProtectedRoute>
                  <HandigeInfo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lesgeven"
              element={
                <ProtectedRoute>
                  <RequireRole role="instructeur">
                    <InstructeurLessen />
                  </RequireRole>
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistieken"
              element={
                <ProtectedRoute>
                  <RequireRole role="instructeur">
                    <InstructeurStatistieken />
                  </RequireRole>
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
            <Route
              path="/beheer/statistieken"
              element={
                <ProtectedRoute>
                  <RequireRole role="beheerder">
                    <AdminStatistieken />
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
