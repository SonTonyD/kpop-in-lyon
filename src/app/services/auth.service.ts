import { Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session = signal<Session | null>(null);
  readonly loading = signal(true);

  constructor(private readonly supabase: SupabaseService) {
    this.loadSession();
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      this.loading.set(false);
    });
  }

  async loadSession(): Promise<Session | null> {
    this.loading.set(true);
    const { data, error } = await this.supabase.client.auth.getSession();
    this.loading.set(false);

    if (error) {
      throw error;
    }

    this.session.set(data.session);
    return data.session;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.client.auth.signOut();

    if (error) {
      throw error;
    }

    this.session.set(null);
  }
}
