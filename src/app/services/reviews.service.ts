import { Injectable } from '@angular/core';
import { ParticipantReview } from './back-office.types';
import { SupabaseService } from './supabase.service';

interface ReviewRow {
  id: string;
  name: string;
  event: string;
  rating: number;
  comment: string;
  is_published: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getPublishedReviews(): Promise<ParticipantReview[]> {
    const { data, error } = await this.supabase.client
      .from('participant_reviews')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapReview);
  }

  async getAllReviews(): Promise<ParticipantReview[]> {
    const { data, error } = await this.supabase.client
      .from('participant_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapReview);
  }

  async setPublished(id: string, isPublished: boolean): Promise<void> {
    const { error } = await this.supabase.client
      .from('participant_reviews')
      .update({ is_published: isPublished })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}

function mapReview(row: ReviewRow): ParticipantReview {
  return {
    id: row.id,
    name: row.name,
    event: row.event,
    rating: row.rating,
    comment: row.comment,
    isPublished: row.is_published,
    createdAt: row.created_at,
  };
}
