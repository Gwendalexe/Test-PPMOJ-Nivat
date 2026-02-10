import _ from 'lodash';
import { Nivat, NivatGridValue } from 'src/app/_models/Nivat';
import { rotateLeftInPlace, rotateRightInPlace } from '../../../utils/arrays';
import { NIVAT_LEVELS } from './nivat-templates';

export class NivatGenerator {
  /**
   * Generates a new shuffled game grid based on difficulty level.
   * Uses predefined templates and applies random permutations.
   *
   * @param level - Difficulty level (1: Easy, 2: Medium, 3: Hard)
   * @returns A deep copy of the generated Nivat grid
   */
  static generateGrid(level: number): Nivat['grid'] {
    // Safety Fallback: Default to level 2 (Medium) if the level doesn't exist
    const availableTemplates = NIVAT_LEVELS[level] || NIVAT_LEVELS[2];

    // Randomly select a template from the list
    const randomIndex = Math.floor(Math.random() * availableTemplates.length);

    // Create a Deep Copy to prevent modifying the original template source
    // (Crucial when reusing templates multiple times)
    const grid = _.cloneDeep(availableTemplates[randomIndex]) as NivatGridValue[][];

    // Determine shuffle intensity: Higher levels = more randomization
    const shuffleCount = level * 20;

    return this.shuffle(grid, shuffleCount);
  }

  /**
   * Applies random row and column rotations to randomize the grid
   * while preserving its solvability properties.
   *
   * @param grid - The grid to shuffle
   * @param moves - Number of random operations to perform
   */
  private static shuffle(grid: NivatGridValue[][], moves: number): NivatGridValue[][] {
    const size = grid.length;

    for (let i = 0; i < moves; i++) {
      const isRowOperation = Math.random() > 0.5;
      const index = Math.floor(Math.random() * size);
      const isPositiveDirection = Math.random() > 0.5;

      if (isRowOperation) {
        // --- Row Rotation ---
        // Modifies the row in place
        if (isPositiveDirection) {
          rotateRightInPlace(grid[index]);
        } else {
          rotateLeftInPlace(grid[index]);
        }
      } else {
        // --- Column Rotation ---
        // Transpose -> Rotate Row (which is effectively a column) -> Transpose back
        // Note: _.unzip handles the matrix transposition
        const transposed = _.unzip(grid) as NivatGridValue[][];

        if (isPositiveDirection) {
          rotateRightInPlace(transposed[index]);
        } else {
          rotateLeftInPlace(transposed[index]);
        }

        // Reconstruct the grid
        grid = _.unzip(transposed) as NivatGridValue[][];
      }
    }

    return grid;
  }
}
