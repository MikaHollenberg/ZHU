export function StatTile({
  label,
  value,
  sub,
  badge,
}: {
  label: string
  value: string
  sub?: string
  badge?: number
}) {
  return (
    <div className="card relative px-4 py-3.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand-blue-dark">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      {badge !== undefined && badge > 0 && (
        <span
          aria-label={`${badge} openstaand`}
          className="absolute right-2.5 top-2.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-status-geannuleerd px-1.5 text-[10px] font-bold text-white"
        >
          {badge}
        </span>
      )}
    </div>
  )
}
