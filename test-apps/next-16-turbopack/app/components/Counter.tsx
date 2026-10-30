"use client";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <button
        onClick={() => setCount((c) => c - 1)}
        style={{ padding: "0.25rem 0.75rem" }}
      >
        -
      </button>
      <span style={{ minWidth: "2rem", textAlign: "center" }}>{count}</span>
      <button
        onClick={() => setCount((c) => c + 1)}
        style={{ padding: "0.25rem 0.75rem" }}
      >
        +
      </button>
    </div>
  );
}
