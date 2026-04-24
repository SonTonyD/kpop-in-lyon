import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { upcomingEvent } from '../data/site-content';

@Component({
  selector: 'app-event-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-page.component.html',
  styleUrl: './event-page.component.css',
})
export class EventPageComponent implements OnInit, OnDestroy {
  protected readonly event = upcomingEvent;
  protected readonly countdown = signal([
    { value: '00', label: 'Days' },
    { value: '00', label: 'Hrs' },
    { value: '00', label: 'Min' },
    { value: '00', label: 'Sec' },
  ]);

  private countdownId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateCountdown();
    this.countdownId = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownId) {
      clearInterval(this.countdownId);
    }
  }

  private updateCountdown(): void {
    const target = new Date(this.event.dateTime).getTime();
    const now = Date.now();
    const diff = Math.max(target - now, 0);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    this.countdown.set([
      { value: String(days).padStart(2, '0'), label: 'Days' },
      { value: String(hours).padStart(2, '0'), label: 'Hrs' },
      { value: String(minutes).padStart(2, '0'), label: 'Min' },
      { value: String(seconds).padStart(2, '0'), label: 'Sec' },
    ]);
  }
}
