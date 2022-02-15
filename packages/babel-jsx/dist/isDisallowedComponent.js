"use strict";
exports.__esModule = true;
exports.isDisallowedComponent = void 0;
var disallowedNames = {
    Fragment: true,
    "React.Fragment": true,
    Suspense: true,
    "React.Suspense": true
};
function isDisallowedComponent(name) {
    return !!disallowedNames[name] || !!name.match(/Provider$/);
}
exports.isDisallowedComponent = isDisallowedComponent;
