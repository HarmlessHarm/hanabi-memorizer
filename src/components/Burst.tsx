/** The one quiet firework on each card back — the only ornament (ux-design.md). */
export function Burst({ tint }: { tint: string }) {
  return (
    <svg viewBox="0 0 100 100" className="burst" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 12;
        return (
          <line
            key={i}
            x1={50 + Math.cos(a) * 12}
            y1={50 + Math.sin(a) * 12}
            x2={50 + Math.cos(a) * (i % 2 ? 30 : 40)}
            y2={50 + Math.sin(a) * (i % 2 ? 30 : 40)}
            stroke={tint}
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
