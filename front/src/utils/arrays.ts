/**
 * Rotates an array to the right by one position.
 * This function modifies the array in place and does not create a copy.
 *
 * @param {Array<T>} array - The array to be rotated.
 * @returns {void} The function does not return anything; it modifies the input array.
 *
 * @example
 * let arr = [1, 2, 3, 4];
 * rotateRightInPlace(arr);
 * console.log(arr); // Output: [4, 1, 2, 3]
 */
export function rotateRightInPlace<T>(array: Array<T>): void {
  if (array.length === 0) {
    throw new Error('The array to rotate should not be empty.');
  }
  // We now know that the array is not empty. So disable the no-non-null-assertion eslint warning.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  array.unshift(array.pop()!);
}

/**
 * Rotates an array to the Left by one position.
 * This function modifies the array in place and does not create a copy.
 *
 * @param {Array<T>} array - The array to be rotated.
 * @returns {void} The function does not return anything; it modifies the input array.
 *
 * @example
 * let arr = [1, 2, 3, 4];
 * rotateLeftInPlace(arr);
 * console.log(arr); // Output: [2, 3, 4, 1]
 */
export function rotateLeftInPlace<T>(array: Array<T>): void {
  if (array.length === 0) {
    throw new Error('The array to be rotated should not be empty.');
  }
  // We now know that the array is not empty. So disable the no-non-null-assertion eslint warning.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  array.push(array.shift()!);
}
