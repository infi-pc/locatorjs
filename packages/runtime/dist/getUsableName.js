"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUsableName = getUsableName;

// function printDebugOwnerTree(fiber: Fiber): string | null {
//   let current: Fiber | null = fiber || null;
//   let results = [];
//   while (current) {
//     results.push(getUsableName(current));
//     current = current._debugOwner || null;
//   }
//   console.log('DEBUG OWNER: ', results);
//   return null;
// }
// function printReturnTree(fiber: Fiber): string | null {
//   let current: Fiber | null = fiber || null;
//   let results = [];
//   while (current) {
//     results.push(getUsableName(current));
//     current = current.return || null;
//   }
//   console.log('RETURN: ', results);
//   return null;
// }
function getUsableName(fiber) {
  var _fiber$elementType$ty, _fiber$elementType$_p, _fiber$elementType$_p2;

  if (!fiber) {
    return "Not found";
  }

  if (typeof fiber.elementType === "string") {
    return fiber.elementType;
  }

  if (!fiber.elementType) {
    return "Anonymous";
  }

  if (fiber.elementType.name) {
    return fiber.elementType.name;
  } // Not sure about this


  if (fiber.elementType.displayName) {
    return fiber.elementType.displayName;
  } // Used in rect.memo


  if ((_fiber$elementType$ty = fiber.elementType.type) !== null && _fiber$elementType$ty !== void 0 && _fiber$elementType$ty.name) {
    return fiber.elementType.type.name;
  }

  if ((_fiber$elementType$_p = fiber.elementType._payload) !== null && _fiber$elementType$_p !== void 0 && (_fiber$elementType$_p2 = _fiber$elementType$_p._result) !== null && _fiber$elementType$_p2 !== void 0 && _fiber$elementType$_p2.name) {
    return fiber.elementType._payload._result.name;
  }

  return "Anonymous";
}