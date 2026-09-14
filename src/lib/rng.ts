// Deterministic seeded PRNG so demo data stays stable across renders/requests
// instead of reshuffling on every navigation.
export function createRng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return function rng() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function range(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function rangeInt(rng: () => number, min: number, max: number): number {
  return Math.floor(range(rng, min, max + 1));
}
