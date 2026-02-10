// create_probleme.module.ts
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CreateProblemesComponent } from './create_problemes.component';

@NgModule({
  declarations: [CreateProblemesComponent],
  imports: [FormsModule, ReactiveFormsModule],
  bootstrap: [CreateProblemesComponent],
})
export class CreateProblemeModule {}
