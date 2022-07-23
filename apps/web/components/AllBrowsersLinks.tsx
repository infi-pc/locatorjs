import React from "react";
import { extensionLink } from "../blocks/shared";

export function getAllExtensionsLinks(): { link: string; title: string }[] {
  return [
    { link: extensionLink.chrome, title: "Chrome" },
    { link: extensionLink.chrome, title: "Edge" },
    { link: extensionLink.chrome, title: "Brave" },
    { link: extensionLink.chrome, title: "Opera" },
    { link: extensionLink.firefox, title: "Firefox" },
  ];
}

export function AllBrowsersLinks() {
  return (
    <>
      {getAllExtensionsLinks().map((item) => (
        <a
          key={item.title}
          href={item.link}
          className="inline-block px-2 hover:underline hover:text-indigo-700"
        >
          {item.title}
        </a>
      ))}
    </>
  );
}
