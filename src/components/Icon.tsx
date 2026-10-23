import type { ReactElement } from 'react'
import type { IconName } from '../types'

/** Набор иконок интерфейса: обводка, цвет наследуется от родителя (currentColor). */

const PATHS: Record<IconName, ReactElement> = {
  home: (
    <>
      <path d="M3 11 12 3.5l9 7.5" />
      <path d="M5.5 9.6V20h13V9.6" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7.5A2 2 0 0 1 5 5.5h3.6l1.6 2.2H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </>
  ),
  'check-square': (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3.2" />
      <path d="m8.2 12.2 2.5 2.5 5.1-5.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="6" width="16" height="14" rx="2.6" />
      <path d="M8 3.8V7M16 3.8V7M4 10.6h16" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3.2 8 4.3-8 4.3-8-4.3z" />
      <path d="m4 12.2 8 4.3 8-4.3" />
      <path d="m4 16.4 8 4.3 8-4.3" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7.5 20v-6.5M12 20V8M16.5 20v-9.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.5 14.3a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.4.87z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.4" />
      <path d="m15.8 15.8 4.2 4.2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  bell: (
    <>
      <path d="M18 15.6V11a6 6 0 1 0-12 0v4.6L4.4 18.4h15.2z" />
      <path d="M10 21.2h4" />
    </>
  ),
  'chevron-down': <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  'chevron-left': <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />,
  'chevron-right': <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.4V12l3.1 2" />
    </>
  ),
  code: <path d="m9 7.5-5 4.5 5 4.5M15 7.5l5 4.5-5 4.5" />,
  flag: (
    <>
      <path d="M6 20.5V4" />
      <path d="M6 5h11.4l-1.9 3.4 1.9 3.4H6" />
    </>
  ),
  list: (
    <>
      <path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11" />
      <path d="M4.2 6.5h.01M4.2 12h.01M4.2 17.5h.01" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4a15 15 0 0 1 0 16 15 15 0 0 1 0-16" />
    </>
  ),
  send: (
    <>
      <path d="M21 3.5 11.6 13" />
      <path d="M21 3.5 14.4 21l-3.6-8-8-3.7z" />
    </>
  ),
  sparkles: (
    <>
      <path d="m11 4.5 1.7 4.3 4.3 1.7-4.3 1.7L11 16.5 9.3 12.2 5 10.5l4.3-1.7z" />
      <path d="m17.8 15.5.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  box: (
    <>
      <path d="m12 3 8 4.4v9.2L12 21l-8-4.4V7.4z" />
      <path d="M4 7.4l8 4.4 8-4.4M12 21v-9.2" />
    </>
  ),
  book: (
    <>
      <path d="M6.5 4H20v15.5H6.5A2 2 0 0 0 4.5 21.5V6.5a2.5 2.5 0 0 1 2-2.5z" />
      <path d="M4.5 19.2c0-1.2 1-2 2-2H20" />
      <path d="M9.5 8h6" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7.6" />
      <circle cx="12" cy="12" r="3.9" />
      <circle cx="12" cy="12" r="0.6" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.2 20.8 19.4H3.2z" />
      <path d="M12 10v4.2M12 17h.01" />
    </>
  ),
  x: (
    <>
      <path d="m6.5 6.5 11 11" />
      <path d="m17.5 6.5-11 11" />
    </>
  ),
}

interface IconProps {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
}

export default function Icon({ name, size = 20, strokeWidth = 1.7, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
