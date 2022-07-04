"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasExperimentalFeatures = void 0;

let hasExperimentalFeatures = () => document.documentElement.dataset.locatorExperimentalFeatures || false;

exports.hasExperimentalFeatures = hasExperimentalFeatures;