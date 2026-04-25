import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventInfo, pastEventImages, pastEventStats, upcomingEvent } from '../data/site-content';
import { ManagedEventsService, managedEventToEventInfo } from '../services/managed-events.service';

interface HomeSlide {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  image: string;
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
  protected readonly event = signal<EventInfo>(upcomingEvent);
  protected readonly currentSlide = signal(0);
  protected readonly slides = computed<HomeSlide[]>(() => [
    {
      eyebrow: 'EV-01 - ÉVÈNEMENT ACTUEL',
      title: this.event().title,
      description: this.event().description,
      actionLabel: 'Voir l’évènement',
      actionLink: '/event',
      image: this.event().image,
      kind: 'upcoming',
    },
    {
      eyebrow: 'Évènements passés',
      title: 'Évènements passés',
      description: 'Merci pour tous les moments partagés avec la communauté.',
      image: pastEventImages[0],
      kind: 'past',
    },
  ]);

  private touchStartX: number | null = null;
  private touchCurrentX: number | null = null;
  private touchStartY: number | null = null;
  private touchCurrentY: number | null = null;

  constructor(private readonly managedEventsService: ManagedEventsService) {}

  async ngOnInit(): Promise<void> {
    try {
      const activeEvent = await this.managedEventsService.getActiveEvent();
      if (activeEvent) {
        this.event.set(managedEventToEventInfo(activeEvent));
      }
    } catch {
      this.event.set(upcomingEvent);
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

  protected goToSlide(index: number): void {
    this.currentSlide.set(index);
  }

  protected previousSlide(): void {
    this.currentSlide.update((value) => (value - 1 + this.slides().length) % this.slides().length);
  }

  protected nextSlide(): void {
    this.currentSlide.update((value) => (value + 1) % this.slides().length);
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
