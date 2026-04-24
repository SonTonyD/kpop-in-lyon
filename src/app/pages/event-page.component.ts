import { Component } from '@angular/core';
import { upcomingEvent } from '../data/site-content';

@Component({
  selector: 'app-event-page',
  standalone: true,
  templateUrl: './event-page.component.html',
  styleUrl: './event-page.component.css',
})
export class EventPageComponent {
  protected readonly event = upcomingEvent;
}
