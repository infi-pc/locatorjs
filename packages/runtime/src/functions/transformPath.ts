export function transformPath(path: string, from: string, to: string) {
  return path.replace(new RegExp(`${from}`), to);
}
