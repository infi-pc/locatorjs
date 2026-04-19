"use client";

import setupLocatorUI from "@locator/runtime";

if (process.env.NODE_ENV === "development") {
  setupLocatorUI();
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
