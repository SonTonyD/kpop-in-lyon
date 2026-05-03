export type EventRequestStatus = 'new' | 'in_progress' | 'done' | 'rejected';

export interface EventRequest {
  id: string;
  fullName: string;
  fanbaseName: string;
  email: string;
  socialLinks: string | null;
  artist: string;
  city: string;
  period: string;
  collaborationTypes: string[];
  decorationTypes: string[];
  details: string;
  status: EventRequestStatus;
  createdAt: string;
}

export interface EventRequestPayload {
  fullName: string;
  fanbaseName: string;
  email: string;
  socialLinks: string | null;
  artist: string;
  city: string;
  period: string;
  collaborationTypes: string[];
  decorationTypes: string[];
  details: string;
}

export interface ParticipantReview {
  id: string;
  name: string;
  event: string;
  rating: number | null;
  comment: string;
  isPublished: boolean;
  createdAt: string;
}

export interface ParticipantReviewPayload {
  name: string;
  event: string;
  rating: number;
  comment: string;
}

export interface ManagedEvent {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  country: string;
  format: string;
  capacity: string;
  image: string;
  imagePath: string | null;
  dominantColor: string;
  isActive: boolean;
  createdAt: string;
}

export interface ManagedEventPayload {
  title: string;
  description: string;
  startsAt: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  country: string;
  format: string;
  capacity: string;
  image: string;
  imagePath: string | null;
  dominantColor: string;
}
