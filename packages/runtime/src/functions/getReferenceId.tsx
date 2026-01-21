const map = new WeakMap();
let lastId = 0;

export function getReferenceId(ref: object): number {
  // 验证 ref 是有效对象，避免 WeakMap 键无效错误
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
