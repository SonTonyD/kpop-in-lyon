import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { pastEventImages, pastEventStats, upcomingEvent } from '../data/site-content';

interface HomeSlide {
  eyebrow: string;
  title: string;
  subtitle?: string;
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
  protected readonly pastEventImages = pastEventImages;
  protected readonly pastEventStats = pastEventStats;
  protected readonly currentSlide = signal(0);

  protected readonly slides: HomeSlide[] = [
    {
      eyebrow: 'Upcoming Event',
      title: upcomingEvent.title,
      subtitle: `${upcomingEvent.date} • ${upcomingEvent.location}`,
      description: 'Fan event dedicated to SEVENTEEN',
      actionLabel: 'Join Event',
      actionLink: '/event',
      image: upcomingEvent.image,
      kind: 'upcoming',
    },
    {
      eyebrow: 'Past Events',
      title: 'Thank you for all the amazing moments shared together.',
      description:
        'A collection of immersive fan projects, memorable decorations and warm community energy.',
      image: pastEventImages[0],
      kind: 'past',
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
