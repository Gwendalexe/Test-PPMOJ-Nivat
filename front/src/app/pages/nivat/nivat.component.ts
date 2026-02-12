import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Services & Models
import { NivatGridValue } from 'src/app/_models/Nivat';
import { AuthService } from 'src/app/_services/auth.service';
import { NivatService } from 'src/app/_services/nivat.service';

// Components
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
  imports: [CommonModule, FormsModule, NavbarComponent, NivatGridComponent],
})
export class NivatComponent implements OnInit, OnDestroy {
  // --- Game State ---
  gridId: string = '';
  grid: NivatGridValue[][] = [];
  originalGrid: NivatGridValue[][] = [];

  hasStarted = false;
  hasBeenSolved = false;
  isVictoryPopupOpen = false;

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

  /**
   * Initializes a brand new game with a new random grid.
   */
  initGame(): void {
    this.stopTimer();

    this.hasStarted = false;
    this.hasBeenSolved = false;
    this.isVictoryPopupOpen = false;
    this.timeElapsed = 0;
    this.displayTime = '00:00';
    this.currentMoveCount = 0;
    this.reward = 0;

    const level = parseInt(this.selectedLevel) || 2;
    const newGrid = NivatGenerator.generateGrid(level);

    this.grid = JSON.parse(JSON.stringify(newGrid));
    this.originalGrid = JSON.parse(JSON.stringify(newGrid));

    this.gridId = `local-${Date.now()}`;

    // Auto-start timer if user selects level
    // this.startTimer();
  }

  /**
   * Resets the CURRENT grid to its initial state (Restart).
   */
  resetCurrentGame(): void {
    this.stopTimer();
    this.hasStarted = false;
    this.hasBeenSolved = false; // Unlock grid
    this.isVictoryPopupOpen = false; // Close popup

    this.timeElapsed = 0;
    this.displayTime = '00:00';
    this.currentMoveCount = 0;

    // Restore original grid copy
    this.grid = JSON.parse(JSON.stringify(this.originalGrid));
  }

  /**
   * Called when user clicks on grid while it's locked (finished).
   */
  proposeRestart(): void {
    if (confirm('La partie est terminée. Voulez-vous rejouer cette grille depuis le début ?')) {
      this.resetCurrentGame();
      this.startTimer(); // On relance le timer direct pour fluidité
    }
  }

  /* ==========================================================================
     TIMER MANAGEMENT
     ========================================================================== */

  /**
   * Main Start/Reset button handler.
   */
  toggleTimer(): void {
    if (this.hasStarted || this.hasBeenSolved) {
      // Si c'est en cours OU fini, le bouton agit comme un Reset
      this.resetCurrentGame();
    } else {
      // Sinon c'est un Start
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

    // Tick every second
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

  isSolved(finalMoveCount: number): void {
    // 1. Stop Everything
    this.stopTimer();

    // 2. Save final state
    this.finalMoveCount = finalMoveCount;
    this.hasBeenSolved = true; // Locks the grid
    this.isVictoryPopupOpen = true; // Shows popup

    // 3. Send to Backend
    const currentLevel = parseInt(this.selectedLevel);
    this.nivatService.postSolvedNivat(this.gridId, this.timeElapsed, this.finalMoveCount, currentLevel).subscribe({
      next: response => {
        if (response && (response.valid || response.reward)) {
          this.handleSuccess(response.reward, response.mojettes);
        }
      },
      error: err => {
        console.error('[Error] Failed to validate score:', err);
        // Even on error, we show the success screen locally
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

  closeVictoryPopup() {
    this.isVictoryPopupOpen = false;
  }

  /* ==========================================================================
     UI CONTROLS
     ========================================================================== */

  goToGridBrowse(): void {
    // Generates a NEW grid (different puzzle)
    this.initGame();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  selectLevel(level: string): void {
    if (this.selectedLevel !== level) {
      this.selectedLevel = level;
      this.isMenuOpen = false;
      this.initGame();
    } else {
      this.isMenuOpen = false;
    }
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
