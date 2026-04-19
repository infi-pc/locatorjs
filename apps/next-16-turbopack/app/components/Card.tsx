"use client";

export default function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1rem",
      }}
    >
      <h3 style={{ marginBottom: "0.5rem" }}>{title}</h3>
      {children}
    </div>
  );
}
