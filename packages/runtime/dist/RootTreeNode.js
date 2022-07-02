"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RootTreeNode = RootTreeNode;

var _web = require("solid-js/web");

var _TreeNode = require("./TreeNode");

function RootTreeNode(props) {
  function getIdsThatHaveExpandedSuccessor() {
    const idsThatHaveExpandedSuccessor = {};

    function walkTree(node) {
      for (const child of node.children) {
        if (walkTree(child)) {
          idsThatHaveExpandedSuccessor[child.uniqueId] = true;
          return true;
        }
      }

      if (props.idsToShow[node.uniqueId]) {
        idsThatHaveExpandedSuccessor[node.uniqueId] = true;
        return true;
      }

      return false;
    }

    if (walkTree(props.node)) {
      idsThatHaveExpandedSuccessor[props.node.uniqueId] = true;
    }

    return idsThatHaveExpandedSuccessor;
  }

  return (0, _web.createComponent)(_TreeNode.TreeNode, {
    get node() {
      return props.node;
    },

    get idsToShow() {
      return props.idsToShow;
    },

    get idsThatHaveExpandedSuccessor() {
      return getIdsThatHaveExpandedSuccessor();
    }

  });
}