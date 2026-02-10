import { NivatGridValue } from 'src/app/_models/Nivat';

/**
 * Type representing a single solved game grid (Matrix of -1, 0, 1).
 */
type GridTemplate = NivatGridValue[][];

/**
 * Repository of pre-solved Nivat grids (Kernels).
 * * These grids act as "seeds" for the generator. They are mathematically balanced
 * (sum of rows and columns = 0). The generator selects one and applies
 * random permutations to create a unique puzzle for the player.
 */
export const NIVAT_LEVELS: { [key: number]: GridTemplate[] } = {
  // ==========================================================================
  // LEVEL 1 : EASY (4x4)
  // Small matrices, easier to visualize and solve.
  // ==========================================================================
  1: [
    [
      [1, -1, 0, 0],
      [-1, 1, 0, 0],
      [0, 0, 1, -1],
      [0, 0, -1, 1],
    ],
    [
      [1, 1, -1, -1],
      [-1, -1, 1, 1],
      [1, -1, 1, -1],
      [-1, 1, -1, 1],
    ],
  ],

  // ==========================================================================
  // LEVEL 2 : MEDIUM (5x5)
  // Standard difficulty used by default.
  // ==========================================================================
  2: [
    [
      [1, 0, -1, 0, 0],
      [0, 1, 0, -1, 0],
      [0, 0, 1, 0, -1],
      [-1, 0, 0, 1, 0],
      [0, -1, 0, 0, 1],
    ],
    [
      [1, -1, 0, 1, -1],
      [-1, 1, 0, -1, 1],
      [0, 0, 0, 0, 0],
      [1, -1, 0, 1, -1],
      [-1, 1, 0, -1, 1],
    ],
  ],

  // ==========================================================================
  // LEVEL 3 : HARD (6x6)
  // Larger matrices requiring more complex moves.
  // ==========================================================================
  3: [
    [
      [1, -1, 0, 0, 0, 0],
      [-1, 1, 0, 0, 0, 0],
      [0, 0, 1, -1, 0, 0],
      [0, 0, -1, 1, 0, 0],
      [0, 0, 0, 0, 1, -1],
      [0, 0, 0, 0, -1, 1],
    ],
    [
      [1, 1, -1, -1, 0, 0],
      [0, 1, 1, -1, -1, 0],
      [0, 0, 1, 1, -1, -1],
      [-1, 0, 0, 1, 1, -1],
      [-1, -1, 0, 0, 1, 1],
      [1, -1, -1, 0, 0, 1],
    ],
    [
      [1, 1, 1, -1, -1, -1],
      [1, 1, 1, -1, -1, -1],
      [1, 1, 1, -1, -1, -1],
      [-1, -1, -1, 1, 1, 1],
      [-1, -1, -1, 1, 1, 1],
      [-1, -1, -1, 1, 1, 1],
    ],
  ],
};
