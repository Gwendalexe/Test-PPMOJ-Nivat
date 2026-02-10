import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import {
  FormationCategory,
  FormationExtended,
} from 'src/app/_models/Formation';
import { FormationService } from 'src/app/_services/formation.service';
import { CarrouselComponent } from 'src/app/components/carrousel/carrousel.component';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { NavbarComponent as NavbarComponent_1 } from '../../components/navbar/navbar.component';
import { FormationCardComponent } from '../formations/formation-card/formation-card.component';

@Component({
  selector: 'app-histoire',
  templateUrl: './histoire.component.html',
  styleUrls: ['./histoire.component.scss'],
  host: { class: 'light-theme' },
  imports: [
    NavbarComponent_1,
    NgIf,
    NgFor,
    FormationCardComponent,
    CarrouselComponent,
  ],
})
export class HistoireComponent implements OnInit {
  private userConfirmedSubscription: Subscription;
  histoireArray: Array<FormationExtended> = [];
  histoireCategory: FormationCategory;
  isLoading: boolean = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formationService: FormationService
  ) {}

  @ViewChild(NavbarComponent) navbar: NavbarComponent;

  ngOnInit(): void {
    this.route.params.subscribe((params: { [key: string]: string }) => {
      this.isLoading = true;
      const code = params['code'] || 'HISTOIRE';

      forkJoin({
        category: this.formationService.getCategoryByCode(code),
        histoires: this.formationService.getFormationAndNextSessionByCode(code)
      }).subscribe({
        next: ({ category, histoires }) => {
          this.histoireCategory = category;
          this.histoireArray = histoires.filter(f => f.displayed === true || f.displayed === undefined);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading histoires:', error);
          this.isLoading = false;
        }
      });
    });
  }

  openDialog() {
    const connectDialog: HTMLDivElement | null = document.getElementById(
      'connectDialog'
    ) as HTMLDivElement | null;
    if (connectDialog instanceof HTMLDialogElement) connectDialog.showModal();
  }

  goToPage = (page: string): Promise<boolean> =>
    this.router.navigate([`/${page}`]);
}

