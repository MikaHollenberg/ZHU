import type { LesStatus } from '../types/lesson'

export const STATUS_LABELS: Record<LesStatus, string> = {
  gepland: 'Gepland',
  verzet: 'Verzet',
  geannuleerd: 'Geannuleerd',
}

export const STATUS_STYLES: Record<LesStatus, string> = {
  gepland: 'bg-green-100 text-green-700',
  verzet: 'bg-brand-yellow/40 text-brand-blue-dark',
  geannuleerd: 'bg-red-100 text-red-700',
}
