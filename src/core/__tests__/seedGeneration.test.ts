/**
 * Tests for seed generation
 */
import { computeSeedCount, generateSeeds } from '../seedGeneration';

// Test seed count calculation
console.log('=== Seed Count Tests ===');

// Test 1: Square images of different sizes should get same seed count
const density = 100;
const count1000 = computeSeedCount(1000, 1000, density, 'aspect');
const count2000 = computeSeedCount(2000, 2000, density, 'aspect');
console.log(`1000x1000 @ density ${density}: ${count1000} seeds`);
console.log(`2000x2000 @ density ${density}: ${count2000} seeds`);
console.assert(count1000 === count2000, 'Square images should have same seed count');

// Test 2: 16:9 images
const count1920 = computeSeedCount(1920, 1080, density, 'aspect');
const count3840 = computeSeedCount(3840, 2160, density, 'aspect');
console.log(`1920x1080 (16:9) @ density ${density}: ${count1920} seeds`);
console.log(`3840x2160 (16:9) @ density ${density}: ${count3840} seeds`);
console.assert(count1920 === count3840, '16:9 images should have same seed count');

// Test 3: Portrait vs landscape with maxAspect strategy
const count16_9_landscape = computeSeedCount(1920, 1080, density, 'maxAspect');
const count9_16_portrait = computeSeedCount(1080, 1920, density, 'maxAspect');
console.log(`1920x1080 (landscape) maxAspect: ${count16_9_landscape} seeds`);
console.log(`1080x1920 (portrait) maxAspect: ${count9_16_portrait} seeds`);
console.assert(
  count16_9_landscape === count9_16_portrait,
  'maxAspect strategy should give same count for portrait/landscape'
);

// Test 4: Deterministic seed generation
const seeds1 = generateSeeds(10, 'test123');
const seeds2 = generateSeeds(10, 'test123');
console.log('Generated 10 seeds with same seed value twice');
console.assert(
  JSON.stringify(seeds1) === JSON.stringify(seeds2),
  'Same seed value should produce identical results'
);

// Test 5: Different seed values produce different results
const seeds3 = generateSeeds(10, 'different');
console.assert(
  JSON.stringify(seeds1) !== JSON.stringify(seeds3),
  'Different seed values should produce different results'
);

// Test 6: Seeds are in normalized range [0, 1]
const seeds = generateSeeds(100, 'rangeTest');
const allInRange = seeds.every(s => s.x01 >= 0 && s.x01 <= 1 && s.y01 >= 0 && s.y01 <= 1);
console.assert(allInRange, 'All seeds should be in [0, 1] range');

console.log('\n✓ All seed generation tests passed!');
