import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/Shell'
import Dashboard from './pages/Dashboard'
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
        <Route
          path="/projects"
          element={
            <Placeholder
              title="Проекты"
              modules="Модули 2, 4, 5, 7"
              notes={[
                'Список карточек проектов с фильтрами Все / В работе / Пауза / Архив и сортировкой по дате.',
                'Карточка проекта: обзор, Kanban-доска, задачи, этапы, заметки, история.',
                'Kanban-доска с drag-and-drop между колонками To Do / In Progress / Done и сохранением порядка.',
              ]}
            />
          }
        />
        <Route
          path="/tasks"
          element={
            <Placeholder
              title="Задачи"
              modules="Модуль 3"
              notes={[
                'Список задач с фильтрами Сегодня / Неделя / Все, по проекту, статусу и приоритету.',
                'Подзадачи через parent_task_id, дерево любой глубины.',
                'Карточка задачи: срок, оценка часов, таймер учёта времени, привязка к коммиту.',
              ]}
            />
          }
        />
        <Route
          path="/calendar"
          element={
            <Placeholder
              title="Календарь"
              modules="Модуль 6"
              notes={[
                'Месячная сетка с задачами по дням и переходом между месяцами.',
                'Список ближайших дедлайнов и отдельный список просроченных задач.',
                'Сроки хранятся в UTC и отображаются в часовом поясе пользователя.',
              ]}
            />
          }
        />
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
