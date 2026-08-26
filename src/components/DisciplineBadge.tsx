import { DISCIPLINE_BADGE_CLASSES, DISCIPLINE_LABELS } from '../lib/disciplines'
import type { Discipline } from '../lib/disciplines'

export function DisciplineBadge({ discipline }: { discipline: Discipline }) {
  return (
    <span
      className={`badge ${DISCIPLINE_BADGE_CLASSES[discipline]}`}
    >
      {DISCIPLINE_LABELS[discipline]}
    </span>
  )
}
