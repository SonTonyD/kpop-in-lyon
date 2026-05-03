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
      return `linear-gradient(180deg, rgba(6, 7, 18, 0.45), rgba(6, 7, 18, 0.88)), url(${slide.image})`;
    }

    return buildEventBackground(slide.dominantColor);
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
  const color = /^#[0-9a-f]{6}$/i.test(dominantColor) ? dominantColor : '#ff6ec7';

  return [
    `radial-gradient(circle at 18% 24%, ${hexToRgba(color, 0.58)}, transparent 32%)`,
    `radial-gradient(circle at 78% 18%, ${hexToRgba(color, 0.34)}, transparent 24%)`,
    `linear-gradient(135deg, ${hexToRgba(color, 0.34)}, rgba(6, 7, 18, 0.92) 46%)`,
    'linear-gradient(180deg, rgba(6, 7, 18, 0.72), rgba(6, 7, 18, 0.94))',
  ].join(', ');
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
