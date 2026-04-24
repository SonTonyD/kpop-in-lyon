import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { upcomingEvent } from '../data/site-content';

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
export class HomePageComponent implements OnInit, OnDestroy {
  protected readonly event = upcomingEvent;
  protected readonly currentSlide = signal(0);

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
  ];

  private autoplayId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.autoplayId = setInterval(() => {
      this.currentSlide.update((value) => (value + 1) % this.slides.length);
    }, 6000);
  }

  ngOnDestroy(): void {
    if (this.autoplayId) {
      clearInterval(this.autoplayId);
    }
  }

  protected goToSlide(index: number): void {
    this.currentSlide.set(index);
  }

  protected previousSlide(): void {
    this.currentSlide.update((value) => (value - 1 + this.slides.length) % this.slides.length);
  }

  protected nextSlide(): void {
    this.currentSlide.update((value) => (value + 1) % this.slides.length);
  }
}
