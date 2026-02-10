import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EnigmeSemaine } from 'src/app/_models/Enigme_semaine';
import { WeekProblemService } from 'src/app/_services/week_problem.service';

@Component({
  selector: 'app-backoffice-weekproblems',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterModule, NgFor, NgIf],
  templateUrl: './weekproblems.component.html',
  styleUrls: ['./weekproblems.component.scss']
})
export class WeekproblemsComponent {
  weekProblems: EnigmeSemaine[] = [];
  loading = false;
  error: string|null = null;
  deleteError: string|null = null;
  deleteSuccess: string|null = null;
  toggleError: string|null = null;
  toggleSuccess: string|null = null;

  constructor(
    private weekProblemService: WeekProblemService,
    private router: Router
  ) {
    this.loadWeekProblems();
  }

  loadWeekProblems() {
    this.loading = true;
    this.error = null;
    this.weekProblemService.getWeekProblems().subscribe({
      next: problems => {
        this.weekProblems = problems;
        this.loading = false;
      },
      error: err => {
        this.error = err.message || 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  onEdit(id: number) {
    this.router.navigate(['/backoffice/weekproblem', id]);
  }

  onToggleDisplay(id: number, currentDisplayed: boolean) {
    this.toggleError = null;
    this.toggleSuccess = null;
    this.weekProblemService.updateWeekProblem(id, { displayed: !currentDisplayed }).subscribe({
      next: () => {
        this.toggleSuccess = currentDisplayed ? 'Énigme masquée.' : 'Énigme affichée.';
        this.loadWeekProblems();
      },
      error: err => {
        this.toggleError = err.message || 'Erreur lors du changement d\'affichage';
      }
    });
  }

  onDelete(id: number) {
    if (!confirm('Supprimer cette énigme de la semaine ?')) return;
    this.deleteError = null;
    this.weekProblemService.deleteWeekProblem(id).subscribe({
      next: () => {
        this.deleteSuccess = 'Énigme supprimée.';
        this.loadWeekProblems();
      },
      error: err => {
        this.deleteError = err.message || 'Erreur lors de la suppression';
      }
    });
  }

  private getISOWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
    return weekNo;
  }

  getISOWeekFromString(dateStr: string | undefined | null): number {
    if (!dateStr) return 0;
    return this.getISOWeekNumber(new Date(dateStr));
  }
}
