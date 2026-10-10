import type { ReactNode } from "react";
import { Container } from "./Container";

/** Vertical rhythm: 96px desktop, 56px mobile (the .section class). */
export function Section({
  id,
  className = "",
  contained = true,
  children,
}: {
  id?: string;
  className?: string;
  /** Wrap children in a Container. Turn off for full-bleed bands. */
  contained?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`section ${className}`.trim()}>
      {contained ? <Container>{children}</Container> : children}
    </section>
  );
}
