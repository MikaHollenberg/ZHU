import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon } from './icons'

type QuickActionCardProps = {
  to: string
  label: string
  icon: (props: { className?: string }) => ReactElement
}

export function QuickActionCard({ to, label, icon: Icon }: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className="card flex items-center gap-3 px-4 py-3.5 transition-shadow duration-150 hover:shadow-[var(--shadow-card-hover)]"
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-brand-blue-light/40 text-brand-blue-dark">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="flex-1 text-sm font-semibold text-slate-800">{label}</span>
      <ChevronRightIcon className="h-4 w-4 flex-none text-slate-400" />
    </Link>
  )
}
