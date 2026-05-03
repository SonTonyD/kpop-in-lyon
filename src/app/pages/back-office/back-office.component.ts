import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  EventRequest,
  EventRequestStatus,
  FanpackCampaign,
  FanpackCampaignPayload,
  FanpackMember,
  FanpackMemberPayload,
  FanpackOrder,
  FanpackOrderStatus,
  ManagedEvent,
  ManagedEventPayload,
  ParticipantReview,
} from '../../services/back-office.types';
import { AuthService } from '../../services/auth.service';
import { EventRequestsService } from '../../services/event-requests.service';
import { ActiveEventStoreService } from '../../services/active-event-store.service';
import { FanpacksService } from '../../services/fanpacks.service';
import { ManagedEventsService } from '../../services/managed-events.service';
import { ReviewsService } from '../../services/reviews.service';

type BackOfficeTab = 'managedEvents' | 'fanpacks' | 'fanpackOrders' | 'reviews' | 'requests';

@Component({
  selector: 'app-back-office',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './back-office.component.html',
  styleUrl: './back-office.component.css',
})
export class BackOfficeComponent implements OnInit, OnDestroy {
  protected readonly activeTab = signal<BackOfficeTab>('managedEvents');
  protected readonly loading = signal(true);
  protected readonly savingId = signal('');
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly editingEventId = signal<string | null>(null);
  protected readonly editingFanpackId = signal<string | null>(null);
  protected readonly editingMemberId = signal<string | null>(null);
  protected readonly selectedFanpackId = signal<string | null>(null);
  protected readonly posterPreview = signal('assets/event-hero.svg');
  protected readonly selectedPosterName = signal('');
  protected readonly managedEvents = signal<ManagedEvent[]>([]);
  protected readonly fanpackCampaigns = signal<FanpackCampaign[]>([]);
  protected readonly fanpackOrders = signal<FanpackOrder[]>([]);
  protected readonly reviews = signal<ParticipantReview[]>([]);
  protected readonly requests = signal<EventRequest[]>([]);
  protected readonly eventForm;
  protected readonly fanpackForm;
  protected readonly fanpackMemberForm;
  protected readonly statuses: { value: EventRequestStatus; label: string }[] = [
    { value: 'new', label: 'Nouveau' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'done', label: 'Traite' },
    { value: 'rejected', label: 'Refuse' },
  ];
  protected readonly fanpackOrderStatuses: { value: FanpackOrderStatus; label: string }[] = [
    { value: 'proof_pending', label: 'Preuve a valider' },
    { value: 'processing', label: 'En cours de traitement' },
    { value: 'completed', label: 'Terminee' },
    { value: 'rejected', label: 'Refusee' },
    { value: 'cancelled', label: 'Annulee' },
  ];

  private selectedPosterFile: File | null = null;
  private objectPreviewUrl: string | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly reviewsService: ReviewsService,
    private readonly eventRequestsService: EventRequestsService,
    private readonly managedEventsService: ManagedEventsService,
    private readonly fanpacksService: FanpacksService,
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
      imagePath: [null as string | null],
      dominantColor: ['#ff6ec7', Validators.required],
    });
    this.fanpackForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(90)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
      description: ['', Validators.maxLength(240)],
      packContent: ['', [Validators.required, Validators.maxLength(500)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      completePackPrice: [null as number | null, Validators.min(0)],
      isActive: [true],
    });
    this.fanpackMemberForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      maxPerOrder: [5, [Validators.required, Validators.min(1)]],
      displayOrder: [1, [Validators.required, Validators.min(1)]],
      isActive: [true],
    });
  }

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  ngOnDestroy(): void {
    this.revokeObjectPreview();
  }

  protected async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    try {
      const [managedEvents, fanpackCampaigns, fanpackOrders, reviews, requests] = await Promise.all([
        this.managedEventsService.getEvents(),
        this.fanpacksService.getCampaigns(),
        this.fanpacksService.getOrders(),
        this.reviewsService.getAllReviews(),
        this.eventRequestsService.getRequests(),
      ]);
      this.managedEvents.set(managedEvents);
      this.fanpackCampaigns.set(fanpackCampaigns);
      this.fanpackOrders.set(fanpackOrders);
      this.reviews.set(reviews);
      this.requests.set(requests);
      if (!this.selectedFanpackId() && fanpackCampaigns.length > 0) {
        this.selectedFanpackId.set(fanpackCampaigns[0].id);
      }
    } catch {
      this.error.set('Les donnees de l’espace gestion ne peuvent pas etre chargees.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async saveManagedEvent(): Promise<void> {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    let payload = this.getManagedEventPayload();
    const editingId = this.editingEventId();
    const previousEvent = editingId
      ? this.managedEvents().find((event) => event.id === editingId) ?? null
      : null;
    this.savingId.set(editingId ?? 'new-event');
    this.error.set('');
    this.success.set('');

    try {
      if (this.selectedPosterFile) {
        const uploadOwnerId = editingId ?? `new-event-${crypto.randomUUID()}`;
        const uploadedPoster = await this.managedEventsService.uploadPoster(
          this.selectedPosterFile,
          uploadOwnerId,
        );
        payload = { ...payload, image: uploadedPoster.image, imagePath: uploadedPoster.imagePath };
      }

      if (editingId) {
        const updatedEvent = await this.managedEventsService.updateEvent(editingId, payload);
        this.managedEvents.update((events) =>
          events.map((event) => (event.id === editingId ? updatedEvent : event)),
        );
        if (
          this.selectedPosterFile &&
          previousEvent?.imagePath &&
          previousEvent.imagePath !== updatedEvent.imagePath
        ) {
          await this.managedEventsService.deletePoster(previousEvent.imagePath);
        }
        this.success.set('L’evenement a bien ete modifie.');
      } else {
        const createdEvent = await this.managedEventsService.createEvent(payload);
        this.managedEvents.update((events) => [createdEvent, ...events]);
        this.success.set('L’evenement a bien ete cree.');
      }

      this.resetEventForm();
    } catch {
      this.error.set('L’evenement n’a pas pu etre enregistre.');
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
      imagePath: event.imagePath,
      dominantColor: event.dominantColor,
    });
    this.clearSelectedPoster(event.image);
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
      imagePath: null,
      dominantColor: '#ff6ec7',
    });
    this.clearSelectedPoster('assets/event-hero.svg');
  }

  protected async onPosterSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.error.set('Le fichier selectionne doit etre une image.');
      input.value = '';
      return;
    }

    this.revokeObjectPreview();
    this.selectedPosterFile = file;
    this.selectedPosterName.set(file.name);
    this.objectPreviewUrl = URL.createObjectURL(file);
    this.posterPreview.set(this.objectPreviewUrl);
    this.eventForm.patchValue({ image: this.objectPreviewUrl });

    try {
      const dominantColor = await extractDominantColor(this.objectPreviewUrl);
      this.eventForm.patchValue({ dominantColor });
    } catch {
      this.eventForm.patchValue({ dominantColor: '#ff6ec7' });
    }
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
      this.success.set('Cet evenement est maintenant affiche en premiere page.');
    } catch {
      this.error.set('Cet evenement n’a pas pu etre defini comme evenement en cours.');
    } finally {
      this.savingId.set('');
    }
  }

  protected async deleteManagedEvent(event: ManagedEvent): Promise<void> {
    const confirmed = window.confirm(
      `Supprimer definitivement l’evenement ${event.title} ? Cette action est irreversible.`,
    );

    if (!confirmed) {
      return;
    }

    this.savingId.set(event.id);
    this.error.set('');
    this.success.set('');

    try {
      await this.managedEventsService.deleteEvent(event);
      this.managedEvents.update((events) => events.filter((item) => item.id !== event.id));
      if (this.editingEventId() === event.id) {
        this.resetEventForm();
      }
    } catch {
      this.error.set('Cet evenement n’a pas pu etre supprime.');
    } finally {
      this.savingId.set('');
    }
  }

  protected selectedFanpack(): FanpackCampaign | null {
    const selectedId = this.selectedFanpackId();

    return this.fanpackCampaigns().find((campaign) => campaign.id === selectedId) ?? null;
  }

  protected async saveFanpackCampaign(): Promise<void> {
    if (this.fanpackForm.invalid) {
      this.fanpackForm.markAllAsTouched();
      return;
    }

    const editingId = this.editingFanpackId();
    this.savingId.set(editingId ?? 'new-fanpack');
    this.error.set('');
    this.success.set('');

    try {
      const payload = this.getFanpackCampaignPayload();
      const saved = editingId
        ? await this.fanpacksService.updateCampaign(editingId, payload)
        : await this.fanpacksService.createCampaign(payload);

      this.fanpackCampaigns.update((campaigns) =>
        editingId
          ? campaigns.map((campaign) => (campaign.id === editingId ? saved : campaign))
          : [saved, ...campaigns],
      );
      this.selectedFanpackId.set(saved.id);
      this.resetFanpackForm();
      this.success.set(editingId ? 'Le fanpack a bien ete modifie.' : 'Le fanpack a bien ete cree.');
    } catch {
      this.error.set('Le fanpack n’a pas pu etre enregistre.');
    } finally {
      this.savingId.set('');
    }
  }

  protected editFanpackCampaign(campaign: FanpackCampaign): void {
    this.editingFanpackId.set(campaign.id);
    this.selectedFanpackId.set(campaign.id);
    this.fanpackForm.reset({
      name: campaign.name,
      slug: campaign.slug,
      description: campaign.description ?? '',
      packContent: campaign.packContent,
      unitPrice: campaign.unitPrice,
      completePackPrice: campaign.completePackPrice,
      isActive: campaign.isActive,
    });
    this.resetFanpackMemberForm();
  }

  protected resetFanpackForm(): void {
    this.editingFanpackId.set(null);
    this.fanpackForm.reset({
      name: '',
      slug: '',
      description: '',
      packContent: '',
      unitPrice: 0,
      completePackPrice: null,
      isActive: true,
    });
  }

  protected async deleteFanpackCampaign(campaign: FanpackCampaign): Promise<void> {
    const confirmed = window.confirm(
      `Supprimer definitivement le fanpack ${campaign.name} et ses commandes ?`,
    );

    if (!confirmed) {
      return;
    }

    this.savingId.set(campaign.id);
    this.error.set('');
    this.success.set('');

    try {
      await this.fanpacksService.deleteCampaign(campaign.id);
      this.fanpackCampaigns.update((campaigns) =>
        campaigns.filter((item) => item.id !== campaign.id),
      );
      this.selectedFanpackId.set(this.fanpackCampaigns()[0]?.id ?? null);
      this.success.set('Le fanpack a ete supprime.');
    } catch {
      this.error.set('Le fanpack n’a pas pu etre supprime.');
    } finally {
      this.savingId.set('');
    }
  }

  protected async saveFanpackMember(): Promise<void> {
    const campaign = this.selectedFanpack();

    if (!campaign || this.fanpackMemberForm.invalid) {
      this.fanpackMemberForm.markAllAsTouched();
      return;
    }

    const editingId = this.editingMemberId();
    this.savingId.set(editingId ?? 'new-fanpack-member');
    this.error.set('');
    this.success.set('');

    try {
      const payload = this.getFanpackMemberPayload();
      const saved = editingId
        ? await this.fanpacksService.updateMember(editingId, payload)
        : await this.fanpacksService.createMember(campaign.id, payload);

      this.fanpackCampaigns.update((campaigns) =>
        campaigns.map((item) =>
          item.id === campaign.id
            ? {
                ...item,
                members: replaceOrAppendMember(item.members, saved).sort(
                  (a, b) => a.displayOrder - b.displayOrder,
                ),
              }
            : item,
        ),
      );
      this.resetFanpackMemberForm();
      this.success.set(editingId ? 'Le membre a bien ete modifie.' : 'Le membre a bien ete ajoute.');
    } catch {
      this.error.set('Le membre n’a pas pu etre enregistre.');
    } finally {
      this.savingId.set('');
    }
  }

  protected editFanpackMember(member: FanpackMember): void {
    this.editingMemberId.set(member.id);
    this.selectedFanpackId.set(member.campaignId);
    this.fanpackMemberForm.reset({
      name: member.name,
      stock: member.stock,
      maxPerOrder: member.maxPerOrder,
      displayOrder: member.displayOrder,
      isActive: member.isActive,
    });
  }

  protected resetFanpackMemberForm(): void {
    this.editingMemberId.set(null);
    this.fanpackMemberForm.reset({
      name: '',
      stock: 0,
      maxPerOrder: 5,
      displayOrder: (this.selectedFanpack()?.members.length ?? 0) + 1,
      isActive: true,
    });
  }

  protected async deleteFanpackMember(member: FanpackMember): Promise<void> {
    const confirmed = window.confirm(`Supprimer ${member.name} de ce fanpack ?`);

    if (!confirmed) {
      return;
    }

    this.savingId.set(member.id);
    this.error.set('');
    this.success.set('');

    try {
      await this.fanpacksService.deleteMember(member.id);
      this.fanpackCampaigns.update((campaigns) =>
        campaigns.map((campaign) =>
          campaign.id === member.campaignId
            ? { ...campaign, members: campaign.members.filter((item) => item.id !== member.id) }
            : campaign,
        ),
      );
      this.success.set('Le membre a ete supprime.');
    } catch {
      this.error.set('Le membre n’a pas pu etre supprime.');
    } finally {
      this.savingId.set('');
    }
  }

  protected async openFanpackProof(order: FanpackOrder): Promise<void> {
    this.savingId.set(`proof-${order.id}`);
    this.error.set('');

    try {
      const signedUrl = await this.fanpacksService.createProofSignedUrl(order.proofPath);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch {
      this.error.set('La preuve de paiement ne peut pas etre ouverte.');
    } finally {
      this.savingId.set('');
    }
  }

  protected async updateFanpackOrderStatus(order: FanpackOrder, event: Event): Promise<void> {
    const status = (event.target as HTMLSelectElement).value as FanpackOrderStatus;
    this.savingId.set(order.id);
    this.error.set('');
    this.success.set('');

    try {
      const result = await this.fanpacksService.updateOrderStatus(order, status);
      this.fanpackOrders.update((orders) =>
        orders.map((item) => (item.id === order.id ? { ...item, status } : item)),
      );
      if (status === 'processing' && !result.emailSent) {
        this.error.set(
          `Le statut est passe en traitement, mais l’email n’a pas ete envoye. ${result.emailError ?? ''}`.trim(),
        );
      } else {
        this.success.set(
          status === 'processing'
            ? 'La commande est en traitement et Resend a confirme la creation de l’email.'
            : 'Le statut de la commande a ete modifie.',
        );
      }
    } catch {
      this.error.set('Le statut de la commande n’a pas pu etre modifie.');
    } finally {
      this.savingId.set('');
    }
  }

  protected fanpackOrderStatusLabel(status: FanpackOrderStatus): string {
    return this.fanpackOrderStatuses.find((item) => item.value === status)?.label ?? status;
  }

  protected recoveryMethodLabel(value: string): string {
    if (value === 'post') {
      return 'Par la poste';
    }

    if (value === 'mondial_relay') {
      return 'Mondial Relay';
    }

    return 'Lyon';
  }

  protected orderItemsLabel(order: FanpackOrder): string {
    return order.items.map((item) => `${item.quantity} x ${item.memberName}`).join(', ');
  }

  protected async togglePublished(review: ParticipantReview): Promise<void> {
    const nextValue = !review.isPublished;
    this.savingId.set(review.id);
    this.error.set('');
    this.success.set('');

    try {
      await this.reviewsService.setPublished(review.id, nextValue);
      this.reviews.update((reviews) =>
        reviews.map((item) => (item.id === review.id ? { ...item, isPublished: nextValue } : item)),
      );
    } catch {
      this.error.set('La publication de cet avis n’a pas pu etre modifiee.');
    } finally {
      this.savingId.set('');
    }
  }

  protected async deleteReview(review: ParticipantReview): Promise<void> {
    const confirmed = window.confirm(
      `Supprimer definitivement l’avis de ${review.name} ? Cette action est irreversible.`,
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
      this.error.set('Cet avis n’a pas pu etre supprime.');
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
      this.error.set('Le statut de cette demande n’a pas pu etre modifie.');
    } finally {
      this.savingId.set('');
    }
  }

  protected async deleteRequest(request: EventRequest): Promise<void> {
    const confirmed = window.confirm(
      `Supprimer definitivement la demande pour ${request.artist} ? Cette action est irreversible.`,
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
      this.error.set('Cette demande d’evenement n’a pas pu etre supprimee.');
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
      imagePath: value.imagePath ?? null,
      dominantColor: normalizeHexColor(value.dominantColor),
    };
  }

  private getFanpackCampaignPayload(): FanpackCampaignPayload {
    const value = this.fanpackForm.getRawValue();
    const completePackPrice =
      value.completePackPrice === null || value.completePackPrice === undefined
        ? null
        : Number(value.completePackPrice);

    return {
      name: (value.name ?? '').trim(),
      slug: normalizeSlug(value.slug ?? ''),
      description: (value.description ?? '').trim() || null,
      packContent: (value.packContent ?? '').trim(),
      unitPrice: Number(value.unitPrice ?? 0),
      completePackPrice: Number.isFinite(completePackPrice) ? completePackPrice : null,
      isActive: !!value.isActive,
    };
  }

  private getFanpackMemberPayload(): FanpackMemberPayload {
    const value = this.fanpackMemberForm.getRawValue();

    return {
      name: (value.name ?? '').trim(),
      stock: Math.max(0, Math.trunc(Number(value.stock ?? 0))),
      maxPerOrder: Math.max(1, Math.trunc(Number(value.maxPerOrder ?? 1))),
      displayOrder: Math.max(1, Math.trunc(Number(value.displayOrder ?? 1))),
      isActive: !!value.isActive,
    };
  }

  private clearSelectedPoster(preview: string): void {
    this.revokeObjectPreview();
    this.selectedPosterFile = null;
    this.selectedPosterName.set('');
    this.posterPreview.set(preview);
  }

  private revokeObjectPreview(): void {
    if (this.objectPreviewUrl) {
      URL.revokeObjectURL(this.objectPreviewUrl);
      this.objectPreviewUrl = null;
    }
  }
}

async function extractDominantColor(imageUrl: string): Promise<string> {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return '#ff6ec7';
  }

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const pixels = context.getImageData(0, 0, width, height).data;
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;
  const leftEdgeWidth = Math.min(60, width);
  const rightEdgeStart = Math.max(width - 60, 0);
  const topEdgeHeight = Math.min(100, height);
  const bottomEdgeStart = Math.max(height - 50, 0);
  const sampleStep = 2;

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const isPosterContour =
        x < leftEdgeWidth || x >= rightEdgeStart || y < topEdgeHeight || y >= bottomEdgeStart;

      if (!isPosterContour) {
        continue;
      }

      const index = (y * width + x) * 4;
      const alpha = pixels[index + 3];

      if (alpha < 128) {
        continue;
      }

      red += pixels[index];
      green += pixels[index + 1];
      blue += pixels[index + 2];
      count += 1;
    }
  }

  if (count === 0) {
    return '#ff6ec7';
  }

  return rgbToHex(Math.round(red / count), Math.round(green / count), Math.round(blue / count));
}

function loadImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = imageUrl;
  });
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function normalizeHexColor(value: string | null | undefined): string {
  return /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : '#ff6ec7';
}

function normalizeSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function replaceOrAppendMember(members: FanpackMember[], member: FanpackMember): FanpackMember[] {
  return members.some((item) => item.id === member.id)
    ? members.map((item) => (item.id === member.id ? member : item))
    : [...members, member];
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
