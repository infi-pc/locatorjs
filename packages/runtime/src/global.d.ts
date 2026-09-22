import type { FileStorage } from "@locator/shared";
import { strictConfigStorage } from "@locator/shared";

declare global {
  interface Window {
    __LOCATOR_DATA__?: Record<string, FileStorage>;
    enableLocator: () => Promise<strictConfigStorage.WriteResult>;
  }
}
