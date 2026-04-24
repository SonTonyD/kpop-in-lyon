import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { collaborationTypes, decorationTypes } from '../data/site-content';

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
  protected readonly selectedCollaboration = signal<string[]>([]);
  protected readonly selectedDecorations = signal<string[]>([]);
  protected readonly form;

  constructor(private readonly formBuilder: FormBuilder) {
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

  protected submit(): void {
    if (this.form.invalid) {
      this.submitted.set(false);
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.set(true);
    this.form.reset();
    (this.form.get('collaborationTypes') as FormArray).clear();
    (this.form.get('decorationTypes') as FormArray).clear();
    this.selectedCollaboration.set([]);
    this.selectedDecorations.set([]);
  }
}
