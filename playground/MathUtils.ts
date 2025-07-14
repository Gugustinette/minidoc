/**
 * Calculates the sum of two numbers
 * @param a - The first number
 * @param b - The second number
 * @returns The sum of a and b
 * @example
 * const result = add(5, 3);
 * console.log(result); // 8
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * A utility class for mathematical operations
 */
export class MathUtils {
  /**
   * The name of the utility
   */
  name: string;

  /**
   * Creates a new MathUtils instance
   * @param name - The name of the utility
   */
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Multiplies two numbers
   * @param x - First number
   * @param y - Second number
   * @returns The product
   */
  multiply(x: number, y: number): number {
    return x * y;
  }
}