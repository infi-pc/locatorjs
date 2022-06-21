"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.trackClickStats = trackClickStats;

function trackClickStats() {
  const current = Number(document.head.dataset.locatorClickCount) || 0;
  document.head.dataset.locatorClickCount = String(current + 1);
}