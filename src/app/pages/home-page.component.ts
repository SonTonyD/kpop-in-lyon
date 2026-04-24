import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { pastEventImages, pastEventStats, upcomingEvent } from '../data/site-content';

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
export class HomePageComponent {
  protected readonly pastEventImages = pastEventImages;
  protected readonly pastEventStats = pastEventStats;
  protected readonly event = upcomingEvent;
  protected readonly currentSlide = signal(0);
  private touchStartX: number | null = null;
  private touchCurrentX: number | null = null;
  private touchStartY: number | null = null;
  private touchCurrentY: number | null = null;

  protected readonly slides: HomeSlide[] = [
    {
      eyebrow: 'EV-01 — ÉVÉNEMENT ACTUEL',
      title: upcomingEvent.title,
      description: upcomingEvent.description,
      actionLabel: 'Voir l’événement',
      actionLink: '/event',
      image: upcomingEvent.image,
      kind: 'upcoming',
    },
    {
      eyebrow: 'Past Events',
      title: 'Past Events',
      description: 'Thank you for all the amazing moments shared together.',
      image: pastEventImages[0],
      kind: 'past',
    },
  ];

  protected goToSlide(index: number): void {
    this.currentSlide.set(index);
  }

  protected previousSlide(): void {
    this.currentSlide.update((value) => (value - 1 + this.slides.length) % this.slides.length);
  }

  protected nextSlide(): void {
    this.currentSlide.update((value) => (value + 1) % this.slides.length);
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
