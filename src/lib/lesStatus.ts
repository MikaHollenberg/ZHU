import type { LesStatus } from '../types/lesson'

export const STATUS_LABELS: Record<LesStatus, string> = {
  gepland: 'Gepland',
  verzet: 'Verzet',
  geannuleerd: 'Geannuleerd',
}

export const STATUS_STYLES: Record<LesStatus, string> = {
  gepland: 'bg-status-bevestigd-bg text-status-bevestigd',
  verzet: 'bg-status-wachtend-bg text-status-wachtend',
  geannuleerd: 'bg-status-geannuleerd-bg text-status-geannuleerd',
}
