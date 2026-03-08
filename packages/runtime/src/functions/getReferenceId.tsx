const map = new WeakMap();
let lastId = 0;

export function getReferenceId(ref: object): number {
  // Validate ref is a valid object to avoid invalid WeakMap key errors
  if (typeof ref !== 'object' || ref === null) {
    lastId++;
    return lastId;
  }
  
  if (!map.has(ref)) {
    lastId++;
    map.set(ref, lastId);
  }
  return map.get(ref);
}
