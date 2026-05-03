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

export type FanpackRecoveryMethod = 'lyon' | 'post' | 'mondial_relay';
export type FanpackSocialPlatform = 'instagram' | 'twitter';
export type FanpackOrderStatus =
  | 'proof_pending'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface FanpackMember {
  id: string;
  campaignId: string;
  name: string;
  stock: number;
  maxPerOrder: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface FanpackMemberPayload {
  name: string;
  stock: number;
  maxPerOrder: number;
  displayOrder: number;
  isActive: boolean;
}

export interface FanpackCampaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  packContent: string;
  unitPrice: number;
  completePackPrice: number | null;
  isActive: boolean;
  createdAt: string;
  members: FanpackMember[];
}

export interface FanpackCampaignPayload {
  name: string;
  slug: string;
  description: string | null;
  packContent: string;
  unitPrice: number;
  completePackPrice: number | null;
  isActive: boolean;
}

export interface FanpackOrderItem {
  id: string;
  orderId: string;
  memberId: string | null;
  memberName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  isCompletePack: boolean;
}

export interface FanpackOrder {
  id: string;
  campaignId: string;
  campaignName: string;
  customerEmail: string;
  customerFullName: string;
  socialPlatform: FanpackSocialPlatform;
  socialUsername: string;
  recoveryMethod: FanpackRecoveryMethod;
  postalAddress: string | null;
  proofPath: string;
  totalAmount: number;
  status: FanpackOrderStatus;
  createdAt: string;
  items: FanpackOrderItem[];
}

export interface FanpackOrderPayload {
  campaignId: string;
  customerEmail: string;
  customerFullName: string;
  socialPlatform: FanpackSocialPlatform;
  socialUsername: string;
  recoveryMethod: FanpackRecoveryMethod;
  postalAddress: string | null;
  proofPath: string;
  completePackQuantity: number;
  memberQuantities: { memberId: string; quantity: number }[];
}
