import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-back-office-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './back-office-login.component.html',
  styleUrl: './back-office-login.component.css',
})
export class BackOfficeLoginComponent {
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly errorDetail = signal('');
  protected readonly form;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.errorDetail.set('');

    try {
      const value = this.form.getRawValue();
      await this.authService.signIn((value.email ?? '').trim(), value.password ?? '');
      await this.router.navigateByUrl('/back-office');
    } catch (error) {
      this.error.set(getAuthErrorMessage(error));
      this.errorDetail.set(getAuthErrorDetail(error));
    } finally {
      this.loading.set(false);
    }
  }
}

function getAuthErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Cet email existe, mais il n’est pas encore confirmé dans Supabase Auth.';
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Identifiants refusés par Supabase. Vérifie que le user Auth a bien un mot de passe défini et que son email est confirmé.';
  }

  return message || 'Connexion impossible. Vérifie l’email et le mot de passe.';
}

function getAuthErrorDetail(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return '';
  }

  const detail = error as { code?: string; message?: string; name?: string; status?: number };
  const parts = [
    detail.name ? `name: ${detail.name}` : '',
    detail.status ? `status: ${detail.status}` : '',
    detail.code ? `code: ${detail.code}` : '',
    detail.message ? `message: ${detail.message}` : '',
  ].filter(Boolean);

  return parts.join(' | ');
}
