import { mergeRects } from "../../functions/mergeRects";
import { SimpleDOMRect } from "../../types/types";
import type { ComponentInternalInstance, VNode } from "vue";

export function getVueComponentBoundingBox(
  vcomponent: ComponentInternalInstance
) {
  let composedRect: SimpleDOMRect | null = null;
  if (
    vcomponent?.subTree?.children &&
    vcomponent?.subTree?.children instanceof Array
  ) {
    vcomponent?.subTree?.children.forEach((child: any) => {
      const box = getVNodeBoundingBox(child);
      if (!box) {
        return;
      }
      if (box.width <= 0 || box.height <= 0) {
        // ignore zero-sized rects
        return;
      }
      if (composedRect) {
        composedRect = mergeRects(composedRect, box);
      } else {
        composedRect = box;
      }
    });
  }
  return composedRect;
}

export function getVNodeBoundingBox(vnode: VNode): SimpleDOMRect | null {
  if (vnode.el instanceof HTMLElement) {
    return vnode.el.getBoundingClientRect();
  }

  if (vnode.component) {
    return getVueComponentBoundingBox(vnode.component);
  }

  return null;
}
