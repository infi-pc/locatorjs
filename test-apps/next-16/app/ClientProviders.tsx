"use client";

import type { ReactNode } from "react";
import setupLocatorUI from "@locator/runtime";

if (process.env.NODE_ENV === "development") {
  setupLocatorUI();
}

export default function ClientProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
