import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly navItems = [
    { label: 'Événement', path: '/event' },
    { label: 'Avis', path: '/reviews' },
    { label: 'À propos', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];
}
