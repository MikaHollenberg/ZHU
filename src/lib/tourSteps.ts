import type { ReactElement } from 'react'
import { CalendarIcon, CheckIcon, CompassIcon, UsersIcon } from '../components/icons'

export type TourStep = {
  title: string
  body: string
  /** Route waar deze stap moet worden getoond — de tour navigeert er zelf naartoe. */
  route: string
  /** id van het echte schermdeel dat gemarkeerd wordt — leeg = geen spotlight, alleen een gedimd scherm. */
  targetId?: string
  icon: (props: { className?: string }) => ReactElement
}

export function buildAvailabilityTourSteps({
  isInstructeur,
  metDuoStap,
}: {
  isInstructeur: boolean
  metDuoStap: boolean
}): TourStep[] {
  const stappen: TourStep[] = [
    {
      title: 'Welkom bij het portal',
      body: isInstructeur
        ? 'Fijn dat je er bent! We laten je in een paar korte stapjes zien hoe je je beschikbaarheid doorgeeft om les te kunnen geven. Dat duurt ongeveer een halve minuut.'
        : 'Fijn dat je er bent! We laten je in een paar korte stapjes zien hoe je je beschikbaarheid doorgeeft, zodat de zeilschool een les voor je kan inplannen. Dat duurt ongeveer een minuut.',
      route: '/',
      targetId: 'tour-home',
      icon: CompassIcon,
    },
  ]

  if (!isInstructeur) {
    stappen.push(
      {
        title: 'Kies jouw discipline',
        body: 'Kies hier welke vorm van zeilen je wilt doen: Polyvalk, Fox22 of Windsurf. Je stelt dit maar één keer in — het portal onthoudt je keuze voortaan vanzelf. Weet je niet zeker wat het beste bij je past? Neem gerust contact met ons op via info@zeilschooluitgeest.nl, dan adviseren we je graag welke discipline goed bij je past.',
        route: '/beschikbaarheid',
        targetId: 'tour-discipline',
        icon: CompassIcon,
      },
      {
        title: 'Kies jouw lesvorm',
        body: 'Daarna kies je je lesvorm: een privéles (alleen voor jou) of een duo-cursus samen met een vaste partner, in 5 keer 2 uur of een 2-daagse cursus. Ook deze keuze wordt onthouden. Twijfel je tussen privéles en duo-cursus, of tussen de duo-vormen? Bel of mail ons gerust via info@zeilschooluitgeest.nl — we denken graag met je mee.',
        route: '/beschikbaarheid',
        targetId: 'tour-lesvorm',
        icon: UsersIcon,
      },
    )

    if (metDuoStap) {
      stappen.push({
        title: 'Gegevens van je duo-partner',
        body: 'Omdat je voor een duo-cursus hebt gekozen, vul je hier eenmalig de gegevens van je vaste partner in. Dat hoef je maar één keer te doen — het portal gebruikt deze gegevens daarna automatisch bij elke duo-les.',
        route: '/beschikbaarheid',
        targetId: 'tour-duo-partner',
        icon: UsersIcon,
      })
    }
  }

  stappen.push(
    {
      title: 'Geef je dagen door',
      body: isInstructeur
        ? 'Hieronder zie je de komende dagen, per week. Tik op een dag om aan te geven of je die dag de hele dag kunt lesgeven, helemaal niet kunt, of alleen tijdens een bepaald tijdvak (minimaal 2 uur).'
        : 'Hieronder zie je de komende dagen, per week. Tik op een dag om aan te geven of je die dag de hele dag kunt, helemaal niet kunt, of alleen tijdens een bepaald tijdvak (minimaal 2 uur).',
      route: '/beschikbaarheid',
      targetId: 'tour-kalender',
      icon: CalendarIcon,
    },
    {
      title: 'Dat is alles!',
      body: isInstructeur
        ? 'Zodra je dagen hebt doorgegeven, kun je je bij "Lesgeven" aanmelden voor openstaande lessen op die dagen. Met de Home-knop in het menu kom je altijd weer hier terug, en via het menu kun je deze rondleiding ook later nog eens bekijken.'
        : 'Zodra je dagen hebt doorgegeven, plant de zeilschool daar een les voor je in. Je ziet die les daarna terug bij "Mijn lessen". Met de Home-knop in het menu kom je altijd weer hier terug, en via het menu kun je deze rondleiding ook later nog eens bekijken.',
      route: '/',
      targetId: 'tour-home',
      icon: CheckIcon,
    },
  )

  return stappen
}
