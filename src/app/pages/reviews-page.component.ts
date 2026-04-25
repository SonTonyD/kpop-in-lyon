import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ParticipantReview } from '../services/back-office.types';
import { ReviewsService } from '../services/reviews.service';

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reviews-page.component.html',
  styleUrl: './reviews-page.component.css',
})
export class ReviewsPageComponent implements OnInit {
  protected readonly reviews = signal<ParticipantReview[]>([]);
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal('');
  protected readonly submitError = signal('');
  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly commentMaxLength = 220;
  protected readonly reviewForm;

  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly formBuilder: FormBuilder,
  ) {
    this.reviewForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(32)]],
      event: ['', [Validators.required, Validators.maxLength(80)]],
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: [
        '',
        [Validators.required, Validators.minLength(10), Validators.maxLength(this.commentMaxLength)],
      ],
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      this.reviews.set(await this.reviewsService.getPublishedReviews());
    } catch {
      this.error.set('Les avis ne peuvent pas être chargés pour le moment.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async submitReview(): Promise<void> {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitted.set(false);
    this.submitError.set('');

    try {
      const value = this.reviewForm.getRawValue();
      await this.reviewsService.createReview({
        name: (value.name ?? '').trim(),
        event: (value.event ?? '').trim(),
        rating: Number(value.rating ?? 5),
        comment: (value.comment ?? '').trim(),
      });
      this.submitted.set(true);
      this.reviewForm.reset({ name: '', event: '', rating: 5, comment: '' });
    } catch {
      this.submitError.set('Ton avis n’a pas pu être envoyé. Réessaie dans quelques instants.');
    } finally {
      this.submitting.set(false);
    }
  }
}
