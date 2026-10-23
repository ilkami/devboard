import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/Shell'
import Dashboard from './pages/Dashboard'
import ProjectsPage from './pages/ProjectsPage'
import ProjectBoardPage from './pages/ProjectBoardPage'
import CalendarPage from './pages/CalendarPage'
import TasksPage from './pages/TasksPage'
import AuthPage from './pages/AuthPage'
import Placeholder from './pages/Placeholder'
import { useAuth } from './auth/AuthContext'

function ProtectedShell() {
  const { user } = useAuth()
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
        <Route
          path="/technologies"
          element={
            <Placeholder
              title="Технологии"
              modules="Модуль 5"
              notes={[
                'Справочник технологий: название, категория, иконка.',
                'Число проектов на каждую технологию и фильтр проектов по технологии.',
                'Добавление и редактирование технологий.',
              ]}
            />
          }
        />
        <Route
          path="/reports"
          element={
            <Placeholder
              title="Отчёты"
              modules="Модули 10, 14"
              notes={[
                'Столбчатая диаграмма прогресса по проектам и динамика закрытия задач по неделям.',
                'План/факт трудозатрат: оценка в часах против фактических записей времени.',
                'Анализ сроков: отставания и ориентировочная дата завершения проекта.',
              ]}
            />
          }
        />
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
