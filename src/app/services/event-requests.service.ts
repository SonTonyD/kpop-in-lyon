import { Injectable } from '@angular/core';
import { EventRequest, EventRequestPayload, EventRequestStatus } from './back-office.types';
import { SupabaseService } from './supabase.service';

interface EventRequestRow {
  id: string;
  full_name: string;
  fanbase_name: string;
  email: string;
  social_links: string | null;
  artist: string;
  city: string;
  period: string;
  collaboration_types: string[];
  decoration_types: string[];
  details: string;
  status: EventRequestStatus;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class EventRequestsService {
  constructor(private readonly supabase: SupabaseService) {}

  async createRequest(payload: EventRequestPayload): Promise<void> {
    const { error } = await this.supabase.client.from('event_requests').insert({
      full_name: payload.fullName,
      fanbase_name: payload.fanbaseName,
      email: payload.email,
      social_links: payload.socialLinks,
      artist: payload.artist,
      city: payload.city,
      period: payload.period,
      collaboration_types: payload.collaborationTypes,
      decoration_types: payload.decorationTypes,
      details: payload.details,
      status: 'new',
    });

    if (error) {
      throw error;
    }
  }

  async getRequests(): Promise<EventRequest[]> {
    const { data, error } = await this.supabase.client
      .from('event_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapEventRequest);
  }

  async updateStatus(id: string, status: EventRequestStatus): Promise<void> {
    const { error } = await this.supabase.client
      .from('event_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}

function mapEventRequest(row: EventRequestRow): EventRequest {
  return {
    id: row.id,
    fullName: row.full_name,
    fanbaseName: row.fanbase_name,
    email: row.email,
    socialLinks: row.social_links,
    artist: row.artist,
    city: row.city,
    period: row.period,
    collaborationTypes: row.collaboration_types ?? [],
    decorationTypes: row.decoration_types ?? [],
    details: row.details,
    status: row.status,
    createdAt: row.created_at,
  };
}
