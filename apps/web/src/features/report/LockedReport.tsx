const PARTS = [
  { title: "About you", line: "Your colouring and palette, your face and features, your build. What your photo shows, in plain words." },
  { title: "About your style", line: "What you wear now and what it says about you. Your style, and the version of it that fits your life." },
  { title: "What works, what does not", line: "Colours, cuts, fabrics and details. What to keep and what to change, each with the reason." },
];

/** The three parts of the Style Report. */
export function LockedReport() {
  return (
    <ol className="m-0 grid list-none gap-5 p-0 md:grid-cols-3">
      {PARTS.map((p, i) => (
        <li key={p.title} className="flex min-w-0 flex-col gap-2 p-6" style={{ border: "2px solid var(--ink)", borderRadius: 24, background: "var(--paper)" }}>
          <span className="label muted">Part {i + 1}</span>
          <h3 style={{ margin: 0 }}>{p.title}</h3>
          <p className="muted" style={{ margin: 0, lineHeight: 1.45 }}>
            {p.line}
          </p>
        </li>
      ))}
    </ol>
  );
}
