import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  constructor(protected readonly authService: AuthService) {}

  readonly navItems = [
    { label: 'Accueil', path: '/', exact: true },
    { label: 'Événement', path: '/event', exact: false },
    { label: 'Avis', path: '/reviews', exact: false },
    { label: 'À propos', path: '/about', exact: false },
    { label: 'Contact', path: '/contact', exact: false },
  ];
}
