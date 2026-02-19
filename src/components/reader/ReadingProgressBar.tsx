"use client";

import { useState, useEffect } from "react";

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = document.getElementById("reader-content");
    if (!el) return;

    const handleScroll = () => {
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable <= 0) {
        setProgress(0);
        return;
      }
      const percent = (el.scrollTop / scrollable) * 100;
      setProgress(Math.min(100, Math.max(0, percent)));
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="h-0.5 bg-muted w-full fixed top-12 left-0 lg:left-64 xl:left-72 right-0 z-10">
      <div
        className="h-full bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
