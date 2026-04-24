import { Component } from '@angular/core';
import { reviews } from '../data/site-content';

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  templateUrl: './reviews-page.component.html',
  styleUrl: './reviews-page.component.css',
})
export class ReviewsPageComponent {
  protected readonly reviews = reviews;
  protected readonly stars = [1, 2, 3, 4, 5];
}
