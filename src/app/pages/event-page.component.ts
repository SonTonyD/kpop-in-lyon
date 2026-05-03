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

  protected eventBackgroundImage(event: EventInfo): string {
    return buildEventBackground(event.dominantColor);
  }

  protected eventHaloColor(event: EventInfo): string {
    return hexToRgba(normalizeHexColor(event.dominantColor), 0.34);
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

function buildEventBackground(dominantColor: string): string {
  const color = normalizeHexColor(dominantColor);
  const light = mixHexColors(color, '#ffffff', 0.42);
  const deep = mixHexColors(color, '#1e2d3a', 0.34);

  return [
    `radial-gradient(circle at 14% 22%, ${hexToRgba(light, 0.52)}, transparent 34%)`,
    `radial-gradient(circle at 82% 18%, ${hexToRgba(color, 0.34)}, transparent 30%)`,
    `radial-gradient(circle at 58% 82%, ${hexToRgba(deep, 0.18)}, transparent 42%)`,
    `linear-gradient(135deg, ${hexToRgba(light, 0.38)} 0%, ${hexToRgba(color, 0.22)} 42%, ${hexToRgba(deep, 0.14)} 100%)`,
    'linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(246, 248, 250, 0.88))',
  ].join(', ');
}

function normalizeHexColor(value: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#ff6ec7';
}

function mixHexColors(source: string, target: string, targetWeight: number): string {
  const sourceRgb = hexToRgb(source);
  const targetRgb = hexToRgb(target);
  const sourceWeight = 1 - targetWeight;

  return rgbToHex(
    Math.round(sourceRgb.red * sourceWeight + targetRgb.red * targetWeight),
    Math.round(sourceRgb.green * sourceWeight + targetRgb.green * targetWeight),
    Math.round(sourceRgb.blue * sourceWeight + targetRgb.blue * targetWeight),
  );
}

function hexToRgb(hex: string): { red: number; green: number; blue: number } {
  const normalized = hex.replace('#', '');

  return {
    red: parseInt(normalized.slice(0, 2), 16),
    green: parseInt(normalized.slice(2, 4), 16),
    blue: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const { red, green, blue } = hexToRgb(hex);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
