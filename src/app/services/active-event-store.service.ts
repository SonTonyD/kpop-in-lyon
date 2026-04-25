import { Injectable, signal } from '@angular/core';
import { EventInfo } from '../data/site-content';
import { ManagedEventsService, managedEventToEventInfo } from './managed-events.service';

@Injectable({ providedIn: 'root' })
export class ActiveEventStoreService {
  readonly event = signal<EventInfo | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  private loadPromise: Promise<void> | null = null;

  constructor(private readonly managedEventsService: ManagedEventsService) {}

  load(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.refresh();
    }

    return this.loadPromise;
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const activeEvent = await this.managedEventsService.getActiveEvent();
      this.event.set(activeEvent ? managedEventToEventInfo(activeEvent) : null);
    } catch {
      this.error.set('L’évènement en cours ne peut pas être chargé.');
      this.event.set(null);
    } finally {
      this.loading.set(false);
      this.loadPromise = null;
    }
  }
}
