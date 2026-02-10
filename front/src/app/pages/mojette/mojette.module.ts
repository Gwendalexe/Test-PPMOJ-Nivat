import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { LeaderboardTableModule } from '../../components/leaderboard-table/leaderboard-table.module';
import { NavbarModule } from '../../components/navbar/navbar.module';
import { MojetteComponent } from './mojette.component';
import { MojetteTutorialComponent } from '../mojette-tutorial/mojette-tutorial.component';

@NgModule({
  declarations: [
    MojetteComponent,
    MojetteTutorialComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NavbarModule,
    MatSelectModule,
    MatFormFieldModule,
    LeaderboardTableModule
  ],
  bootstrap: [MojetteComponent],
})
export class MojetteModule {}
