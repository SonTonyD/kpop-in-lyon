import { Component } from '@angular/core';
import { aboutParagraphs } from '../data/site-content';

@Component({
  selector: 'app-about-page',
  standalone: true,
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
})
export class AboutPageComponent {
  protected readonly paragraphs = aboutParagraphs;
}
