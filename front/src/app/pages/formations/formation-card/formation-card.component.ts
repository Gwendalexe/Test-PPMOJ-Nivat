import { NgIf } from '@angular/common';
import {
    Component,
    HostBinding,
    HostListener,
    Input,
    ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';
import { Enigme } from 'src/app/_models/Enigme';
import { EnigmeSemaine } from 'src/app/_models/Enigme_semaine';
import { FormationExtended } from 'src/app/_models/Formation';
import { AuthService } from 'src/app/_services/auth.service';
import { environment } from 'src/environments/environment';

// Generic type for card data - supports formations, problems, and week_problems
export type CardItem = FormationExtended | Enigme | EnigmeSemaine;

@Component({
  selector: 'app-formation-card',
  templateUrl: './formation-card.component.html',
  styleUrls: ['./formation-card.component.scss'],
  host: {
    class: 'card formation-card primary-card flex-column align-items-stretch',
  },
  encapsulation: ViewEncapsulation.None,
  imports: [NgIf],
})
export class FormationCardComponent {
  @Input() formation: CardItem;

  @HostBinding('class.clickable') clickableFlag = false;

  @HostListener('click') goToDestination() {
    // this.router.navigate([`/${this.formation.destination}`]);
  }

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  imgUrl(u?: string) {
    if (!u) return '';
    return u.startsWith('http') ? u : `${environment.apiUrl}${u}`;
  }

  // Determine which type of card this is using a priority-based approach
  isWeekProblem(item: CardItem): item is EnigmeSemaine {
    // EnigmeSemaine has 'nb_val_to_find' property - most distinctive
    return 'nb_val_to_find' in item;
  }

  isProblem(item: CardItem): item is Enigme {
    // Enigmes have 'niveau' property (distinctive for Enigme vs Formation)
    // AND don't have 'nb_val_to_find' or 'sessions'
    return 'niveau' in item && !('nb_val_to_find' in item) && !('sessions' in item);
  }

  isFormation(item: CardItem): item is FormationExtended {
    // Check in last - if not week problem or problem, it's a formation
    // Formations have 'price' and 'category' (never 'niveau' or 'nb_val_to_find')
    return !this.isWeekProblem(item) && !this.isProblem(item);
  }

  // Get the title for the card
  getTitle(): string {
    if (this.isFormation(this.formation)) {
      return this.formation.name;
    } else if (this.isProblem(this.formation)) {
      return `Problème - Niveau ${this.formation.niveau}`;
    } else if (this.isWeekProblem(this.formation)) {
      const weekNum = (this.formation as any)._weekNumber || '';
      return weekNum ? `Énigme semaine ${weekNum}` : 'Énigme de la semaine';
    }
    return '';
  }

  // Get the image URL for the card
  getImageUrl(): string {
    if (this.isFormation(this.formation)) {
      const imgLink = this.formation.img_link;
      return imgLink ? this.imgUrl(imgLink) : '';
    } else if (this.isProblem(this.formation)) {
      const figPath = (this.formation as any).figure_path;
      return figPath ? this.imgUrl(figPath) : '';
    } else if (this.isWeekProblem(this.formation)) {
      const figPath = this.formation.figure_path;
      return figPath ? this.imgUrl(figPath) : '';
    }
    return '';
  }

  // Get next session/delivery date display
  getNextDate(): string | null {
    if (this.isFormation(this.formation)) {
      if (this.formation.sessions?.length && this.formation.sessions[0].delivery_date) {
        return `Prochain live : ${this.formation.sessions[0].calculated_jour}`;
      }
      return null;
    }
    return null;
  }

  // Check if date is unavailable
  hasNoDate(): boolean {
    if (this.isFormation(this.formation)) {
      return !!(this.formation.sessions?.length && !this.formation.sessions[0].delivery_date);
    }
    return false;
  }

  // Get schedule text
  getSchedule(): string {
    if (this.isFormation(this.formation)) {
      return (this.formation.sessions?.length ? this.formation.sessions[0].calculated_horaire : null) || '-';
    } else if (this.isProblem(this.formation)) {
      return '-';
    } else if (this.isWeekProblem(this.formation)) {
      return `Le ${this.formation.date}`;
    }
    return '-';
  }

  // Get price/cost
  getPrice(): string | number {
    if (this.isFormation(this.formation)) {
      return this.formation.price;
    } else if (this.isProblem(this.formation)) {
      // Enigme can have either 'reward' or 'recompense' field
      return (this.formation as any).reward || (this.formation as any).recompense || 0;
    } else if (this.isWeekProblem(this.formation)) {
      return this.formation.reward_mojette || 0;
    }
    return 0;
  }

  // Get navigation link
  getNavigationLink(): string {
    if (this.isFormation(this.formation)) {
      return `/formation/${this.formation.id}`;
    } else if (this.isProblem(this.formation)) {
      return `/vef/problemes/${this.formation.id}`;
    } else if (this.isWeekProblem(this.formation)) {
      return `/enigme-semaine/${this.formation.id}`;
    }
    return '';
  }
}
