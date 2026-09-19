// Deterministic pseudo-randomness.
//
// Every piece of "inventory" in this app (which cinemas carry a title, what
// times they run, which seats are already sold) is generated on the client
// rather than fetched from a booking backend. Seeding it means a given show
// looks identical on every render, refresh and revisit - so a seat that was
// grey a second ago isn't green after a re-render.

export function hashString(input) {
  let h = 2166136261;
  const str = String(input ?? "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Linear congruential generator - cheap, and good enough for cosmetic variety.
export function createRandom(seed) {
  let state = hashString(seed) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function randomInt(rand, min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}

export function pickOne(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

// Fisher-Yates using the supplied generator, then take the first `count`.
export function pickSome(rand, list, count) {
  const pool = [...list];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
