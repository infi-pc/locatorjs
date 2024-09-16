export function transformPath(path: string, from: string, to: string) {
  try {
    return path.replace(new RegExp(`${from}`, 'g'), to);
  } catch (e) {
    return path;
  }
}
