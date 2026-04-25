import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ParticipantReview } from '../services/back-office.types';
import { ReviewsService } from '../services/reviews.service';

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews-page.component.html',
  styleUrl: './reviews-page.component.css',
})
export class ReviewsPageComponent implements OnInit {
  protected readonly reviews = signal<ParticipantReview[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly stars = [1, 2, 3, 4, 5];

  constructor(private readonly reviewsService: ReviewsService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.reviews.set(await this.reviewsService.getPublishedReviews());
    } catch {
      this.error.set('Les avis ne peuvent pas être chargés pour le moment.');
    } finally {
      this.loading.set(false);
    }
  }
}
