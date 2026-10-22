import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { initials, useAuth } from '../auth/AuthContext'
import { TASKS, isOverdue } from '../data/mockData'
import type { IconName } from '../types'

interface NavItem {
  to: string
  label: string
  icon: IconName
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Главная', icon: 'home' },
  { to: '/projects', label: 'Проекты', icon: 'folder' },
  { to: '/tasks', label: 'Задачи', icon: 'check-square' },
  { to: '/calendar', label: 'Календарь', icon: 'calendar' },
  { to: '/technologies', label: 'Технологии', icon: 'layers' },
  { to: '/reports', label: 'Отчёты', icon: 'chart' },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">
          <Icon name="code" size={18} strokeWidth={2} />
        </span>
        <span className="sidebar__brand-name">DevBoard</span>
      </div>

      <nav className="sidebar__nav" aria-label="Основная навигация">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
            }
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (!user) return null

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="user-menu">
      <button
        type="button"
        className="user"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="user__avatar">{initials(user.name)}</span>
        <span className="user__text">
          <span className="user__name">{user.name}</span>
          <span className="user__role">{user.roleTitle}</span>
        </span>
        <Icon name="chevron-down" size={16} />
      </button>

      {open && (
        <>
          <span className="user-menu__backdrop" onClick={() => setOpen(false)} />
          <div className="user-menu__panel" role="menu">
            <p className="user-menu__name">{user.name}</p>
            <p className="user-menu__email">{user.email}</p>
            <div className="user-menu__divider" />
            <button type="button" className="user-menu__action" onClick={handleLogout} role="menuitem">
              <Icon name="send" size={16} />
              Выйти из аккаунта
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Topbar() {
  const [query, setQuery] = useState('')
  const attention = TASKS.filter((task) => isOverdue(task.dueDate)).length

  return (
    <header className="topbar">
      <label className="search">
        <Icon name="search" size={17} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск проектов, задач, технологий..."
          aria-label="Поиск проектов, задач и технологий"
        />
      </label>

      <div className="topbar__actions">
        <button type="button" className="button button--primary">
          <Icon name="plus" size={16} strokeWidth={2.1} />
          Новый проект
        </button>

        <button type="button" className="icon-button" aria-label="Уведомления">
          <Icon name="bell" size={19} />
          {attention > 0 && <span className="icon-button__badge">{attention}</span>}
        </button>

        <UserMenu />
      </div>
    </header>
  )
}

export default function AppShell() {
  return (
    <div className="app">
      <Sidebar />
      <div className="app__main">
        <Topbar />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
