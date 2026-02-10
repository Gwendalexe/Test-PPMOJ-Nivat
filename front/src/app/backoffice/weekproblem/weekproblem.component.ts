import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EnigmeSemaine } from 'src/app/_models/Enigme_semaine';
import { WeekProblemService } from 'src/app/_services/week_problem.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-backoffice-weekproblem',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './weekproblem.component.html',
  styleUrls: ['./weekproblem.component.scss']
})
export class WeekproblemComponent {
  weekProblemForm: FormGroup;
  loading = false;
  error: string|null = null;
  submitError: string|null = null;
  jsonError: string|null = null;
  jsonSuccess: string|null = null;
  submitSuccess: string|null = null;
  isEdit = false;
  problemId: number = 0;
  imageUrl: string|null = null;
  imageUploading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private weekProblemService: WeekProblemService
  ) {
    this.weekProblemForm = this.fb.group({
      nb_val_to_find: [null, Validators.required],
      problem_statement: ['', Validators.required],
      problem_question: ['', Validators.required],
      figure_path: ['', Validators.required], // This will store image_url
      reward_mojette: [0, Validators.required],
      reward_token_coin: [0, Validators.required],
      variables: this.fb.array([this.fb.control('', Validators.required)]),
      values_list: this.fb.array([this.fb.control('', Validators.required)]),
      solution: this.fb.array([this.fb.control('', Validators.required)]),
      date: ['', Validators.required],
    });
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.problemId = id;
      this.isEdit = id !== 0;
      if (this.isEdit) {
        this.loading = true;
        this.weekProblemService.getWeekProblemById(String(id)).subscribe({
          next: data => {
            this.patchForm(data);
            this.loading = false;
          },
          error: err => {
            this.error = err.message || 'Erreur lors du chargement';
            this.loading = false;
          }
        });
      }
    });
  }

  patchForm(data: EnigmeSemaine) {
    this.weekProblemForm.patchValue({
      nb_val_to_find: data.nb_val_to_find,
      problem_statement: data.problem_statement ?? '',
      problem_question: data.problem_question ?? '',
      figure_path: data.figure_path,
      reward_mojette: data.reward_mojette ?? 0,
      reward_token_coin: data.reward_token_coin ?? 0,
      date: data.date,
    });
    this.imageUrl = data.figure_path;
    this.variables.clear();
    data.variables.forEach((v: string) => this.variables.push(this.fb.control(v, Validators.required)));
    if (this.variables.length === 0) this.addVariable();
    this.values_list.clear();
    data.values_list.forEach((v: any) => this.values_list.push(this.fb.control(JSON.stringify(v), Validators.required)));
    if (this.values_list.length === 0) this.addValueList();
    this.solution.clear();
    data.solution.forEach((v: any) => this.solution.push(this.fb.control(JSON.stringify(v), Validators.required)));
    if (this.solution.length === 0) this.addSolution();
  }

  get variables(): FormArray { return this.weekProblemForm.get('variables') as FormArray; }
  get values_list(): FormArray { return this.weekProblemForm.get('values_list') as FormArray; }
  get solution(): FormArray { return this.weekProblemForm.get('solution') as FormArray; }

  getJsonPreview(): string {
    const formValue = this.weekProblemForm.value;
    const jsonObject = {
      variables: formValue.variables,
      values_list: formValue.values_list.map((v: any) => {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      }),
      solution: formValue.solution.map((v: any) => {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      }),
      date: formValue.date || new Date().toISOString().split('T')[0],
      nb_val_to_find: formValue.nb_val_to_find,
      reward_mojette: formValue.reward_mojette,
      reward_token_coin: formValue.reward_token_coin,
      problem_statement: formValue.problem_statement,
      problem_question: formValue.problem_question,

    };
    return JSON.stringify(jsonObject, null, 2);
  }

  formatJsonIndentation(jsonString: string): string {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  }

  copyJsonToClipboard(): void {
    const json = this.getJsonPreview();
    navigator.clipboard.writeText(json).then(() => {
      this.jsonSuccess = 'JSON copié dans le presse-papiers!';
      this.jsonError = null;
      setTimeout(() => this.jsonSuccess = null, 3000);
    }).catch(err => {
      console.error('Erreur lors de la copie:', err);
      this.jsonError = 'Erreur lors de la copie';
    });
  }

  applyJsonFromTextarea(event?: any): void {
    const textarea = event?.target as HTMLTextAreaElement || (document.querySelector('.json-preview') as HTMLTextAreaElement);
    if (!textarea) return;

    try {
      const jsonText = textarea.value.trim();
      if (!jsonText) {
        this.jsonError = 'Le JSON ne peut pas être vide';
        return;
      }

      const jsonData = JSON.parse(jsonText);

      // Format and update textarea with proper indentation
      textarea.value = this.formatJsonIndentation(jsonText);

      // Apply values to form
      this.weekProblemForm.patchValue({
        nb_val_to_find: jsonData.nb_val_to_find ?? null,
        problem_statement: jsonData.problem_statement ?? '',
        problem_question: jsonData.problem_question ?? '',
        figure_path: jsonData.figure_path ?? '',
        reward_mojette: jsonData.reward_mojette ?? 0,
        reward_token_coin: jsonData.reward_token_coin ?? 0,
        date: jsonData.date ?? new Date().toISOString().split('T')[0],
      });

      // Apply variables
      this.variables.clear();
      if (Array.isArray(jsonData.variables)) {
        jsonData.variables.forEach((v: any) => {
          this.variables.push(this.fb.control(v, Validators.required));
        });
      }
      if (this.variables.length === 0) this.addVariable();

      // Apply values_list
      this.values_list.clear();
      if (Array.isArray(jsonData.values_list)) {
        jsonData.values_list.forEach((v: any) => {
          this.values_list.push(this.fb.control(JSON.stringify(v), Validators.required));
        });
      }
      if (this.values_list.length === 0) this.addValueList();

      // Apply solution
      this.solution.clear();
      if (Array.isArray(jsonData.solution)) {
        jsonData.solution.forEach((v: any) => {
          this.solution.push(this.fb.control(JSON.stringify(v), Validators.required));
        });
      }
      if (this.solution.length === 0) this.addSolution();

      this.jsonError = null;
      this.submitError = null;
      this.jsonSuccess = 'JSON appliqué avec succès!';
      setTimeout(() => this.jsonSuccess = null, 3000);
    } catch (err) {
      this.jsonError = `Erreur lors du parsing JSON: ${(err as Error).message}`;
    }
  }

  addVariable() { this.variables.push(this.fb.control('', Validators.required)); }
  removeVariable(i: number) { if (this.variables.length > 1) this.variables.removeAt(i); }

  addValueList() { this.values_list.push(this.fb.control('', Validators.required)); }
  removeValueList(i: number) { if (this.values_list.length > 1) this.values_list.removeAt(i); }

  addSolution() { this.solution.push(this.fb.control('', Validators.required)); }
  removeSolution(i: number) { if (this.solution.length > 1) this.solution.removeAt(i); }

  importImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.imageUploading = true;
    this.weekProblemService.uploadWeekProblemImage(file).subscribe({
      next: ({ image_url }) => {
        this.weekProblemForm.patchValue({ figure_path: image_url });
        this.imageUrl = image_url;
        this.imageUploading = false;
      },
      error: err => {
        this.submitError = err.message || 'Erreur lors de l\'upload';
        this.imageUploading = false;
      }
    });
  }
  getImageUrl(): string {
    if (!this.imageUrl) return '';
    if (this.imageUrl.startsWith('http') || this.imageUrl.startsWith('/assets')) return this.imageUrl;
    if (this.imageUrl.startsWith('/week_problems/image/')) {
      let url = `${environment.apiUrl}${this.imageUrl}`;
      // Replace /image/ with /image/lowered/ for week problems
      url = url.replace('/week_problems/image/', '/week_problems/image/lowered/');
      return url;
    }
    return this.imageUrl;
  }

  submit() {
    this.submitSuccess = null;
    this.submitError = null;
    this.loading = true;
    const formValue = this.weekProblemForm.value;
    const body = {
      ...formValue,
      variables: formValue.variables,
      values_list: formValue.values_list.map((v:any)=>JSON.parse(v)),
      solution: formValue.solution.map((v:any)=>JSON.parse(v)),
    };
    if (this.isEdit) {
      this.weekProblemService.updateWeekProblem(this.problemId, body).subscribe({
        next: () => {
          this.submitSuccess = 'Modification enregistrée';
          this.loading = false;
          setTimeout(()=>this.router.navigate(['/backoffice/weekproblems']), 700);
        },
        error: err => {
          this.submitError = err.message || 'Erreur lors de la modification';
          this.loading = false;
        }
      });
    } else {
      this.weekProblemService.createWeekProblem(body).subscribe({
        next: () => {
          this.submitSuccess = 'Énigme créée';
          this.loading = false;
          setTimeout(()=>this.router.navigate(['/backoffice/weekproblems']), 700);
        },
        error: err => {
          this.submitError = err.message || 'Erreur lors de la création';
          this.loading = false;
        }
      });
    }
  }
}
