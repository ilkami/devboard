import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { TasksProvider } from './data/tasksStore'
import { TechnologiesProvider } from './data/techStore'
import './styles/global.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Не найден корневой элемент #root в index.html')
}

createRoot(container).render(
  <StrictMode>
    <AuthProvider>
      <TasksProvider>
        <TechnologiesProvider>
          <App />
        </TechnologiesProvider>
      </TasksProvider>
    </AuthProvider>
  </StrictMode>,
)
