import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InternalService } from '../../_services/internal.service';

import { NgClass, NgFor, NgIf } from '@angular/common';
import {
    FormBuilder,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { firstValueFrom, forkJoin } from 'rxjs';
import { EnigmeSemaine } from 'src/app/_models/Enigme_semaine';
import { User } from 'src/app/_models/User';
import { AuthService } from 'src/app/_services/auth.service';
import { WeekProblemService } from 'src/app/_services/week_problem.service';
import { environment } from 'src/environments/environment';
import { ConfettiService } from '../../_services/confetti.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
    selector: 'app-enigme-semaine',
    templateUrl: './enigme-semaine.component.html',
    styleUrls: ['./enigme-semaine.component.scss'],
    host: { class: 'dark-theme' },
    imports: [NavbarComponent, NgFor, NgIf, NgClass, RouterModule, FormsModule, ReactiveFormsModule, MatFormField, MatError, MatInput]
})
export class EnigmeSemaineComponent implements OnInit {
  user: User | null = null;
  queryParams = -1;
  image_path: string = '../../../assets/enigmes-semaine/';
  enigme: EnigmeSemaine | null = null;
  enigmes: EnigmeSemaine[];
  historyEnigmes: EnigmeSemaine[] = [];
  showWeekPicker = false;
  weekMap: { [week: number]: { id: number; date: string } } = {};
  weeks: Array<{ num: number; hasProblem: boolean; id?: number }> = [];
  completedWeekIds: Set<number> = new Set();
  isCompletedCurrent = false;
  dateString: string = '';
  indicesAVerifier: number[] = [];
  validInputs: boolean[] = [];
  allValid = false;
  isLoading: boolean = true;
  isImageModalOpen = false;
  modalImageSrc = '';
  isImageZoomed = false;

  // Formats pour le téléchargement des images d'enigme,
  // pour rajouter un format rajouter juste une ligne au tableau
  // avec le nom du format et les dimensions souhaitées
  formats = [
    { name: 'Instagram Post', width: 1080, height: 1080, format: 'png' },
    { name: 'Instagram Story', width: 1080, height: 1920, format: 'png' },
    { name: 'Facebook Post', width: 1200, height: 630, format: 'png' },
    { name: 'LinkedIn Post', width: 1200, height: 627, format: 'png' },
    { name: 'Twitter Post', width: 1200, height: 675, format: 'png' },
  ];

  constructor(
    private internalService: InternalService,
    private route: ActivatedRoute,
    private router: Router,
    private weekProblemeService: WeekProblemService,
    private authService: AuthService,
    private fb: FormBuilder,
    private confettiService: ConfettiService,
  ) {}

  form: FormGroup = new FormGroup({});

  async ngOnInit(): Promise<void> {
    this.validInputs = new Array(this.indicesAVerifier.length).fill(null);
    this.user = this.internalService.loadUserFromLocalStorage();
    if (!this.user || !this.user.id) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.route.paramMap.subscribe(async params => {
      this.isLoading = true;
      const id = params.get('id');

      // Load week problems and the specific enigme in parallel
      forkJoin({
        weekProblems: this.weekProblemeService.getWeekProblems(),
        enigme: id
          ? this.weekProblemeService.getWeekProblemById(id)
          : this.weekProblemeService.getCurrentWeekProblem()
      }).subscribe({
        next: async ({ weekProblems, enigme }) => {
          this.enigmes = weekProblems.filter(wp => wp.displayed === true || wp.displayed === undefined);
          this.enigme = enigme;

          await this.handleEnigmeData();
          // Load completion set before painting calendar
          this.weekProblemeService.getCompletedWeekProblems().subscribe({
            next: ({ completed_ids }) => {
              this.completedWeekIds = new Set(completed_ids || []);
              this.isCompletedCurrent = !!(this.enigme?.id && this.completedWeekIds.has(this.enigme.id));
              this.computeHistory();
              this.computeWeeks();
              this.isLoading = false;
            },
            error: () => {
              this.computeHistory();
              this.computeWeeks();
              this.isLoading = false;
            }
          });

        },
        error: (error) => {
          console.error('Error loading enigme:', error);
          this.isLoading = false;
        }
      });
    });
  }

  async handleRouteParam(id: string | null) {
    // Reset validation state when loading a new problem
    this.allValid = false;
    this.validInputs = [];

    if (id) {
      const res = await firstValueFrom(this.weekProblemeService.getWeekProblemById(id));
      this.enigme = res;
    } else {
      const res = await firstValueFrom(this.weekProblemeService.getCurrentWeekProblem());
      this.enigme = res;
    }

    this.validInputs = new Array(this.enigme.nb_val_to_find).fill(true);
    this.dateString = this.formatDateFrench(this.enigme.date);
  }

  // This method is now called from ngOnInit after enigme is loaded

  private async handleEnigmeData(): Promise<void> {
    if (this.enigme == null) return;

    // Reset validation state
    this.allValid = false;
    this.validInputs = [];

    this.validInputs = new Array(this.enigme.nb_val_to_find).fill(true);
    this.dateString = this.formatDateFrench(this.enigme.date);

    this.form = this.fb.group({});
    this.indicesAVerifier = this.createVariablesFromList();
    for (let i of this.indicesAVerifier) {
      this.form.addControl(`question${i}`,new FormControl('', [
        Validators.required
      ]));
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // pour afficher les erreurs sur tous les champs
    }

    const values = this.form.value;
    this.allValid = true;
    for (let i = 0; i < this.indicesAVerifier.length; i++) {
      const input = values[`question${this.indicesAVerifier[i]}`];
      const isValid = input === this.enigme?.solution[this.indicesAVerifier[i]];
      this.validInputs[i] = isValid;
      if (!isValid) this.allValid = false;
    }

    if (this.allValid) {
      if (this.enigme && this.enigme.id) {
        const valuesToSend: number[] = this.indicesAVerifier.map((idx) => Number(this.form.value[`question${idx}`]));
        const indicesToSend: number[] = [...this.indicesAVerifier];
        this.weekProblemeService.verifyWeekProblem(this.enigme.id, valuesToSend, indicesToSend, 0).subscribe({
          next: (resp) => {
            // Update header balances immediately
            try {
              const currentUserStr = localStorage.getItem('currentUser');
              if (currentUserStr) {
                const currentUser = JSON.parse(currentUserStr);
                const newMojettes = (currentUser.mojettes || 0) + (resp?.mojettes || 0);
                const newTokens = (currentUser.token_coin || 0) + (resp?.reward || 0);
                // Increment mojettes via Subject (keeps previous design)
                if ((resp?.mojettes || 0) > 0) this.authService.sendUpdateMojette(resp.mojettes);
                // Update tokens by sending the new absolute value (service expects absolute)
                this.authService.sendUpdateTokenCoin(newTokens);
              }
            } catch {}
            // Also refresh from API to keep storage authoritative without reload
            this.authService.reloadUser(false);
            // Refresh weeks data to update any dependent UI
            this.weekProblemeService.getWeekProblems().subscribe({
              next: (problems) => {
                this.enigmes = problems.filter(wp => wp.displayed === true || wp.displayed === undefined);
                this.computeHistory();
                this.computeWeeks();
                if (this.enigme?.id) this.completedWeekIds.add(this.enigme.id);
                this.isCompletedCurrent = true;
                // Trigger confetti animation on successful completion (when rewards are given, meaning it's a new completion)
                if (resp && (resp.mojettes > 0 || resp.reward > 0)) {
                  this.confettiService.trigger();
                }
              },
              error: () => {}
            });
          },
          error: () => {}
        });
      }
    }
  }

  createVariablesFromList(): number[] {
    const nbQuestions = this.enigme?.nb_val_to_find || 0;
    const indexList = this.enigme?.values_list.map((e, i) => i);

    const randomIndexes: Array<number> = [];
    if (!indexList || indexList == undefined) return [];
    if (
      !this.enigme?.variables ||
      !this.enigme?.variables.length
    )
      return [];
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
    return randomIndexes.sort();
  };

  counterArray(n: number): number[] {
    return Array(n)
      .fill(0)
      .map((x, i) => i);
  }

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

    if (this.enigme?.id === undefined) return;
    if (!this.enigme) return;
  }

  async createImageBlob(
    width: number,
    height: number,
    format: 'png' | 'jpeg'
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mainImg = new Image();
      mainImg.crossOrigin = 'anonymous';
      mainImg.src = this.image_path + this.enigme?.figure_path;

      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = '../../../assets/logo_ppmoj.png'; // Path du logo a modifier lorsque nouveau logo

      Promise.all([
        new Promise<void>((res, rej) => {
          mainImg.onload = () => res();
          mainImg.onerror = () => rej('Erreur chargement image principale');
        }),
        new Promise<void>((res, rej) => {
          logoImg.onload = () => res();
          logoImg.onerror = () => rej('Erreur chargement logo');
        }),
      ])
        .then(() => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.width = width;
          canvas.height = height;

          // Fond noir
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, width, height);

          // Redimensionnement proportionnel de l'image principale
          const ratio = Math.min(width / mainImg.width, height / mainImg.height);
          const newWidth = mainImg.width * ratio;
          const newHeight = mainImg.height * ratio;
          const offsetX = (width - newWidth) / 2;
          const offsetY = (height - newHeight) / 2;

          ctx.drawImage(mainImg, offsetX, offsetY, newWidth, newHeight);

          // Taille du logo (35% de la largeur du canvas a changer si vous voulez un logo plus large par rapport a l'image téléchargée)
          const logoWidth = width * 0.35;
          const logoRatio = logoWidth / logoImg.width;
          const logoHeight = logoImg.height * logoRatio;

          // Position en bas à droite avec un petit padding (modifier le padding si vous voulez eloigner / rapprocher le logo du bord bas a droite)
          const padding = 10;
          const logoX = width - logoWidth - padding;
          const logoY = height - logoHeight - padding;

          ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject('Erreur création Blob');
            },
            `image/${format}`,
            1
          );
        })
        .catch((err) => reject(err));
    });
  }

  async downloadImage(format: 'png' | 'jpeg', width: number, height: number) {
    const blob = await this.createImageBlob(width, height, format);
    const link = document.createElement('a');
    link.download = `enigme-${this.enigme?.date}.${format}`; // nom du fichier téléchargé
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async shareImage() {
    const blob = await this.createImageBlob(1080, 1080, 'png');
    const file = new File([blob], `enigme-${this.enigme?.date}.png`, { type: 'image/png' });

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Enigme de la semaine',
          text: `Voici l'énimge PPMOJ de la semaine`,
          files: [file]
        });
      } catch (err) {
        console.error('Partage annulé ou erreur :', err);
      }
    } else {
      alert('Le partage natif n’est pas supporté sur cet appareil.');
    }
  }

  onFormatSelect(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (!value) return;
    const [size, format] = value.split('|');
    const [width, height] = size.split('x').map(Number);
    this.downloadImage(format as 'png' | 'jpeg', width, height);
  }

  // Methode pour écrire une date style 2025/08/15 en francais style Lundi 15 aout 2025
  formatDateFrench(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    return date.toLocaleDateString('fr-FR', options);
  }

  goToHomePage = (): void => {
    this.router.navigateByUrl('/');
  };

  private computeHistory(): void {
    if (!this.enigmes || !this.enigmes.length) return;
    const orderedAsc = [...this.enigmes]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    this.historyEnigmes = orderedAsc.slice(-4);
  }

  private computeWeeks(): void {
    this.weekMap = {};
    if (this.enigmes) {
      for (const e of this.enigmes) {
        const w = this.getISOWeekNumber(new Date(e.date));
        // Keep the latest by date for a given week
        if (!this.weekMap[w] || new Date(e.date) > new Date(this.weekMap[w].date)) {
          this.weekMap[w] = { id: e.id, date: e.date };
        }
      }
    }
    const totalWeeks = 53; // ISO weeks can go up to 53
    this.weeks = Array.from({ length: totalWeeks }, (_, i) => {
      const num = i + 1;
      const mapping = this.weekMap[num];
      return { num, hasProblem: !!mapping, id: mapping?.id };
    });
  }

  toggleWeekPicker(): void {
    this.showWeekPicker = !this.showWeekPicker;
  }

  selectWeek(weekNum: number): void {
    const mapping = this.weekMap[weekNum];
    if (mapping?.id) {
      this.router.navigate(['/enigme-semaine', mapping.id]);
      this.showWeekPicker = false;
    }
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

  getFigureUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/assets')) return path;
    if (path.startsWith('/week_problems/image/')) {
      return `${environment.apiUrl}${path}`;
    }
    // fallback for any legacy/other
    return path;
  }

  // Removed duplicate ISO week helpers

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
