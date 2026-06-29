export function DemoBanner() {
  return (
    <div
      role="note"
      aria-label="Sample data — demo"
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 50,
        padding: "6px 12px",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#fff",
        background: "var(--color-bronze)",
        borderRadius: "var(--radius-pill)",
        boxShadow: "var(--shadow-bronze)",
        pointerEvents: "none",
      }}
    >
      Sample data — demo
    </div>
  );
}
