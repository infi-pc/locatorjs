export type StatusMessageFromClient =
  | 'ok'
  | 'couldNotConnect'
  | 'disabled'
  | 'loading'
  | `loading: ${string}`
  | `error: ${string}`;
