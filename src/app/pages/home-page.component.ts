import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventInfo, pastEventImages, pastEventStats } from '../data/site-content';
import { ActiveEventStoreService } from '../services/active-event-store.service';

interface HomeSlide {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  image: string;
  dominantColor: string;
  kind: 'upcoming' | 'past';
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent implements OnInit {
  protected readonly pastEventImages = pastEventImages;
  protected readonly pastEventStats = pastEventStats;
  protected readonly event = computed<EventInfo | null>(() => this.activeEventStore.event());
  protected readonly loading = computed(() => this.activeEventStore.loading());
  protected readonly currentSlide = signal(0);
  protected readonly slides = computed<HomeSlide[]>(() => [
    {
      eyebrow: 'EV-01 - ÉVÈNEMENT ACTUEL',
      title: this.event()?.title ?? '',
      description: this.event()?.description ?? '',
      actionLabel: 'Voir l’évènement',
      actionLink: '/event',
      image: this.event()?.image ?? 'assets/event-hero.svg',
      dominantColor: this.event()?.dominantColor ?? '#ff6ec7',
      kind: 'upcoming',
    },
    {
      eyebrow: 'Évènements passés',
      title: 'Évènements passés',
      description: 'Merci pour tous les moments partagés avec la communauté.',
      image: pastEventImages[0],
      dominantColor: '#ff6ec7',
      kind: 'past',
    },
  ]);

  private touchStartX: number | null = null;
  private touchCurrentX: number | null = null;
  private touchStartY: number | null = null;
  private touchCurrentY: number | null = null;

  constructor(private readonly activeEventStore: ActiveEventStoreService) {}

  async ngOnInit(): Promise<void> {
    await this.activeEventStore.load();
  }

  protected splitTitle(title: string): string[] {
    const words = title.trim().split(/\s+/);
    if (words.length <= 1) {
      return [title];
    }

    const middle = Math.ceil(words.length / 2);
    return [words.slice(0, middle).join(' '), words.slice(middle).join(' ')];
  }

  protected goToSlide(index: number): void {
    this.currentSlide.set(index);
  }

  protected previousSlide(): void {
    this.currentSlide.update((value) => (value - 1 + this.slides().length) % this.slides().length);
  }

  protected nextSlide(): void {
    this.currentSlide.update((value) => (value + 1) % this.slides().length);
  }

  protected slideBackgroundImage(slide: HomeSlide): string {
    if (slide.kind === 'past') {
      return `linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(246, 248, 250, 0.9)), url(${slide.image})`;
    }

    return buildEventBackground(slide.dominantColor);
  }

  protected slideHaloColor(slide: HomeSlide): string {
    return hexToRgba(normalizeHexColor(slide.dominantColor), 0.34);
  }

  protected handleTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0]?.clientX ?? null;
    this.touchStartY = event.touches[0]?.clientY ?? null;
    this.touchCurrentX = this.touchStartX;
    this.touchCurrentY = this.touchStartY;
  }

  protected handleTouchMove(event: TouchEvent): void {
    this.touchCurrentX = event.touches[0]?.clientX ?? this.touchCurrentX;
    this.touchCurrentY = event.touches[0]?.clientY ?? this.touchCurrentY;
  }

  protected handleTouchEnd(): void {
    if (
      this.touchStartX === null ||
      this.touchCurrentX === null ||
      this.touchStartY === null ||
      this.touchCurrentY === null
    ) {
      this.resetTouch();
      return;
    }

    const deltaX = this.touchCurrentX - this.touchStartX;
    const deltaY = this.touchCurrentY - this.touchStartY;
    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);
    const swipeThreshold = 70;
    const horizontalDominanceRatio = 1.35;

    if (
      horizontalDistance >= swipeThreshold &&
      horizontalDistance > verticalDistance * horizontalDominanceRatio
    ) {
      if (deltaX < 0) {
        this.nextSlide();
      } else {
        this.previousSlide();
      }
    }

    this.resetTouch();
  }

  private resetTouch(): void {
    this.touchStartX = null;
    this.touchCurrentX = null;
    this.touchStartY = null;
    this.touchCurrentY = null;
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
