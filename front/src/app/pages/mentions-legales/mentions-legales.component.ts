import { Component } from '@angular/core';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';

@Component({
  selector: 'app-mentions-legales',
  imports: [NavbarComponent],
  templateUrl: './mentions-legales.component.html',
  styleUrl: './mentions-legales.component.scss',
  host: { class: 'dark-theme' },
})
export class MentionsLegalesComponent {}
