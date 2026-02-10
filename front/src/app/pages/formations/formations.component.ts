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
import { FormationCardComponent } from './formation-card/formation-card.component';

@Component({
  selector: 'app-formation',
  templateUrl: './formations.component.html',
  styleUrls: ['./formations.component.scss'],
  host: { class: 'light-theme' },
  imports: [
    NavbarComponent_1,
    NgIf,
    NgFor,
    FormationCardComponent,
    CarrouselComponent,
  ],
})
export class FormationsComponent implements OnInit {
  private userConfirmedSubscription: Subscription; //important to create a subscription
  formationArray: Array<FormationExtended> = [];
  // formation: FormationCategoryCard;
  formationCategory: FormationCategory;
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

      forkJoin({
        category: this.formationService.getCategoryByCode(params['code']),
        formations: this.formationService.getFormationAndNextSessionByCode(params['code'])
      }).subscribe({
        next: ({ category, formations }) => {
          this.formationCategory = category;
          this.formationArray = formations.filter(f => f.displayed === true || f.displayed === undefined);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading formations:', error);
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
