export function mergeRects(a: DOMRect, b: DOMRect): DOMRect {
  const newRect = new DOMRect();

  newRect.x = Math.min(a.x, b.x);
  newRect.y = Math.min(a.y, b.y);
  newRect.width = Math.max(a.x + a.width, b.x + b.width) - newRect.x;
  newRect.height = Math.max(a.y + a.height, b.y + b.height) - newRect.y;

  return newRect;
}
