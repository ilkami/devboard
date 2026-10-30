import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { TasksProvider } from './data/tasksStore'
import { TechnologiesProvider } from './data/techStore'
import { ProjectsProvider } from './data/projectsStore'
import './styles/global.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Не найден корневой элемент #root в index.html')
}

// Порядок провайдеров важен: задачи ссылаются на проекты (по project_id),
// поэтому ProjectsProvider должен быть выше TasksProvider.
createRoot(container).render(
  <StrictMode>
    <AuthProvider>
      <ProjectsProvider>
        <TechnologiesProvider>
          <TasksProvider>
            <App />
          </TasksProvider>
        </TechnologiesProvider>
      </ProjectsProvider>
    </AuthProvider>
  </StrictMode>,
)
