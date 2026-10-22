import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { useAuth } from '../auth/AuthContext'
import type { IconName } from '../types'

const FEATURES: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'target', title: 'Чёткие приоритеты', text: 'Фокус на важном' },
  { icon: 'calendar', title: 'Контроль дедлайнов', text: 'Ничего не забудете' },
  { icon: 'chart', title: 'Наглядный прогресс', text: 'Видно результат' },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface AuthPageProps {
  mode: 'login' | 'register'
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const isRegister = mode === 'register'

  const [name, setName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (isRegister && name.trim().length < 2) {
      setError('Укажите имя — не менее 2 символов')
      return
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Введите корректный email')
      return
    }
    if (password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов')
      return
    }
    if (isRegister && password !== confirm) {
      setError('Пароли не совпадают')
      return
    }

    setBusy(true)
    try {
      if (isRegister) {
        await register({ name, email, password, roleTitle })
      } else {
        await login({ email, password })
      }
      navigate('/', { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось выполнить вход')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <section className="auth__aside">
        <div className="auth__brand">
          <span className="auth__logo">
            <Icon name="code" size={19} strokeWidth={2} />
          </span>
          DevBoard
        </div>

        <h1 className="auth__headline">
          Приложение для управления личными проектами программиста
        </h1>
        <p className="auth__lead">Задачи, сроки, технологии и прогресс — всё в одном месте</p>

        <ul className="auth__features">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="auth__feature">
              <span className="auth__feature-icon">
                <Icon name={feature.icon} size={18} />
              </span>
              <span>
                <span className="auth__feature-title">{feature.title}</span>
                <span className="auth__feature-text">{feature.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="auth__panel">
        <div className="auth__card">
          <div className="auth__tabs">
            <Link to="/login" className={isRegister ? 'auth__tab' : 'auth__tab auth__tab--active'}>
              Вход
            </Link>
            <Link
              to="/register"
              className={isRegister ? 'auth__tab auth__tab--active' : 'auth__tab'}
            >
              Регистрация
            </Link>
          </div>

          <form className="form" onSubmit={submit} noValidate>
            <h2 className="auth__form-title">
              {isRegister ? 'Создание аккаунта' : 'Вход в систему'}
            </h2>

            {isRegister && (
              <label className="field">
                <span className="field__label">Имя</span>
                <input
                  className="field__input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Как к вам обращаться"
                  autoComplete="name"
                />
              </label>
            )}

            <label className="field">
              <span className="field__label">Email</span>
              <input
                className="field__input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            {isRegister && (
              <label className="field">
                <span className="field__label">
                  Специальность <span className="field__optional">— необязательно</span>
                </span>
                <input
                  className="field__input"
                  value={roleTitle}
                  onChange={(event) => setRoleTitle(event.target.value)}
                  placeholder="Fullstack Developer"
                />
              </label>
            )}

            <label className="field">
              <span className="field__label">Пароль</span>
              <input
                className="field__input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Не менее 8 символов"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </label>

            {isRegister && (
              <label className="field">
                <span className="field__label">Повторите пароль</span>
                <input
                  className="field__input"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Ещё раз"
                  autoComplete="new-password"
                />
              </label>
            )}

            {error && <p className="form__error">{error}</p>}

            <button type="submit" className="button button--primary button--block" disabled={busy}>
              {busy ? 'Подождите…' : isRegister ? 'Зарегистрироваться' : 'Войти'}
            </button>

            <p className="auth__switch">
              {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
              <Link to={isRegister ? '/login' : '/register'}>
                {isRegister ? 'Войти' : 'Зарегистрироваться'}
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  )
}
