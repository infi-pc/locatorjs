"use client";

import type { ReactNode } from "react";
import setupLocatorUI from "@locator/runtime";

if (process.env.NODE_ENV === "development") {
  // Keep this fixture on the React adapter so the webpack e2e tests exercise
  // React 19 source resolution instead of taking the loader-attribute shortcut.
  setupLocatorUI({ adapter: "react" });
}

export default function ClientProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
