const disallowedNames: { [key: string]: true } = {
  Fragment: true,
  "React.Fragment": true,
  Suspense: true,
  "React.Suspense": true,
};

export function isDisallowedComponent(name: string) {
  return !!disallowedNames[name] || !!name.match(/Provider$/);
}
