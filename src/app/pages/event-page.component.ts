import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, effect, signal } from '@angular/core';
import { EventInfo } from '../data/site-content';
import { ActiveEventStoreService } from '../services/active-event-store.service';

@Component({
  selector: 'app-event-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-page.component.html',
  styleUrl: './event-page.component.css',
})
export class EventPageComponent implements OnInit, OnDestroy {
  protected readonly event = computed<EventInfo | null>(() => this.activeEventStore.event());
  protected readonly loading = computed(() => this.activeEventStore.loading());
  protected readonly countdown = signal([
    { value: '00', label: 'Jours' },
    { value: '00', label: 'Heures' },
    { value: '00', label: 'Min' },
    { value: '00', label: 'Sec' },
  ]);

  private countdownId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly activeEventStore: ActiveEventStoreService) {
    effect(() => {
      if (this.event()) {
        this.updateCountdown();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.activeEventStore.load();
    this.updateCountdown();
    this.countdownId = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownId) {
      clearInterval(this.countdownId);
    }
  }

  protected splitTitle(title: string): string[] {
    const words = title.trim().split(/\s+/);
    if (words.length <= 1) {
      return [title];
    }

    const middle = Math.ceil(words.length / 2);
    return [words.slice(0, middle).join(' '), words.slice(middle).join(' ')];
  }

  private updateCountdown(): void {
    const event = this.event();
    if (!event) {
      return;
    }

    const target = new Date(event.dateTime).getTime();
    const now = Date.now();
    const diff = Math.max(target - now, 0);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    this.countdown.set([
      { value: String(days).padStart(2, '0'), label: 'Jours' },
      { value: String(hours).padStart(2, '0'), label: 'Heures' },
      { value: String(minutes).padStart(2, '0'), label: 'Min' },
      { value: String(seconds).padStart(2, '0'), label: 'Sec' },
    ]);
  }
}
