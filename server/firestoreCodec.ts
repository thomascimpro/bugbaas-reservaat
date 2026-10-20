// Firestore rejects arrays directly inside arrays. Keep queryable fields in
// place and wrap only nested arrays; old documents remain readable unchanged.
const ARRAY_KEY = '__bugbaasArray';

export function encodeFirestorePayload(value: unknown, inArray = false): unknown {
  if (Array.isArray(value)) {
    const items = value.map(item => item === undefined ? null : encodeFirestorePayload(item, true));
    return inArray ? { [ARRAY_KEY]: items } : items;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, encodeFirestorePayload(item)]));
  }
  return value;
}

export function decodeFirestorePayload<T>(value: unknown): T {
  if (Array.isArray(value)) return value.map(item => decodeFirestorePayload(item)) as T;
  if (value && typeof value === 'object') {
    const fields = value as Record<string, unknown>;
    if (Object.keys(fields).length === 1 && Array.isArray(fields[ARRAY_KEY])) {
      return fields[ARRAY_KEY].map(item => decodeFirestorePayload(item)) as T;
    }
    return Object.fromEntries(Object.entries(fields).map(([key, item]) => [key, decodeFirestorePayload(item)])) as T;
  }
  return value as T;
}
