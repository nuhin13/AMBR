"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Georgia, serif", background: "#F7E8E1", color: "#4A1022", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontWeight: 400 }}>Something went wrong</h1>
          <button onClick={reset} style={{ marginTop: 16, background: "#4A1022", color: "#F7E8E1", border: 0, padding: "12px 24px", cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
