
export function seededNumber(seed: string, index: number): number {
  const text = `${seed}:${index}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

export function seededLane(seed: string, index: number): 0 | 1 | 2 {
  return Math.floor(seededNumber(seed, index) * 3) as 0 | 1 | 2;
}
