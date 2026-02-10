import { CommonModule } from '@angular/common'; // Ajout nécessaire pour ngClass
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Leaderboard, LeaderboardEntry } from 'src/app/_models/Leaderboard';
import { MojetteService } from '../../_services/mojette.service';

@Component({
  selector: 'app-leaderboard-table',
  templateUrl: './leaderboard-table.component.html',
  styleUrls: ['./leaderboard-table.component.scss'],
  host: { class: 'dark-theme' },
  encapsulation: ViewEncapsulation.None,
  standalone: true, // Déclare le composant comme standalone
  imports: [CommonModule], // Importation du module commun qui fournit ngClass et autres directives
})
export class LeaderboardTableComponent implements OnInit, OnChanges {
  @Input() gridId?: number;

  leaderboard: Leaderboard = {
    top: [],
    user: {
      user_id: 0,
      username: '',
      completion_time: 0,
      helps_used: 0,
      position: 0,
      score: 0,
    },
    above_user: [],
    below_user: [],
  };
  user: LeaderboardEntry = {
    user_id: 0,
    username: '',
    completion_time: 0,
    helps_used: 0,
    position: 0,
    score: 0,
  };
  displayDots = true;
  displayUser = true;
  hasUserSolvedGrid = true;

  constructor(
    private router: Router,
    private mojetteService: MojetteService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idFromRoute = this.route.snapshot.queryParams['gridId'];
    this.gridId = this.gridId ?? idFromRoute;

    if (this.gridId) {
      this.loadLeaderboard(this.gridId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gridId'] && changes['gridId'].currentValue) {
      const newId = changes['gridId'].currentValue;
      this.loadLeaderboard(newId);
    }
  }

  private loadLeaderboard(gridId: number): void {
    this.mojetteService.getMojetteLeaderboard(gridId).subscribe(data => {
      this.leaderboard = data;
      this.displayDots = false;
      if (data.user && data.user.user_id) {
        this.user = data.user;

        const isThereAboveUser = this.leaderboard.above_user.length > 0;
        const isAboveUserNotAdjacentToTop = !(
          this.leaderboard.above_user[0]?.position ===
          this.leaderboard.top[this.leaderboard.top.length - 1]?.position + 1
        );
        this.displayDots = isThereAboveUser && isAboveUserNotAdjacentToTop;

        this.displayUser =
          this.leaderboard.top[this.leaderboard.top.length - 1]?.position < this.user.position;
      } else {
        this.hasUserSolvedGrid = false;
        this.displayDots = this.leaderboard.top.length === 0;
      }


    });
  }
}
