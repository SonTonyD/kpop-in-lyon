import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { collaborationTypes, decorationTypes } from '../data/site-content';
import { EventRequestsService } from '../services/event-requests.service';
import { EventRequestPayload } from '../services/back-office.types';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.css',
})
export class ContactPageComponent {
  protected readonly collaborationTypes = collaborationTypes;
  protected readonly decorationTypes = decorationTypes;
  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal('');
  protected readonly selectedCollaboration = signal<string[]>([]);
  protected readonly selectedDecorations = signal<string[]>([]);
  protected readonly form;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly eventRequestsService: EventRequestsService,
  ) {
    this.form = this.formBuilder.group({
      fullName: ['', Validators.required],
      fanbaseName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      socialLinks: [''],
      artist: ['', Validators.required],
      city: ['', Validators.required],
      period: ['', Validators.required],
      collaborationTypes: this.formBuilder.array([], Validators.required),
      decorationTypes: this.formBuilder.array([], Validators.required),
      details: ['', [Validators.required, Validators.minLength(15)]],
    });
  }

  protected onMultiSelectChange(
    event: Event,
    formArrayName: 'collaborationTypes' | 'decorationTypes',
    value: string,
  ): void {
    const input = event.target as HTMLInputElement;
    const formArray = this.form.get(formArrayName) as FormArray;
    const selectedSignal =
      formArrayName === 'collaborationTypes' ? this.selectedCollaboration : this.selectedDecorations;
    const current = selectedSignal();

    if (input.checked) {
      formArray.push(this.formBuilder.control(value));
      selectedSignal.set([...current, value]);
      return;
    }

    const valueIndex = formArray.controls.findIndex((control) => control.value === value);
    if (valueIndex >= 0) {
      formArray.removeAt(valueIndex);
    }
    selectedSignal.set(current.filter((item) => item !== value));
  }

  protected hasChoiceError(controlName: 'collaborationTypes' | 'decorationTypes'): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  protected isSelected(
    formArrayName: 'collaborationTypes' | 'decorationTypes',
    value: string,
  ): boolean {
    const selected =
      formArrayName === 'collaborationTypes'
        ? this.selectedCollaboration()
        : this.selectedDecorations();
    return selected.includes(value);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.submitted.set(false);
      this.submitError.set('');
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitted.set(false);
    this.submitError.set('');

    try {
      const value = this.form.getRawValue();
      const payload: EventRequestPayload = {
        fullName: (value.fullName ?? '').trim(),
        fanbaseName: (value.fanbaseName ?? '').trim(),
        email: (value.email ?? '').trim(),
        socialLinks: (value.socialLinks ?? '').trim() || null,
        artist: (value.artist ?? '').trim(),
        city: (value.city ?? '').trim(),
        period: (value.period ?? '').trim(),
        collaborationTypes: toStringArray(value.collaborationTypes),
        decorationTypes: toStringArray(value.decorationTypes),
        details: (value.details ?? '').trim(),
      };

      await this.eventRequestsService.createRequest(payload);
      this.submitted.set(true);
      this.form.reset();
      (this.form.get('collaborationTypes') as FormArray).clear();
      (this.form.get('decorationTypes') as FormArray).clear();
      this.selectedCollaboration.set([]);
      this.selectedDecorations.set([]);
    } catch {
      this.submitError.set('La demande n’a pas pu être envoyée. Réessaie dans quelques instants.');
    } finally {
      this.submitting.set(false);
    }
  }
}

function toStringArray(value: unknown[] | null | undefined): string[] {
  return (value ?? []).filter((item): item is string => typeof item === 'string');
}
