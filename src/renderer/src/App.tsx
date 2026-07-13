import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useTheme } from './contexts/ThemeContext'
import AppLayout from './components/layout/AppLayout'

// Lazy loaded pages (we will implement these next)
const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'))
const ClientListPage = React.lazy(() => import('./pages/clients/ClientListPage'))
const ContractListPage = React.lazy(() => import('./pages/contracts/ContractListPage'))
const DocumentArchivePage = React.lazy(() => import('./pages/documents/DocumentArchivePage'))
const CalendarPage = React.lazy(() => import('./pages/appointments/CalendarPage'))
const UserManagementPage = React.lazy(() => import('./pages/users/UserManagementPage'))
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'))
const AuditLogPage = React.lazy(() => import('./pages/audit/AuditLogPage'))

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

export default function App() {
  const { dir } = useTheme()
  
  // Set HTML dir attribute for RTL support
  React.useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = dir === 'rtl' ? 'ar' : 'fr'
  }, [dir])

  return (
    <HashRouter>
      <React.Suspense fallback={
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            <Route path="clients" element={<ClientListPage />} />
            {/* <Route path="clients/new" element={<ClientFormPage />} /> */}
            {/* <Route path="clients/:id" element={<ClientDetailPage />} /> */}
            
            <Route path="contracts" element={<ContractListPage />} />
            
            <Route path="documents" element={<DocumentArchivePage />} />
            
            <Route path="appointments" element={<CalendarPage />} />
            
            <Route path="users" element={<UserManagementPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="audit" element={<AuditLogPage />} />
          </Route>
        </Routes>
      </React.Suspense>
    </HashRouter>
  )
}
