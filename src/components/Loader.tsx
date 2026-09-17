import { CompassIcon } from './icons'

export function Loader({
  label = 'Laden...',
  className = 'flex items-center gap-2 py-8 text-slate-400',
}: {
  label?: string
  className?: string
}) {
  return (
    <div className={className}>
      <CompassIcon className="h-4 w-4 flex-none animate-compass text-brand-blue" />
      {label}
    </div>
  )
}
