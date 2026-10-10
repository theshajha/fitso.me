import { ImageResponse } from "next/og";

export const alt = "fitso. Know what's working for you.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const chips = [
  { fill: "#FF7A45", rot: -36 },
  { fill: "#7FA8D9", rot: -18 },
  { fill: "#B8632F", rot: 0 },
  { fill: "#2642E5", rot: 18 },
  { fill: "#F0127A", rot: 36 },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#FFFDF8",
          color: "#14121B",
          fontFamily: "sans-serif",
          padding: 72,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1 }}>fitso</div>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.02, marginTop: 24, letterSpacing: -2 }}>
            The world&apos;s best stylist. For the price of a coffee.
          </div>
          <div style={{ fontSize: 28, marginTop: 28, color: "#4B4757" }}>
            Send one photo. Get your personal style, free, in about a minute.
          </div>
        </div>
        <div style={{ display: "flex", position: "relative", width: 380, height: 420 }}>
          {chips.map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 140,
                bottom: 0,
                width: 110,
                height: 330,
                borderRadius: 50,
                background: c.fill,
                border: "4px solid #FFFDF8",
                transform: `rotate(${c.rot}deg)`,
                transformOrigin: "50% 100%",
                boxShadow: "0 10px 30px rgba(20,18,27,0.18)",
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
