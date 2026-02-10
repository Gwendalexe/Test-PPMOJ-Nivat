import { Component } from '@angular/core';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';

@Component({
  selector: 'app-remerciements',
  imports: [NavbarComponent],
  templateUrl: './remerciements.component.html',
  styleUrl: './remerciements.component.scss',
  host: { class: 'dark-theme' },
})
export class RemerciementsComponent {}
