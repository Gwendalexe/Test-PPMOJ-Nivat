import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Services & Models
import { NivatGridValue } from 'src/app/_models/Nivat';
import { AuthService } from 'src/app/_services/auth.service';
import { NivatService } from 'src/app/_services/nivat.service';

// Components
// CORRECTION ICI : Import direct du Component au lieu du Module
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';
import { NivatGenerator } from './nivat-generator';
import { NivatGridComponent } from './nivat-grid.component';

@Component({
  selector: 'app-nivat',
  templateUrl: './nivat.component.html',
  styleUrls: ['./nivat.component.scss'],
  host: { class: 'dark-theme' },
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent, // CORRECTION ICI
    NivatGridComponent,
  ],
})
export class NivatComponent implements OnInit, OnDestroy {
  // --- Game State ---
  gridId: string = '';
  grid: NivatGridValue[][] = [];
  originalGrid: NivatGridValue[][] = [];

  hasStarted = false;
  hasBeenSolved = false;

  // --- Metrics ---
  timer: any;
  timeElapsed = 0;
  displayTime = '00:00';
  currentMoveCount = 0;
  finalMoveCount = 0;

  // --- UI State ---
  isHelpOpen = false;
  isMenuOpen = false;
  selectedLevel = '2';
  reward = 0;

  constructor(
    public router: Router,
    private authService: AuthService,
    private nivatService: NivatService
  ) {}

  ngOnInit(): void {
    this.initGame();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  /* ==========================================================================
     GAME INITIALIZATION & LOGIC
     ========================================================================== */

  initGame(): void {
    this.stopTimer();

    this.hasStarted = false;
    this.hasBeenSolved = false;
    this.timeElapsed = 0;
    this.displayTime = '00:00';
    this.currentMoveCount = 0;
    this.reward = 0;

    const level = parseInt(this.selectedLevel) || 2;
    const newGrid = NivatGenerator.generateGrid(level);

    this.grid = JSON.parse(JSON.stringify(newGrid));
    this.originalGrid = JSON.parse(JSON.stringify(newGrid));

    this.gridId = `local-${Date.now()}`;
  }

  resetCurrentGame(): void {
    this.stopTimer();
    this.hasStarted = false;

    this.timeElapsed = 0;
    this.displayTime = '00:00';
    this.currentMoveCount = 0;

    this.grid = JSON.parse(JSON.stringify(this.originalGrid));
  }

  /* ==========================================================================
     TIMER MANAGEMENT
     ========================================================================== */

  toggleTimer(): void {
    if (this.hasStarted) {
      this.resetCurrentGame();
    } else {
      this.startTimer();
    }
  }

  startTimer(): void {
    if (this.hasStarted) return;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.hasStarted = true;

    this.timer = setInterval(() => {
      this.timeElapsed++;
      this.displayTime = this.formatTime(this.timeElapsed);
    }, 1000);
  }

  stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.hasStarted = false;
  }

  private formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : n.toString());
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  /* ==========================================================================
     EVENT HANDLERS
     ========================================================================== */

  newMoveEventHandler(moveCount: number): void {
    if (!this.hasStarted) {
      this.startTimer();
    }
    this.currentMoveCount = moveCount;
  }

  isSolved(moveCount: number): void {
    this.stopTimer();
    this.finalMoveCount = moveCount;
    this.hasBeenSolved = true;

    const currentLevel = parseInt(this.selectedLevel);

    this.nivatService
      .postSolvedNivat(
        this.gridId,
        this.timeElapsed,
        this.finalMoveCount,
        currentLevel
      )
      .subscribe({
        next: response => {
          if (response && (response.valid || response.reward)) {
            this.handleSuccess(response.reward, response.mojettes);
          }
        },
        error: err => {
          console.error('[Error] Failed to validate score:', err);
          this.handleSuccess(0, 0);
        },
      });
  }

  handleSuccess(reward: number, totalMojettes: number): void {
    this.reward = reward;
    if (totalMojettes > 0) {
      this.authService.sendUpdateMojette(totalMojettes);
    }
  }

  /* ==========================================================================
     UI CONTROLS
     ========================================================================== */

  goToGridBrowse(): void {
    this.initGame();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  selectLevel(level: string): void {
    this.selectedLevel = level;
    this.isMenuOpen = false;
    this.initGame();
  }

  getLevelLabel(): string {
    switch (this.selectedLevel) {
      case '1':
        return 'Facile';
      case '2':
        return 'Moyen';
      case '3':
        return 'Difficile';
      default:
        return 'Moyen';
    }
  }
}
