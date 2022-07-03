"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIdsThatHaveExpandedSuccessor = getIdsThatHaveExpandedSuccessor;

function getIdsThatHaveExpandedSuccessor(node, idsToShow) {
  const idsThatHaveExpandedSuccessor = {};

  function walkTree(node) {
    for (const child of node.children) {
      if (walkTree(child)) {
        idsThatHaveExpandedSuccessor[child.uniqueId] = true;
        return true;
      }
    }

    if (idsToShow[node.uniqueId]) {
      idsThatHaveExpandedSuccessor[node.uniqueId] = true;
      return true;
    }

    return false;
  }

  if (walkTree(node)) {
    idsThatHaveExpandedSuccessor[node.uniqueId] = true;
  }

  return idsThatHaveExpandedSuccessor;
}