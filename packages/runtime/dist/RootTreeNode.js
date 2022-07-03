"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RootTreeNode = RootTreeNode;

var _web = require("solid-js/web");

var _TreeNode = require("./TreeNode");

var _solidJs = require("solid-js");

var _getIdsThatHaveExpandedSuccessor = require("./getIdsThatHaveExpandedSuccessor");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<button>...</button>`, 2),
      _tmpl$2 = /*#__PURE__*/(0, _web.template)(`<button>&lt;&lt;&lt;</button>`, 2);

function RootTreeNode(props) {
  const idsThatHaveExpandedSuccessor = (0, _solidJs.createMemo)(() => {
    return (0, _getIdsThatHaveExpandedSuccessor.getIdsThatHaveExpandedSuccessor)(props.node, props.idsToShow);
  });
  const expandedNode = (0, _solidJs.createMemo)(() => {
    return findExpandedNode(props.node, props.idsToShow, idsThatHaveExpandedSuccessor());
  });
  const [expanded, setExpanded] = (0, _solidJs.createSignal)(false);
  return (0, _web.memo)((() => {
    const _c$ = (0, _web.memo)(() => {
      var _expandedNode;

      return !!(expandedNode() && ((_expandedNode = expandedNode()) === null || _expandedNode === void 0 ? void 0 : _expandedNode.uniqueId) !== props.node.uniqueId && !expanded());
    }, true);

    return () => _c$() ? [(() => {
      const _el$ = _tmpl$.cloneNode(true);

      _el$.addEventListener("click", () => {
        setExpanded(true);
      }, true);

      return _el$;
    })(), (0, _web.createComponent)(_TreeNode.TreeNode, {
      get node() {
        return expandedNode();
      },

      get idsToShow() {
        return props.idsToShow;
      },

      get idsThatHaveExpandedSuccessor() {
        return idsThatHaveExpandedSuccessor();
      }

    })] : [(() => {
      const _el$2 = _tmpl$2.cloneNode(true);

      _el$2.addEventListener("click", () => {
        setExpanded(false);
      }, true);

      return _el$2;
    })(), (0, _web.createComponent)(_TreeNode.TreeNode, {
      get node() {
        return props.node;
      },

      get idsToShow() {
        return props.idsToShow;
      },

      get idsThatHaveExpandedSuccessor() {
        return idsThatHaveExpandedSuccessor();
      }

    })];
  })());
} // walk the tree to find the closest node that is expanded


function findExpandedNode(node, idsToShow, idsThatHaveExpandedSuccessor) {
  if (idsToShow[node.uniqueId]) {
    return node;
  }

  let numOfChildrenWithExpandedSuccessor = 0;

  for (const child of node.children) {
    if (idsThatHaveExpandedSuccessor[child.uniqueId]) {
      numOfChildrenWithExpandedSuccessor++;
    }
  }

  if (numOfChildrenWithExpandedSuccessor >= 2) {
    return node;
  }

  for (const child of node.children) {
    const expandedNode = findExpandedNode(child, idsToShow, idsThatHaveExpandedSuccessor);

    if (expandedNode) {
      return expandedNode;
    }
  }

  return undefined;
}