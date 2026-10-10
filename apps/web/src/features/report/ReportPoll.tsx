"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_MS = 3 * 60 * 1000;

/** Refreshes the server page every 5 seconds until the report text exists. */
export function ReportPoll() {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      if (Date.now() - start >= MAX_MS) {
        clearInterval(id);
        setGaveUp(true);
        return;
      }
      router.refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <p style={{ margin: "12px 0 0" }}>
      {gaveUp ? (
        <>
          This is taking longer than usual.{" "}
          <a href="" style={{ fontWeight: 600, textDecoration: "underline" }}>
            Refresh
          </a>
        </>
      ) : (
        <span className="label">Checking again every few seconds</span>
      )}
    </p>
  );
}
