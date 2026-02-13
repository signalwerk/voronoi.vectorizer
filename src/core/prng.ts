/**
 * Seeded pseudo-random number generator
 * Provides deterministic randomness for reproducible results
 */
import seedrandom from "seedrandom";

export class SeededRandom {
  private rng: seedrandom.PRNG;

  constructor(seed: string) {
    this.rng = seedrandom(seed);
  }

  /**
   * Generate a random number in [0, 1)
   */
  next(): number {
    return this.rng();
  }

  /**
   * Generate a random number in [min, max)
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generate a random integer in [min, max]
   */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
}
