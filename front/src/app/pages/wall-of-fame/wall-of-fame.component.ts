import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EnigmeSemaine } from '../../_models/Enigme_semaine';
import { WeekProblemCompletion } from '../../_models/WeekProblemCompletion';
import { WeekProblemService } from '../../_services/week_problem.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-wall-of-fame',
  templateUrl: './wall-of-fame.component.html',
  styleUrls: ['./wall-of-fame.component.scss'],
  host: { class: 'dark-theme' },
  imports: [NavbarComponent, NgFor, NgIf, NgClass, RouterModule, DatePipe]
})
export class WallOfFameComponent implements OnInit {
  enigmes: EnigmeSemaine[] = [];
  current?: EnigmeSemaine;
  completions: WeekProblemCompletion[] = [];
  isLoading = true;
  showWeekPicker = false;

  weekMap: { [week: number]: { id: number; date: string } } = {};
  weeks: Array<{ num: number; hasProblem: boolean; id?: number }> = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private weekProblemService: WeekProblemService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.weekProblemService.getWeekProblems().subscribe({
      next: (problems) => {
        this.enigmes = (problems || []).filter(wp => wp.displayed === true || wp.displayed === undefined);
        this.computeWeeks();
        // Use route param if present; otherwise load current week
        this.route.paramMap.subscribe({
          next: (params) => {
            const idParam = params.get('id');
            const id = idParam ? Number(idParam) : undefined;
            if (id && !Number.isNaN(id)) {
              const selected = this.enigmes.find(e => e.id === id);
              if (selected) this.current = selected;
              this.loadCompletions(id);
              this.isLoading = false;
            } else {
              this.weekProblemService.getCurrentWeekProblem().subscribe({
                next: (cur) => {
                  this.current = cur;
                  if (cur?.id) this.loadCompletions(cur.id);
                  this.isLoading = false;
                },
                error: () => { this.isLoading = false; }
              });
            }
          },
          error: () => { this.isLoading = false; }
        });
      },
      error: () => { this.isLoading = false; }
    });
  }

  private computeWeeks(): void {
    this.weekMap = {};
    if (this.enigmes) {
      for (const e of this.enigmes) {
        const w = this.getISOWeekNumber(new Date(e.date));
        if (!this.weekMap[w] || new Date(e.date) > new Date(this.weekMap[w].date)) {
          this.weekMap[w] = { id: e.id, date: e.date };
        }
      }
    }
    const totalWeeks = 53;
    this.weeks = Array.from({ length: totalWeeks }, (_, i) => {
      const num = i + 1;
      const mapping = this.weekMap[num];
      return { num, hasProblem: !!mapping, id: mapping?.id };
    });
  }

  toggleWeekPicker(): void { this.showWeekPicker = !this.showWeekPicker; }

  selectWeek(weekNum: number): void {
    const mapping = this.weekMap[weekNum];
    if (mapping?.id) {
      this.router.navigate(['/wall-of-fame', mapping.id]);
      this.showWeekPicker = false;
      this.loadCompletions(mapping.id);
      const selected = this.enigmes.find(e => e.id === mapping.id);
      if (selected) this.current = selected;
    }
  }

  selectProblem(id: number): void {
    const selected = this.enigmes.find(e => e.id === id);
    if (selected) this.current = selected;
    this.router.navigate(['/wall-of-fame', id]);
    this.loadCompletions(id);
  }

  loadCompletions(id: number): void {
    this.weekProblemService.getWeekProblemCompletions(id).subscribe({
      next: (list) => { this.completions = (list || []).sort((a,b) => a.completion_date.localeCompare(b.completion_date)); },
      error: () => { this.completions = []; }
    });
  }

  getISOWeekNumber(date: Date): number {
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

  // UI helpers for badges
  isLeft(i: number): boolean {
    return i % 2 === 0; // L, R, L, R ...
  }

  getBadgeSrc(i: number): string {
    const leftOrRight = this.isLeft(i) ? 'l' : 'r';
    const isTopFive = i < 5;
    const base = isTopFive ? `wof_gold_${leftOrRight}` : `wof_mojette_approved_${leftOrRight}`;
    // Default to PNG; adjust if assets use another extension
    return `assets/wall_of_fame/${base}.png`;
  }

  formatUsername(c: WeekProblemCompletion): string {
    const base = (c?.username && c.username.trim().length > 0)
      ? c.username.trim()
      : `Utilisateur #${c.user_id}`;
    return base.charAt(0).toUpperCase() + base.slice(1);
  }
}
