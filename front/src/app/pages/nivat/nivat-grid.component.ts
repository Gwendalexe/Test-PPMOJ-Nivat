import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'; // 1. OnChanges, SimpleChanges ajoutés
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
  // 2. Implements OnChanges ajouté
  // --- Inputs / Outputs ---

  /** The current state of the game grid (matrix of -1, 0, 1) */
  @Input() grid: NivatGridValue[][] = [];

  /** Emits the total move count after every valid move */
  @Output() newMoveEvent = new EventEmitter<number>();

  /** Emits the final move count when the puzzle is solved */
  @Output() isSolvedEvent = new EventEmitter<number>();

  // --- State ---

  public moveCnt = 0;

  // Expose Enum to template
  readonly MoveDirection = MoveDirection;

  /* ==========================================================================
     LIFECYCLE HOOKS (LA CORRECTION EST ICI)
     ========================================================================== */

  // 3. Cette méthode détecte quand le parent change la grille (changement de niveau)
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['grid']) {
      this.reset(); // On remet le compteur à 0
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
   * * @param index - Index of the row or column to move
   * @param direction - Direction of the shift (Up, Down, Left, Right)
   */
  move(index: number, direction: MoveDirection): void {
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

  /**
   * Returns the color code associated with the cell value.
   */
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
    // Sum vertical column by iterating rows
    return this.grid.reduce((sum, row) => sum + row[colIndex], 0);
  }

  /**
   * Generates CSS Grid Template string based on matrix size.
   * Format: [HeaderCol] [GridCols...] [LeftButton] [RightButton]
   */
  getGridTemplate(): string {
    if (!this.grid || this.grid.length === 0) return '';
    const nbCols = this.grid[0].length;
    // 48px = cell size, 24px = button size
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
