import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly navItems = [
    { label: 'Accueil', path: '/', exact: true },
    { label: 'Événement', path: '/event', exact: false },
    { label: 'Avis', path: '/reviews', exact: false },
    { label: 'À propos', path: '/about', exact: false },
    { label: 'Contact', path: '/contact', exact: false },
  ];
}
