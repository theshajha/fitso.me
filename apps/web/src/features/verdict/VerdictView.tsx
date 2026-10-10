import type { Verdict } from "@fitso/core";
import { Stamp } from "@/components/brand/Stamp";
import { VERDICT_LABEL } from "./schema";

/** The verdict result: stamp, item, reasons, condition, savings. Server and client safe. */
export function VerdictView({ verdict }: { verdict: Verdict }) {
  const label = VERDICT_LABEL[verdict.verdict];
  const itemLine = [verdict.item.name, verdict.item.brand, verdict.item.colour].filter(Boolean).join(" · ");
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <Stamp kind={label.stamp} rotate={-5} className="verdict-stamp">
          <span style={{ fontSize: "clamp(2.5rem, 9vw, 4.5rem)", fontFamily: "var(--font-display)", fontWeight: 900, letterSpacing: "-0.02em" }}>
            {label.text}
          </span>
        </Stamp>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{itemLine}</p>
      </div>
      <ul style={{ marginTop: 24, paddingLeft: 20 }}>
        {verdict.reasons.map((r, i) => (
          <li key={i} style={{ marginBottom: 8 }}>
            {r}
          </li>
        ))}
      </ul>
      {verdict.verdict === "yes_if" && verdict.condition && (
        <p style={{ marginTop: 16 }}>
          <span className="label" style={{ color: "var(--warn)" }}>
            Yes, if
          </span>
          <br />
          {verdict.condition}
        </p>
      )}
      {verdict.verdict === "no" && verdict.saved_amount_inr != null && (
        <p style={{ marginTop: 16, fontWeight: 600 }}>
          Saved about ₹{verdict.saved_amount_inr.toLocaleString("en-IN")}
        </p>
      )}
    </div>
  );
}
