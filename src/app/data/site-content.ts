export interface EventInfo {
  title: string;
  date: string;
  location: string;
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
  location: 'Lyon',
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
  { label: 'Average rating', value: '4.9/5' },
  { label: 'Participants', value: '320+' },
  { label: 'Fan projects', value: '18' },
];

export const reviews: Review[] = [
  {
    name: 'Mina92',
    rating: 5,
    comment:
      'Beautiful decoration, smooth organization and a warm atmosphere from start to finish.',
    event: 'SEVENTEEN Cupsleeve',
  },
  {
    name: 'HoshiVibes',
    rating: 5,
    comment:
      'The playlist, freebies and photo spots were incredible. It really felt immersive.',
    event: 'Carat Night Lyon',
  },
  {
    name: 'WonwooLens',
    rating: 4,
    comment:
      'Very classy setup and friendly team. I would love an even bigger venue next time.',
    event: 'Fan Project Showcase',
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
