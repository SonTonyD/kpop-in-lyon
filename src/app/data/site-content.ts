export interface EventInfo {
  title: string;
  date: string;
  dateTime: string;
  time: string;
  location: string;
  venueNote: string;
  format: string;
  capacity: string;
  description: string;
  image: string;
}

export interface Review {
  name: string;
  rating: number;
  comment: string;
  event: string;
}

export interface PastEventStat {
  label: string;
  value: string;
}

export interface CollaborationOption {
  id: string;
  label: string;
}

export const upcomingEvent: EventInfo = {
  title: 'SEVENTEEN EVENT',
  date: 'May 19, 2026',
  dateTime: '2026-05-19T19:00:00+02:00',
  time: '19:00 — 23:00',
  location: 'Lyon',
  venueNote: 'Venue revealed to attendees',
  format: 'Fan Event',
  capacity: 'Capacity 250',
  description:
    'A fan event dedicated to SEVENTEEN, bringing fans together to celebrate their universe.',
  image: 'assets/event-hero.svg',
};

export const pastEventImages = [
  'assets/past-event-1.svg',
  'assets/past-event-2.svg',
  'assets/past-event-3.svg',
];

export const pastEventStats: PastEventStat[] = [
  { label: 'Note moyenne', value: '4.9/5' },
  { label: 'Participants', value: '320+' },
  { label: 'Projets fans', value: '18' },
];

export const reviews: Review[] = [
  {
    name: 'Mina92',
    rating: 5,
    comment:
      'Décoration magnifique, organisation fluide et ambiance chaleureuse du début à la fin.',
    event: 'Cupsleeve SEVENTEEN',
  },
  {
    name: 'HoshiVibes',
    rating: 5,
    comment:
      'La playlist, les freebies et les espaces photo étaient incroyables. L’expérience était vraiment immersive.',
    event: 'Carat Night Lyon',
  },
  {
    name: 'WonwooLens',
    rating: 4,
    comment:
      'Mise en place très élégante et équipe adorable. J’aimerais simplement une salle encore plus grande la prochaine fois.',
    event: 'Showcase Fan Project',
  },
];

export const aboutParagraphs = [
  'Kpop in Lyon est un projet créé par des passionnés de K-pop.',
  'Nous organisons des événements dédiés à des artistes et groupes afin de rassembler les fans autour de moments uniques.',
  'Notre objectif est de proposer des expériences immersives, conviviales et visuellement marquantes.',
];

export const collaborationTypes: CollaborationOption[] = [
  { id: 'full', label: 'Organisation complète par Kpop in Lyon' },
  { id: 'co', label: 'Co-organisation avec la fan base' },
  { id: 'assets', label: 'Collaboration avec fourniture d’éléments' },
  { id: 'visual', label: 'Collaboration visuelle (repartage uniquement)' },
  { id: 'promo', label: 'Aide à la promotion' },
];

export const decorationTypes: CollaborationOption[] = [
  { id: 'decor-kil', label: 'Décoration fournie par Kpop in Lyon' },
  { id: 'decor-fanbase', label: 'Éléments fournis par la fan base' },
  { id: 'decor-shared', label: 'Décoration collaborative' },
  { id: 'decor-immersive', label: 'Décoration immersive adaptée à l’artiste' },
];
