import { Component } from '@angular/core';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';

@Component({
  selector: 'app-conditions-generales-de-vente',
  imports: [NavbarComponent],
  templateUrl: './conditions-generales-de-vente.component.html',
  styleUrl: './conditions-generales-de-vente.component.scss',
  host: { class: 'dark-theme' },
})
export class ConditionsGeneralesDeVenteComponent {}
