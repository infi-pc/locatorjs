/** Restrict same-window messages to the current origin when the URL has one. */
export function postMessageOrigin(location: Pick<Location, "origin">): string {
  return location.origin === "null" ? "*" : location.origin;
}
