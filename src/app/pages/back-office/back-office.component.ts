import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  EventRequest,
  EventRequestStatus,
  ManagedEvent,
  ManagedEventPayload,
  ParticipantReview,
} from '../../services/back-office.types';
import { AuthService } from '../../services/auth.service';
import { EventRequestsService } from '../../services/event-requests.service';
import { ActiveEventStoreService } from '../../services/active-event-store.service';
import { ManagedEventsService } from '../../services/managed-events.service';
import { ReviewsService } from '../../services/reviews.service';

type BackOfficeTab = 'managedEvents' | 'reviews' | 'requests';

@Component({
  selector: 'app-back-office',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './back-office.component.html',
  styleUrl: './back-office.component.css',
})
export class BackOfficeComponent implements OnInit {
  protected readonly activeTab = signal<BackOfficeTab>('managedEvents');
  protected readonly loading = signal(true);
  protected readonly savingId = signal('');
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly editingEventId = signal<string | null>(null);
  protected readonly managedEvents = signal<ManagedEvent[]>([]);
  protected readonly reviews = signal<ParticipantReview[]>([]);
  protected readonly requests = signal<EventRequest[]>([]);
  protected readonly eventForm;
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
    private readonly managedEventsService: ManagedEventsService,
    private readonly activeEventStore: ActiveEventStoreService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
  ) {
    this.eventForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.maxLength(80)]],
      description: ['', [Validators.required, Validators.maxLength(220)]],
      date: ['', Validators.required],
      time: ['', Validators.required],
      location: ['', [Validators.required, Validators.maxLength(80)]],
      country: ['France', [Validators.required, Validators.maxLength(80)]],
      format: ['', [Validators.required, Validators.maxLength(80)]],
      capacity: ['', [Validators.required, Validators.maxLength(80)]],
      image: ['assets/event-hero.svg', Validators.required],
    });
  }

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  protected async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    try {
      const [managedEvents, reviews, requests] = await Promise.all([
        this.managedEventsService.getEvents(),
        this.reviewsService.getAllReviews(),
        this.eventRequestsService.getRequests(),
      ]);
      this.managedEvents.set(managedEvents);
      this.reviews.set(reviews);
      this.requests.set(requests);
    } catch {
      this.error.set('Les données de l’espace gestion ne peuvent pas être chargées.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async saveManagedEvent(): Promise<void> {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    const payload = this.getManagedEventPayload();
    const editingId = this.editingEventId();
    this.savingId.set(editingId ?? 'new-event');
    this.error.set('');
    this.success.set('');

    try {
      if (editingId) {
        const updatedEvent = await this.managedEventsService.updateEvent(editingId, payload);
        this.managedEvents.update((events) =>
          events.map((event) => (event.id === editingId ? updatedEvent : event)),
        );
        this.success.set('L’évènement a bien été modifié.');
      } else {
        const createdEvent = await this.managedEventsService.createEvent(payload);
        this.managedEvents.update((events) => [createdEvent, ...events]);
        this.success.set('L’évènement a bien été créé.');
      }

      this.resetEventForm();
    } catch {
      this.error.set('L’évènement n’a pas pu être enregistré.');
    } finally {
      this.savingId.set('');
    }
  }

  protected editManagedEvent(event: ManagedEvent): void {
    const startsAt = new Date(event.startsAt);
    this.editingEventId.set(event.id);
    this.eventForm.reset({
      title: event.title,
      description: event.description,
      date: toDateInputValue(startsAt),
      time: toTimeInputValue(startsAt),
      location: event.location,
      country: event.country,
      format: event.format,
      capacity: event.capacity,
      image: event.image,
    });
    this.activeTab.set('managedEvents');
  }

  protected resetEventForm(): void {
    this.editingEventId.set(null);
    this.eventForm.reset({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      country: 'France',
      format: '',
      capacity: '',
      image: 'assets/event-hero.svg',
    });
  }

  protected async setActiveManagedEvent(event: ManagedEvent): Promise<void> {
    this.savingId.set(event.id);
    this.error.set('');
    this.success.set('');

    try {
      await this.managedEventsService.setActiveEvent(event.id);
      this.managedEvents.update((events) =>
        events.map((item) => ({ ...item, isActive: item.id === event.id })),
      );
      await this.activeEventStore.refresh();
      this.success.set('Cet évènement est maintenant affiché en première page.');
    } catch {
      this.error.set('Cet évènement n’a pas pu être défini comme évènement en cours.');
    } finally {
      this.savingId.set('');
    }
  }

  protected async deleteManagedEvent(event: ManagedEvent): Promise<void> {
    const confirmed = window.confirm(
      `Supprimer définitivement l’évènement ${event.title} ? Cette action est irréversible.`,
    );

    if (!confirmed) {
      return;
    }

    this.savingId.set(event.id);
    this.error.set('');
    this.success.set('');

    try {
      await this.managedEventsService.deleteEvent(event.id);
      this.managedEvents.update((events) => events.filter((item) => item.id !== event.id));
      if (this.editingEventId() === event.id) {
        this.resetEventForm();
      }
    } catch {
      this.error.set('Cet évènement n’a pas pu être supprimé.');
    } finally {
      this.savingId.set('');
    }
  }

  protected async togglePublished(review: ParticipantReview): Promise<void> {
    const nextValue = !review.isPublished;
    this.savingId.set(review.id);
    this.error.set('');
    this.success.set('');

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

  protected async deleteReview(review: ParticipantReview): Promise<void> {
    const confirmed = window.confirm(
      `Supprimer définitivement l’avis de ${review.name} ? Cette action est irréversible.`,
    );

    if (!confirmed) {
      return;
    }

    this.savingId.set(review.id);
    this.error.set('');
    this.success.set('');

    try {
      await this.reviewsService.deleteReview(review.id);
      this.reviews.update((reviews) => reviews.filter((item) => item.id !== review.id));
    } catch {
      this.error.set('Cet avis n’a pas pu être supprimé.');
    } finally {
      this.savingId.set('');
    }
  }

  protected async updateStatus(request: EventRequest, event: Event): Promise<void> {
    const status = (event.target as HTMLSelectElement).value as EventRequestStatus;
    this.savingId.set(request.id);
    this.error.set('');
    this.success.set('');

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

  protected async deleteRequest(request: EventRequest): Promise<void> {
    const confirmed = window.confirm(
      `Supprimer définitivement la demande pour ${request.artist} ? Cette action est irréversible.`,
    );

    if (!confirmed) {
      return;
    }

    this.savingId.set(request.id);
    this.error.set('');
    this.success.set('');

    try {
      await this.eventRequestsService.deleteRequest(request.id);
      this.requests.update((requests) => requests.filter((item) => item.id !== request.id));
    } catch {
      this.error.set('Cette demande d’évènement n’a pas pu être supprimée.');
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

  private getManagedEventPayload(): ManagedEventPayload {
    const value = this.eventForm.getRawValue();
    const startsAt = new Date(`${value.date}T${value.time}`);

    return {
      title: (value.title ?? '').trim(),
      description: (value.description ?? '').trim(),
      startsAt: startsAt.toISOString(),
      dateLabel: formatFrenchDate(startsAt),
      timeLabel: formatFrenchTime(startsAt),
      location: (value.location ?? '').trim(),
      country: (value.country ?? '').trim(),
      format: (value.format ?? '').trim(),
      capacity: (value.capacity ?? '').trim(),
      image: (value.image ?? '').trim(),
    };
  }
}

function formatFrenchDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatFrenchTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toTimeInputValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
