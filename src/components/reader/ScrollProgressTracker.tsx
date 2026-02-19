"use client";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

interface ScrollProgressTrackerProps {
  bookId: string;
  chapterId: string;
  isAuthenticated: boolean;
  initialScrollPercent?: number;
}

export default function ScrollProgressTracker({
  bookId,
  chapterId,
  isAuthenticated,
  initialScrollPercent,
}: ScrollProgressTrackerProps) {
  // Restore scroll position on mount (only when matching the saved chapter)
  useEffect(() => {
    if (initialScrollPercent && initialScrollPercent > 0) {
      // Small delay to let content render before scrolling
      const timer = setTimeout(() => {
        const el = document.getElementById("reader-content");
        if (el) {
          el.scrollTop = (el.scrollHeight * initialScrollPercent) / 100;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []); // Only on mount — key prop forces remount on chapter change

  const saveProgress = useDebouncedCallback(async (percent: number) => {
    if (!isAuthenticated) return;
    await fetch("/api/reading-progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId,
        chapterId,
        scrollPercent: Math.round(percent),
      }),
    });
  }, 2000); // 2-second debounce

  useEffect(() => {
    if (!isAuthenticated) return;
    const el = document.getElementById("reader-content");
    if (!el) return;

    const handleScroll = () => {
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable <= 0) return;
      const percent = (el.scrollTop / scrollable) * 100;
      saveProgress(Math.min(100, Math.max(0, percent)));
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isAuthenticated, saveProgress]);

  return null;
}
