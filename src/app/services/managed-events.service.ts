import { Injectable } from '@angular/core';
import { EventInfo } from '../data/site-content';
import { ManagedEvent, ManagedEventPayload } from './back-office.types';
import { SupabaseService } from './supabase.service';

export const DEFAULT_EVENT_DOMINANT_COLOR = '#ff6ec7';
const EVENT_POSTERS_BUCKET = 'event-posters';

interface ManagedEventRow {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  date_label: string;
  time_label: string;
  location: string;
  country: string;
  format: string;
  capacity: string;
  image: string;
  image_path: string | null;
  dominant_color: string | null;
  is_active: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ManagedEventsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getActiveEvent(): Promise<ManagedEvent | null> {
    const { data, error } = await this.supabase.client
      .from('managed_events')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapManagedEvent(data) : null;
  }

  async getEvents(): Promise<ManagedEvent[]> {
    const { data, error } = await this.supabase.client
      .from('managed_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapManagedEvent);
  }

  async createEvent(payload: ManagedEventPayload): Promise<ManagedEvent> {
    const { data, error } = await this.supabase.client
      .from('managed_events')
      .insert(toRowPayload(payload))
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapManagedEvent(data);
  }

  async updateEvent(id: string, payload: ManagedEventPayload): Promise<ManagedEvent> {
    const { data, error } = await this.supabase.client
      .from('managed_events')
      .update(toRowPayload(payload))
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapManagedEvent(data);
  }

  async uploadPoster(file: File, eventId: string): Promise<{ image: string; imagePath: string }> {
    const imagePath = `${eventId}/${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await this.supabase.client.storage
      .from(EVENT_POSTERS_BUCKET)
      .upload(imagePath, file, {
        cacheControl: '31536000',
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data } = this.supabase.client.storage
      .from(EVENT_POSTERS_BUCKET)
      .getPublicUrl(imagePath);

    return {
      image: data.publicUrl,
      imagePath,
    };
  }

  async setActiveEvent(id: string): Promise<void> {
    const { error: resetError } = await this.supabase.client
      .from('managed_events')
      .update({ is_active: false })
      .neq('id', id);

    if (resetError) {
      throw resetError;
    }

    const { error } = await this.supabase.client
      .from('managed_events')
      .update({ is_active: true })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  async deleteEvent(event: Pick<ManagedEvent, 'id' | 'imagePath'> | string): Promise<void> {
    const id = typeof event === 'string' ? event : event.id;
    const imagePath = typeof event === 'string' ? null : event.imagePath;
    const { error } = await this.supabase.client.from('managed_events').delete().eq('id', id);

    if (error) {
      throw error;
    }

    if (imagePath) {
      await this.deletePoster(imagePath);
    }
  }

  async deletePoster(imagePath: string): Promise<void> {
    const { error } = await this.supabase.client.storage
      .from(EVENT_POSTERS_BUCKET)
      .remove([imagePath]);

    if (error) {
      console.warn('Event poster could not be deleted from storage.', error);
    }
  }
}

export function managedEventToEventInfo(event: ManagedEvent): EventInfo {
  return {
    title: event.title,
    date: event.dateLabel,
    dateTime: event.startsAt,
    time: event.timeLabel,
    location: event.location,
    venueNote: event.country,
    format: event.format,
    capacity: event.capacity,
    description: event.description,
    image: event.image,
    dominantColor: event.dominantColor,
  };
}

function toRowPayload(payload: ManagedEventPayload): Omit<ManagedEventRow, 'id' | 'is_active' | 'created_at'> {
  return {
    title: payload.title,
    description: payload.description,
    starts_at: payload.startsAt,
    date_label: payload.dateLabel,
    time_label: payload.timeLabel,
    location: payload.location,
    country: payload.country,
    format: payload.format,
    capacity: payload.capacity,
    image: payload.image,
    image_path: payload.imagePath,
    dominant_color: payload.dominantColor,
  };
}

export function mapManagedEvent(row: ManagedEventRow): ManagedEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    dateLabel: row.date_label,
    timeLabel: row.time_label,
    location: row.location,
    country: row.country,
    format: row.format,
    capacity: row.capacity,
    image: row.image,
    imagePath: row.image_path ?? null,
    dominantColor: row.dominant_color ?? DEFAULT_EVENT_DOMINANT_COLOR,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function safeFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const baseName = fileName
    .replace(/\.[^/.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${baseName || 'poster'}.${extension}`;
}
