// Titel per route, gebruikt voor het browsertabblad (document.title).
// Centraal hier i.p.v. in elke pagina apart, zodat het overzichtelijk blijft.
export const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/login': 'Inloggen',
  '/registreren': 'Registreren',
  '/wachtwoord-vergeten': 'Wachtwoord vergeten',
  '/wachtwoord-instellen': 'Wachtwoord instellen',
  '/algemene-voorwaarden': 'Algemene voorwaarden',
  '/privacybeleid': 'Privacybeleid',
  '/profiel': 'Mijn gegevens',
  '/beschikbaarheid': 'Beschikbaarheid',
  '/mijn-lessen': 'Mijn lessen',
  '/handige-info': 'Handige info',
  '/lesgeven': 'Lesgeven',
  '/statistieken': 'Mijn statistieken',
  '/beheer/cursisten': 'Cursisten',
  '/beheer/beschikbaarheid': 'Rooster',
  '/beheer/labels': 'Labels',
  '/beheer/statistieken': 'Statistieken',
}
