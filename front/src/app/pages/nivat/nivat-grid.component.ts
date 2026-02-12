import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import _ from 'lodash';

// Models & Utils
import { Colors } from 'src/app/_models/Generics';
import { MoveDirection, NivatGridValue } from 'src/app/_models/Nivat';
import { rotateLeftInPlace, rotateRightInPlace } from 'src/utils/arrays';

@Component({
  selector: 'app-nivat-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nivat-grid.component.html',
  styleUrls: ['./nivat-grid.component.scss'],
})
export class NivatGridComponent implements OnChanges {
  // --- Inputs / Outputs ---

  /** The current state of the game grid (matrix of -1, 0, 1) */
  @Input() grid: NivatGridValue[][] = [];

  /** Si true, la grille est gelée (victoire) */
  @Input() isLocked: boolean = false;

  /** Emits the total move count after every valid move */
  @Output() newMoveEvent = new EventEmitter<number>();

  /** Emits the final move count when the puzzle is solved */
  @Output() isSolvedEvent = new EventEmitter<number>();

  /** Emits signal when user tries to play on a locked grid */
  @Output() interactionWhenLocked = new EventEmitter<void>();

  // --- State ---

  public moveCnt = 0;

  // Expose Enum to template
  readonly MoveDirection = MoveDirection;

  /* ==========================================================================
     LIFECYCLE HOOKS
     ========================================================================== */

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['grid']) {
      // Si la grille change (nouvelle partie), on reset le compteur interne
      // Attention : on ne reset PAS si c'est juste isLocked qui change
      if (!changes['grid'].firstChange) {
        // Optionnel: logique spécifique si besoin
      }
      this.moveCnt = 0;
    }
  }

  /* ==========================================================================
     GAME LOGIC
     ========================================================================== */

  /**
   * Resets the local move counter.
   */
  reset(): void {
    this.moveCnt = 0;
  }

  /**
   * Handles row/column shifting logic.
   * Updates the grid state and checks for victory.
   */
  move(index: number, direction: MoveDirection): void {
    // 1. VÉRIFICATION DU VERROUILLAGE
    if (this.isLocked) {
      this.interactionWhenLocked.emit();
      return; // On ne fait rien d'autre
    }

    this.moveCnt++;
    this.newMoveEvent.emit(this.moveCnt);

    switch (direction) {
      // --- Column Operations (Require Transposition) ---
      case MoveDirection.Up: {
        this.rotateColumn(index, 'left');
        break;
      }
      case MoveDirection.Down: {
        this.rotateColumn(index, 'right');
        break;
      }

      // --- Row Operations (Direct) ---
      case MoveDirection.Left: {
        rotateLeftInPlace(this.grid[index]);
        break;
      }
      case MoveDirection.Right: {
        rotateRightInPlace(this.grid[index]);
        break;
      }
    }

    this.checkForSolution();
  }

  /**
   * Helper to rotate a column by transposing the matrix first.
   */
  private rotateColumn(colIndex: number, direction: 'left' | 'right'): void {
    // 1. Transpose matrix to treat columns as rows
    const transposed = _.unzip(this.grid) as NivatGridValue[][];

    // 2. Rotate the specific "row" (which is actually our column)
    if (direction === 'left') {
      rotateLeftInPlace(transposed[colIndex]);
    } else {
      rotateRightInPlace(transposed[colIndex]);
    }

    // 3. Transpose back to original orientation
    this.grid = _.unzip(transposed) as NivatGridValue[][];
  }

  /**
   * Checks if all rows and columns sum to zero.
   * If solved, emits the victory event.
   */
  checkForSolution(): void {
    // Check Rows
    const allRowsSolved = this.grid.every(row => _.sum(row) === 0);

    // Check Columns (using transpose)
    const allColsSolved = _.unzip(this.grid).every((col: any[]) => _.sum(col) === 0);

    if (allColsSolved && allRowsSolved) {
      this.isSolvedEvent.emit(this.moveCnt);
    }
  }

  /* ==========================================================================
     VIEW HELPERS (Rendering)
     ========================================================================== */

  getCellColor(value: NivatGridValue): string {
    switch (value) {
      case -1:
        return Colors.Red;
      case 0:
        return Colors.Yellow;
      case 1:
        return Colors.Blue;
      default:
        return Colors.Yellow;
    }
  }

  getRowSum(rowIndex: number): number {
    return _.sum(this.grid[rowIndex]);
  }

  getColSum(colIndex: number): number {
    return this.grid.reduce((sum, row) => sum + row[colIndex], 0);
  }

  getGridTemplate(): string {
    if (!this.grid || this.grid.length === 0) return '';
    const nbCols = this.grid[0].length;
    return `48px repeat(${nbCols}, 48px) 24px 24px`;
  }

  getDisplayValue(value: NivatGridValue): string {
    switch (value) {
      case 1:
        return '+';
      case -1:
        return '-';
      default:
        return '0';
    }
  }
}
