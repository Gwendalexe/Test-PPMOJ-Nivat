import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { LeaderboardTableComponent } from './leaderboard-table.component';

@NgModule({
  declarations: [LeaderboardTableComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  exports: [LeaderboardTableComponent]
  // bootstrap: [LeaderboardTableComponent],
})
export class LeaderboardTableModule {}
