import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  EventRequest,
  EventRequestStatus,
  ParticipantReview,
} from '../../services/back-office.types';
import { AuthService } from '../../services/auth.service';
import { EventRequestsService } from '../../services/event-requests.service';
import { ReviewsService } from '../../services/reviews.service';

type BackOfficeTab = 'reviews' | 'requests';

@Component({
  selector: 'app-back-office',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './back-office.component.html',
  styleUrl: './back-office.component.css',
})
export class BackOfficeComponent implements OnInit {
  protected readonly activeTab = signal<BackOfficeTab>('reviews');
  protected readonly loading = signal(true);
  protected readonly savingId = signal('');
  protected readonly error = signal('');
  protected readonly reviews = signal<ParticipantReview[]>([]);
  protected readonly requests = signal<EventRequest[]>([]);
  protected readonly statuses: { value: EventRequestStatus; label: string }[] = [
    { value: 'new', label: 'Nouveau' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'done', label: 'Traité' },
    { value: 'rejected', label: 'Refusé' },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly reviewsService: ReviewsService,
    private readonly eventRequestsService: EventRequestsService,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  protected async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const [reviews, requests] = await Promise.all([
        this.reviewsService.getAllReviews(),
        this.eventRequestsService.getRequests(),
      ]);
      this.reviews.set(reviews);
      this.requests.set(requests);
    } catch {
      this.error.set('Les données du back-office ne peuvent pas être chargées.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async togglePublished(review: ParticipantReview): Promise<void> {
    const nextValue = !review.isPublished;
    this.savingId.set(review.id);
    this.error.set('');

    try {
      await this.reviewsService.setPublished(review.id, nextValue);
      this.reviews.update((reviews) =>
        reviews.map((item) =>
          item.id === review.id ? { ...item, isPublished: nextValue } : item,
        ),
      );
    } catch {
      this.error.set('La publication de cet avis n’a pas pu être modifiée.');
    } finally {
      this.savingId.set('');
    }
  }

  protected async updateStatus(request: EventRequest, event: Event): Promise<void> {
    const status = (event.target as HTMLSelectElement).value as EventRequestStatus;
    this.savingId.set(request.id);
    this.error.set('');

    try {
      await this.eventRequestsService.updateStatus(request.id, status);
      this.requests.update((requests) =>
        requests.map((item) => (item.id === request.id ? { ...item, status } : item)),
      );
    } catch {
      this.error.set('Le statut de cette demande n’a pas pu être modifié.');
    } finally {
      this.savingId.set('');
    }
  }

  protected statusLabel(status: EventRequestStatus): string {
    return this.statuses.find((item) => item.value === status)?.label ?? status;
  }

  protected async signOut(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigateByUrl('/back-office/login');
  }
}
