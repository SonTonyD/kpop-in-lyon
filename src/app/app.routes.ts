import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { AboutPageComponent } from './pages/about-page.component';
import { BackOfficeComponent } from './pages/back-office/back-office.component';
import { BackOfficeLoginComponent } from './pages/back-office/back-office-login.component';
import { ContactPageComponent } from './pages/contact-page.component';
import { EventPageComponent } from './pages/event-page.component';
import { HomePageComponent } from './pages/home-page.component';
import { ReviewsPageComponent } from './pages/reviews-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent, title: 'Kpop in Lyon' },
  { path: 'event', component: EventPageComponent, title: 'Event | Kpop in Lyon' },
  { path: 'reviews', component: ReviewsPageComponent, title: 'Avis | Kpop in Lyon' },
  { path: 'about', component: AboutPageComponent, title: 'A propos | Kpop in Lyon' },
  { path: 'contact', component: ContactPageComponent, title: 'Contact | Kpop in Lyon' },
  {
    path: 'back-office/login',
    component: BackOfficeLoginComponent,
    title: 'Connexion back-office | Kpop in Lyon',
  },
  {
    path: 'back-office',
    component: BackOfficeComponent,
    canActivate: [authGuard],
    title: 'Back-office | Kpop in Lyon',
  },
  { path: '**', redirectTo: '' },
];
