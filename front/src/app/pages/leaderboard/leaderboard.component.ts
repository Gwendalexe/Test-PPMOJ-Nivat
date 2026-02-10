import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';

import { LeaderboardTableComponent } from 'src/app/components/leaderboard-table/leaderboard-table.component';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';

import { MojetteService } from 'src/app/_services/mojette.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
  host: { class: 'dark-theme' },
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    NavbarComponent,
    LeaderboardTableComponent,
  ],
})
export class LeaderboardComponent implements OnInit {
  gridId: number = 0;

  constructor(
    private router: Router,
    private mojetteService: MojetteService,
    private route: ActivatedRoute
  ) {
    this.gridId = this.route.snapshot.queryParams['gridId'] || 0;
  }

  ngOnInit(): void {}

  goToGridBrowse = (): void => {
    this.router.navigate(['/mojette']);
  };
}
