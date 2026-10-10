"use client";

import { Children, useEffect, useState, type ReactNode } from "react";

/** Sticky chapter links; the one on screen is highlighted. */
export function ChapterNav({ chapters }: { chapters: { id: string; label: string }[] }) {
  const [on, setOn] = useState(chapters[0]?.id);
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setOn(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" },
    );
    chapters.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [chapters]);
  return (
    <nav aria-label="Chapters" className="sr-nav">
      <div className="container sr-nav-row">
        {chapters.map((c) => (
          <a key={c.id} href={`#${c.id}`} className={on === c.id ? "on" : undefined} aria-current={on === c.id ? "true" : undefined}>
            {c.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

/** A rule with its reason behind a "Why?" tap. */
export function Rule({ rule, why, seen }: { rule: string; why: string; seen: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="sr-rule">
      <div className="sr-rule-row">
        <span>{rule}</span>
        {(why || seen) && (
          <button type="button" className="sr-why" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            Why?
          </button>
        )}
      </div>
      {open && (
        <p className="sr-why-text">
          {why}
          {seen && <span className="sr-seen">In your photo: {seen}</span>}
        </p>
      )}
    </li>
  );
}

/** Shows the first `count` children; a button reveals the rest. */
export function ShowMore({ count, label, className, children }: { count: number; label: string; className?: string; children: ReactNode }) {
  const [all, setAll] = useState(false);
  const items = Children.toArray(children);
  return (
    <>
      <div className={className}>{all ? items : items.slice(0, count)}</div>
      {items.length > count && (
        <button type="button" className="sr-more" aria-expanded={all} onClick={() => setAll((a) => !a)}>
          {all ? "Show less" : label}
        </button>
      )}
    </>
  );
}
