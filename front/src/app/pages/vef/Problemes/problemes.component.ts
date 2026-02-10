import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Enigme } from 'src/app/_models/Enigme';
import { AuthService } from 'src/app/_services/auth.service';
import { ConfettiService } from 'src/app/_services/confetti.service';
import { ProblemService } from 'src/app/_services/problem.service';
import { User } from '../../../_models/User';

@Component({
  selector: 'app-problemes',
  templateUrl: './problemes.component.html',
  styleUrls: ['./problemes.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgIf,
    NgClass,
    NgFor,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatError,
  ],
})
export class ProblemesComponent implements OnInit {
  currentUser: User;
  hasLoadedData = false;
  hasBeenSolved = false;

  variables: Array<string> = [];
  titreType = '';
  badAnswer = false;
  voidAnswer = false;
  notNumberAnswer = false;

  problemId: number;
  currentProblem: Enigme;
  reward = 0;
  nbQuestion = 0;
  nbValToFind = 0;
  valuesToFind: Array<Array<number>> = [];
  enigmeLevel = '';
  indicesAVerifier: Array<number> = [];
  problemNotExists = false;
  questionString = '';
  helpsUsed = 0;
  unlockedHelps: Array<string> = [];
  isImageModalOpen = false;
  modalImageSrc = '';
  isImageZoomed = false;

  constructor(
    private problemService: ProblemService,
    private authService: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private confettiService: ConfettiService
  ) {}

  form: FormGroup = new FormGroup({});

  // getField = (field: string): FormControl => this.form.get(field) as FormControl;
  ngOnInit() {
    const userStored = localStorage.getItem('currentUser');
    if (userStored === null) return;
    this.currentUser = JSON.parse(userStored);
    this.initializeRouteParams();
  }

  createVariablesFromList = (): [Array<string>, Array<number>] => {
    const nbQuestions = this.currentProblem?.nb_question || 0;
    const indexList = this.currentProblem?.values_list.map((e, i) => i);

    const randomIndexes: Array<number> = [];
    if (!indexList || indexList == undefined) return [[], []];
    if (
      !this.currentProblem?.variables ||
      !this.currentProblem?.variables.length
    )
      return [[], []];
    Array(nbQuestions)
      .fill(0)
      .map((e, i) => nbQuestions - i)
      .forEach(() => {
        if (indexList) {
          const randomIndex = Math.floor(
            Math.random() * ((indexList.length || 1) - 1)
          );
          randomIndexes.push(indexList[randomIndex]);
          indexList.splice(randomIndex, 1);
        }
      });
    // const randomIndexes = this.getRandomQuestions(this.currentProblem?.nb_question, this.currentProblem.data.length - 1);
    return [this.currentProblem?.variables, randomIndexes.sort()];
  };

  counterArray(n: number): number[] {
    return Array(n)
      .fill(0)
      .map((x, i) => i);
  }

  private initializeRouteParams(): void {
    this.route.params.subscribe(params => {
      this.problemId = parseInt(params['id']);
      this.problemService.hasUserSolvedProblem(this.problemId).subscribe(
        response => {
          this.hasBeenSolved = true;
          this.helpsUsed = response.helps_used;
          this.reward = response.reward;
          this.hasLoadedData = true;
        },
        () => {
          this.loadEnigmeData();
        }
      );
    });
  }

  private loadEnigmeData(): void {
    this.problemService
      .getProblemById(this.problemId)
      .pipe(
        catchError(() => {
          console.error('Error encountered while fetching data');
          return of(null);
        })
      )
      .subscribe(problem => {
        if (!problem) {
          console.error('Probleme non trouvé.');
          return;
        }
        this.currentProblem = problem;
        this.currentProblem.help_cost = [
          problem.help_1_cost,
          problem.help_2_cost,
          problem.help_3_cost,
        ].filter(e => e != null);
        this.nbValToFind = problem.unknowns;
        this.valuesToFind = problem.values_list;
        this.questionString = this.getQuestionString(problem.question);
        this.variables = problem.variables;
        this.reward = problem.reward;
        this.hasLoadedData = true;
        this.currentProblem.niveau = problem.level;
        this.currentProblem?.type === 1 || this.currentProblem?.type === 2
          ? this.handleEnigmeData()
          : this.handleEnigmeDataReg();
      });
  }

  private async handleEnigmeData(): Promise<void> {
    if (this.currentProblem == null) return;
    this.enigmeLevel = levelName[this.currentProblem?.niveau - 1 || 1];
    this.titreType =
      this.currentProblem.type == 1 ? 'Mathématiques' : 'Informatique';

    this.form = this.fb.group({});
    // this.form.setValidators(this.comparisonValidator());
    if (
      !this.currentProblem ||
      !this.nbValToFind ||
      !this.currentProblem.nb_question
    )
      return;
    for (let i = 0; i < this.currentProblem.nb_question; i++) {
      for (let j = 0; j < this.nbValToFind; j++) {
        this.form.addControl(`group${i}_value${j}`, new FormControl());
      }
    }

    [this.variables, this.indicesAVerifier] = this.createVariablesFromList();
  }

  private async handleEnigmeDataReg(): Promise<void> {
    if (this.currentProblem == null) return;
    this.enigmeLevel = levelName[this.currentProblem.niveau - 1 || 1];
    this.nbQuestion = this.currentProblem?.nb_question ?? 1;

    this.titreType = 'Défi de région';
    this.variables = [];

    this.form = this.fb.group({});
    // this.form.setValidators(this.comparisonValidator());
    if (
      this.currentProblem &&
      this.nbValToFind &&
      this.currentProblem.nb_question
    ) {
      for (let i = 0; i < this.currentProblem.nb_question; i++) {
        for (let j = 0; j < this.nbValToFind; j++) {
          this.form.addControl(`group${i}_value${j}`, new FormControl());
        }
      }
    }
  }

  askHint = () => {
    this.problemService
      .getProblemHint(this.problemId, this.helpsUsed + 1)
      .subscribe((response: { [key: string]: any }) => {
        this.helpsUsed += 1;
        this.unlockedHelps.push(response['help']);
        this.authService.sendUpdateMojette(response['mojettes']);
      });
  };

  submitForm() {
    const fieldsErrors = new Set(
      Object.values(this.form.controls)
        .filter(control => control.errors)
        .flatMap(control => Object.keys(control.errors || {}))
        .filter((e, i) => i == 0)
    );

    const formErrors: { [key: string]: boolean } = {};
    fieldsErrors.forEach(error => (formErrors[`${error}`] = true));
    this.form.setErrors(formErrors);

    const valueArray: Array<number> = (
      Object.values(this.form.value) as Array<string>
    ).map(e => parseInt(e));

    const updateEnigmeState = (response: any) => {
      if (response.status == 201) {
        this.hasBeenSolved = true;
        this.authService.sendUpdateMojette(response.body.mojettes);
        // Trigger confetti animation on successful completion
        this.confettiService.trigger();
      }
      if (response.status == 200) {
        this.badAnswer = true;
      }
    };

    if (this.problemId === undefined) return;
    if (!this.currentProblem) return;
    if (valueArray.some(e => Number.isNaN(e))) {
      this.voidAnswer = true;
      return;
    }

    const indices = +this.currentProblem.type != 2 ? this.indicesAVerifier : [];
    this.problemService
      .verifySolution(this.problemId, indices, valueArray, this.helpsUsed)
      .subscribe(updateEnigmeState);
  }

  goToHomePage = (): void => {
    this.router.navigateByUrl('/');
  };

  goToTDFHome = (): void => {
    this.router.navigateByUrl('/vef');
  };

  capitalizeFirstLetter = (str: string): string =>
    str.charAt(0).toUpperCase() + str.slice(1);

  getQuestionString = (questionArray: Array<string>): string =>
    (questionArray || []).map(e => this.capitalizeFirstLetter(e)).join(' ');

  openImageModal(imageSrc?: string) {
    if (!imageSrc) return;
    this.modalImageSrc = imageSrc;
    this.isImageModalOpen = true;
    this.isImageZoomed = false;
    document.body.classList.add('modal-open');
  }

  closeImageModal() {
    this.isImageModalOpen = false;
    this.modalImageSrc = '';
    this.isImageZoomed = false;
    document.body.classList.remove('modal-open');
  }

  toggleImageZoom(event: Event) {
    event.stopPropagation();
    this.isImageZoomed = !this.isImageZoomed;
  }
}

const levelName = ['Facile', 'Moyen', 'Difficile', 'Extrême'];
