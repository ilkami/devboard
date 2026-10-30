import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/Shell'
import Dashboard from './pages/Dashboard'
import ProjectsPage from './pages/ProjectsPage'
import ProjectBoardPage from './pages/ProjectBoardPage'
import CalendarPage from './pages/CalendarPage'
import TasksPage from './pages/TasksPage'
import TechnologiesPage from './pages/TechnologiesPage'
import ReportsPage from './pages/ReportsPage'
import AuthPage from './pages/AuthPage'
import { useAuth } from './auth/AuthContext'

function ProtectedShell() {
  const { user, loading } = useAuth()

  // Пока проверяется cookie-сессия, не перенаправляем на форму входа
  if (loading) {
    return (
      <div className="app-loading">
        <span className="app-loading__spinner" />
        <p>Загружаем рабочее пространство…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <AppShell />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route element={<ProtectedShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectBoardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/technologies" element={<TechnologiesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  // При открытии собранного автономного HTML-файла (file://) браузерная история
  // недоступна, поэтому используется HashRouter. При работе через сервер — BrowserRouter.
  if (window.location.protocol === 'file:') {
    return (
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    )
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
