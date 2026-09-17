type IconProps = { className?: string }

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.006l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.796 2.796 6.79-6.878a1 1 0 0 1 1.414-.024Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-12a.75.75 0 0 0-1.5 0v4c0 .2.08.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28V6Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 8.586 6.293 4.879a1 1 0 1 0-1.414 1.414L8.586 10l-3.707 3.707a1 1 0 1 0 1.414 1.414L10 11.414l3.707 3.707a1 1 0 0 0 1.414-1.414L11.414 10l3.707-3.707a1 1 0 0 0-1.414-1.414L10 8.586Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function CalendarPlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
      <path strokeLinecap="round" d="M3 8.5h14M7 3v3M13 3v3" />
      <path strokeLinecap="round" d="M10 11v4M8 13h4" />
    </svg>
  )
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
      <path strokeLinecap="round" d="M3 8.5h14M7 3v3M13 3v3" />
    </svg>
  )
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <circle cx="7" cy="6.5" r="2.5" />
      <path strokeLinecap="round" d="M2.5 16c0-2.5 2-4.2 4.5-4.2s4.5 1.7 4.5 4.2" />
      <circle cx="14" cy="7" r="2" />
      <path strokeLinecap="round" d="M13 11.9c2 .2 3.5 1.7 3.5 4" />
    </svg>
  )
}

export function TagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path
        strokeLinejoin="round"
        d="M10.6 3H5a2 2 0 0 0-2 2v5.6c0 .5.2 1 .6 1.4l7 7c.8.8 2 .8 2.8 0l4.6-4.6c.8-.8.8-2 0-2.8l-7-7c-.4-.4-.9-.6-1.4-.6Z"
      />
      <circle cx="7" cy="7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CompassIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="7.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12.6 7.4-1.4 4-4 1.4 1.4-4 4-1.4Z" />
    </svg>
  )
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4.6c1.6-.9 4-.9 5.5 0v11.2c-1.5-.9-3.9-.9-5.5 0V4.6ZM17 4.6c-1.6-.9-4-.9-5.5 0v11.2c1.5-.9 3.9-.9 5.5 0V4.6Z"
      />
    </svg>
  )
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <circle cx="10" cy="6.8" r="3.3" />
      <path strokeLinecap="round" d="M3.5 17c.7-3.4 3.2-5.3 6.5-5.3s5.8 1.9 6.5 5.3" />
    </svg>
  )
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 17.5H4.5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1h3M13.5 14l4-4-4-4M17.25 10h-9.5"
      />
    </svg>
  )
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path strokeLinecap="round" d="M3 5.5h14M3 10h14M3 14.5h14" />
    </svg>
  )
}

export function ChartBarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V11M10 16.5V6M16 16.5v-7.5" />
      <path strokeLinecap="round" d="M2.5 16.5h15" />
    </svg>
  )
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 8.5a5 5 0 0 1 10 0c0 3 1 4.5 1.5 5.2.3.4 0 1-.5 1H4c-.5 0-.8-.6-.5-1C4 13 5 11.5 5 8.5Z"
      />
      <path strokeLinecap="round" d="M8 16.5c.4.9 1.1 1.5 2 1.5s1.6-.6 2-1.5" />
    </svg>
  )
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h12M8 6V4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 6 6.2 16a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9L14.5 6" />
    </svg>
  )
}

export function DotIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="5" />
    </svg>
  )
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5 10 3l7 6.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8v8.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8" />
    </svg>
  )
}

export function HelpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="7.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.7 7.9c.2-1.2 1.3-2 2.6-1.8 1.2.1 2.1 1 2.1 2.1 0 1.6-2.1 1.7-2.1 3.3" />
      <circle cx="10" cy="14.1" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

