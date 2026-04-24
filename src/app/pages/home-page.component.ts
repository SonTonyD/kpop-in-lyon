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
    this.touchCurrentX = this.touchStartX;
  }

  protected handleTouchMove(event: TouchEvent): void {
    this.touchCurrentX = event.touches[0]?.clientX ?? this.touchCurrentX;
  }

  protected handleTouchEnd(): void {
    if (this.touchStartX === null || this.touchCurrentX === null) {
      this.resetTouch();
      return;
    }

    const deltaX = this.touchCurrentX - this.touchStartX;
    const swipeThreshold = 45;

    if (Math.abs(deltaX) >= swipeThreshold) {
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
  }
}
