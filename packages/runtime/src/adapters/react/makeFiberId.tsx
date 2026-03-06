import { Fiber } from "@locator/shared";

let globalIdCounter = 0;
const globalIdMap = new WeakMap<Fiber, string>();

export function makeFiberId(fiber: Fiber) {
  if (fiber._debugID) {
    return fiber._debugID.toString();
  }
  
  // 验证 fiber 是有效对象，避免 WeakMap 键无效错误
  if (typeof fiber !== 'object' || fiber === null) {
    globalIdCounter++;
    return `fiber:${globalIdCounter}`;
  }
  
  const found = globalIdMap.get(fiber);
  if (found) {
    return found;
  } else {
    globalIdCounter++;
    const id = `fiber:${globalIdCounter}`;
    globalIdMap.set(fiber, id);
    return id;
  }
}
