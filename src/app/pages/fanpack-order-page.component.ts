import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  FanpackCampaign,
  FanpackMember,
  FanpackOrderPayload,
  FanpackRecoveryMethod,
  FanpackSocialPlatform,
} from '../services/back-office.types';
import {
  FanpacksService,
  calculateFanpackTotal,
  getCompletePackMaxQuantity,
} from '../services/fanpacks.service';

@Component({
  selector: 'app-fanpack-order-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule],
  templateUrl: './fanpack-order-page.component.html',
  styleUrl: './fanpack-order-page.component.css',
})
export class FanpackOrderPageComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal('');
  protected readonly selectedProofName = signal('');
  protected readonly campaign = signal<FanpackCampaign | null>(null);
  protected readonly quantities = signal<Record<string, number>>({});
  protected readonly completePackQuantity = signal(0);
  protected readonly recoveryOptions: { value: FanpackRecoveryMethod; label: string }[] = [
    { value: 'lyon', label: 'Lyon' },
    { value: 'post', label: 'Par la poste' },
    { value: 'mondial_relay', label: 'Mondial Relay' },
  ];
  protected readonly form;
  protected readonly activeMembers = computed(() =>
    (this.campaign()?.members ?? []).filter((member) => member.isActive),
  );
  protected readonly completePackMax = computed(() => getCompletePackMaxQuantity(this.activeMembers()));
  protected readonly total = computed(() => {
    const campaign = this.campaign();

    if (!campaign) {
      return 0;
    }

    return calculateFanpackTotal(
      campaign,
      this.activeMembers(),
      this.quantities(),
      this.completePackQuantity(),
    );
  });

  private proofFile: File | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly fanpacksService: FanpacksService,
  ) {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', [Validators.required, Validators.maxLength(120)]],
      socialPlatform: ['instagram' as FanpackSocialPlatform, Validators.required],
      socialUsername: ['', [Validators.required, Validators.maxLength(80)]],
      recoveryMethod: ['lyon' as FanpackRecoveryMethod, Validators.required],
      postalAddress: [''],
    });
  }

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';

    try {
      const campaign = await this.fanpacksService.getPublicCampaign(slug);
      this.campaign.set(campaign);
      this.quantities.set(
        Object.fromEntries((campaign?.members ?? []).map((member) => [member.id, 0])),
      );
    } catch {
      this.error.set('Le formulaire fanpack ne peut pas etre charge pour le moment.');
    } finally {
      this.loading.set(false);
    }
  }

  protected memberQuantity(member: FanpackMember): number {
    return this.quantities()[member.id] ?? 0;
  }

  protected memberMaxQuantity(member: FanpackMember): number {
    return Math.max(0, Math.min(member.stock, member.maxPerOrder));
  }

  protected updateMemberQuantity(member: FanpackMember, event: Event): void {
    const input = event.target as HTMLInputElement;
    const quantity = clampQuantity(Number(input.value), this.memberMaxQuantity(member));
    this.quantities.update((quantities) => ({ ...quantities, [member.id]: quantity }));
    input.value = String(quantity);
  }

  protected updateCompletePackQuantity(event: Event): void {
    const input = event.target as HTMLInputElement;
    const quantity = clampQuantity(Number(input.value), this.completePackMax());
    this.completePackQuantity.set(quantity);
    input.value = String(quantity);
  }

  protected onProofSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.proofFile = null;
      this.selectedProofName.set('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.error.set('La preuve de paiement doit etre une image.');
      input.value = '';
      this.proofFile = null;
      this.selectedProofName.set('');
      return;
    }

    this.proofFile = file;
    this.selectedProofName.set(file.name);
    this.error.set('');
  }

  protected needsPostalAddress(): boolean {
    return this.form.controls.recoveryMethod.value === 'post';
  }

  protected hasSelectedFanpacks(): boolean {
    return (
      this.completePackQuantity() > 0 ||
      Object.values(this.quantities()).some((quantity) => quantity > 0)
    );
  }

  protected async submit(): Promise<void> {
    this.applyPostalAddressValidation();

    if (this.form.invalid || !this.proofFile || !this.hasSelectedFanpacks() || this.total() <= 0) {
      this.form.markAllAsTouched();
      this.error.set('Merci de completer tous les champs obligatoires et de choisir au moins un fanpack.');
      return;
    }

    const campaign = this.campaign();

    if (!campaign) {
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    this.submitted.set(false);

    try {
      const proofPath = await this.fanpacksService.uploadPaymentProof(this.proofFile, campaign.id);
      const value = this.form.getRawValue();
      const payload: FanpackOrderPayload = {
        campaignId: campaign.id,
        customerEmail: (value.email ?? '').trim(),
        customerFullName: (value.fullName ?? '').trim(),
        socialPlatform: value.socialPlatform ?? 'instagram',
        socialUsername: (value.socialUsername ?? '').trim(),
        recoveryMethod: value.recoveryMethod ?? 'lyon',
        postalAddress:
          value.recoveryMethod === 'post' ? (value.postalAddress ?? '').trim() : null,
        proofPath,
        completePackQuantity: this.completePackQuantity(),
        memberQuantities: Object.entries(this.quantities())
          .map(([memberId, quantity]) => ({ memberId, quantity }))
          .filter((item) => item.quantity > 0),
      };

      await this.fanpacksService.submitOrder(payload);
      this.submitted.set(true);
      this.form.reset({
        email: '',
        fullName: '',
        socialPlatform: 'instagram',
        socialUsername: '',
        recoveryMethod: 'lyon',
        postalAddress: '',
      });
      this.quantities.set(Object.fromEntries(campaign.members.map((member) => [member.id, 0])));
      this.completePackQuantity.set(0);
      this.proofFile = null;
      this.selectedProofName.set('');
    } catch {
      this.error.set('La commande n’a pas pu etre envoyee. Verifie les stocks puis reessaie.');
    } finally {
      this.submitting.set(false);
    }
  }

  private applyPostalAddressValidation(): void {
    const postalAddressControl = this.form.controls.postalAddress;

    if (this.needsPostalAddress()) {
      postalAddressControl.setValidators([Validators.required, Validators.minLength(10)]);
    } else {
      postalAddressControl.clearValidators();
      postalAddressControl.setValue('');
    }

    postalAddressControl.updateValueAndValidity();
  }
}

function clampQuantity(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(Math.trunc(value), max));
}
