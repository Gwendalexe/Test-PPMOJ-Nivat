import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EnigmeSemaine } from 'src/app/_models/Enigme_semaine';
import { FormationCategory } from 'src/app/_models/Formation';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { FormationService } from '../../_services/formation.service';
import { WeekProblemService } from '../../_services/week_problem.service';
import { NavbarComponent as NavbarComponent_1 } from '../../components/navbar/navbar.component';
import { CardItem, FormationCardComponent } from '../formations/formation-card/formation-card.component';

@Component({
    selector: 'app-formation-home',
    templateUrl: './formations_home.component.html',
    styleUrls: ['./formations_home.component.scss'],
    host: { class: 'light-theme' },
    imports: [NavbarComponent_1, NgIf, NgFor, FormationCardComponent]
})
export class FormationsHomeComponent implements OnInit {
  formationCategory: Array<FormationCategory> = [];

  // Mixed cards for display section
  mixedCards: CardItem[] = [];
  originalMixedCards: CardItem[] = []; // Store original order
  isLoadingCards = false;

  // Sorting
  sortCriteria: 'price' | 'none' = 'none';
  sortDirection: 'asc' | 'desc' | 'none' = 'none';
  showCriteriaMenu = false;

  // Available sort criteria
  availableCriteria = [
    { value: 'price' as const, label: 'Prix' },
    // Add more criteria here as needed (e.g., date, title, etc.)
  ];

  constructor(
    private router: Router,
    private formationService: FormationService,
    private weekProblemService: WeekProblemService
  ) {}

  @ViewChild(NavbarComponent) navbar: NavbarComponent;

  ngOnInit(): void {
    // Load formation categories
    this.formationService.getFormationCategories().subscribe(data => {
      this.formationCategory = data;
    });

    // Load mixed cards (formations + problems + week_problems)
    this.loadMixedCards();
  }

  private loadMixedCards(): void {
    this.isLoadingCards = true;

    forkJoin({
      histoireFormations: this.formationService.getFormationAndNextSessionByCode('HISTOIRE'), // Get "Histoire" formations
      problemeFormations: this.formationService.getFormationAndNextSessionByCode('PROBLEME'), // Get "Résolution de Problème" formations
      weekProblems: this.weekProblemService.getWeekProblems()
    }).subscribe({
      next: ({ histoireFormations, problemeFormations, weekProblems }) => {
        console.log('Loaded histoire formations:', histoireFormations);
        console.log('Loaded probleme formations:', problemeFormations);
        console.log('Loaded weekProblems:', weekProblems);

        // Filter displayed histoire formations
        const displayedHistoires = (histoireFormations || [])
          .filter((f: any) => f.displayed === true || f.displayed === undefined)
          .slice(0, 3); // Limit to 3 histoire formations

        // Filter displayed probleme formations
        const displayedProblemes = (problemeFormations || [])
          .filter((f: any) => f.displayed === true || f.displayed === undefined)
          .slice(0, 3); // Limit to 3 probleme formations

        const displayedWeekProblems = (weekProblems || [])
          .filter((wp: EnigmeSemaine) => wp.displayed === true || wp.displayed === undefined)
          .sort((a, b) => {
            // Sort by date descending (latest first)
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
          })
          .slice(0, 2); // Limit to 2 latest week problems

        console.log('Displayed histoires:', displayedHistoires);
        console.log('Displayed problemes:', displayedProblemes);
        console.log('Displayed weekProblems:', displayedWeekProblems);

        // Enrich week problems with week number in the title
        const enrichedWeekProblems = displayedWeekProblems.map((wp: EnigmeSemaine) => {
          const weekNum = this.getWeekNumber(new Date(wp.date));
          return {
            ...wp,
            _weekNumber: weekNum // Store week number for template use
          } as any;
        });

        // Mix them together: histoire formations + probleme formations + week problems
        this.mixedCards = [
          ...displayedHistoires,
          ...displayedProblemes,
          ...enrichedWeekProblems
        ];

        // Store original order for later restoration
        this.originalMixedCards = [...this.mixedCards];

        console.log('Mixed cards:', this.mixedCards);
        this.isLoadingCards = false;
      },
      error: (error) => {
        console.error('Error loading mixed cards:', error);
        this.isLoadingCards = false;
      }
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

  // Calculate ISO week number for a given date
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Toggle criteria menu
  toggleCriteriaMenu() {
    this.showCriteriaMenu = !this.showCriteriaMenu;
  }

  // Select a sort criteria
  selectCriteria(criteria: 'price' | 'none') {
    this.sortCriteria = criteria;
    this.showCriteriaMenu = false;

    if (criteria === 'none') {
      this.sortDirection = 'none';
    } else {
      // When activating a criteria, default to ascending if no direction set
      if (this.sortDirection === 'none') {
        this.sortDirection = 'asc';
      }
    }
    this.applySorting();
  }

  // Toggle sort direction
  toggleSortDirection() {
    if (this.sortDirection === 'none') {
      this.sortDirection = 'asc';
      // Activate price criteria if not already active
      if (this.sortCriteria === 'none') {
        this.sortCriteria = 'price';
      }
    } else if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
    } else {
      this.sortDirection = 'none';
    }
    this.applySorting();
  }

  // Apply sorting to mixed cards
  private applySorting() {
    // If no criteria or no direction, restore original order
    if (this.sortCriteria === 'none' || this.sortDirection === 'none') {
      this.mixedCards = [...this.originalMixedCards];
      return;
    }

    // Sort based on criteria and direction
    this.mixedCards = [...this.mixedCards].sort((a, b) => {
      let valueA = 0;
      let valueB = 0;

      // Get values based on criteria
      if (this.sortCriteria === 'price') {
        valueA = this.getCardPrice(a);
        valueB = this.getCardPrice(b);
      }
      // Add more criteria here in the future (e.g., 'date', 'title', etc.)

      // Apply direction
      if (this.sortDirection === 'asc') {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });
  }

  // Get price from any card type
  private getCardPrice(card: CardItem): number {
    if ('price' in card) {
      return card.price || 0;
    } else if ('reward' in card) {
      return (card as any).reward || 0;
    } else if ('reward_mojette' in card) {
      return (card as any).reward_mojette || 0;
    }
    return 0;
  }
}
