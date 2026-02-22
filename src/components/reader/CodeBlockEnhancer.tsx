"use client";

import { useEffect } from "react";

/**
 * Finds all code-block-wrapper divs in the article and injects a copy button.
 * Runs once on mount — no React hydration needed for individual buttons.
 */
export default function CodeBlockEnhancer() {
  useEffect(() => {
    const wrappers = document.querySelectorAll(".code-block-wrapper");

    wrappers.forEach((wrapper) => {
      // Skip if button already injected
      if (wrapper.querySelector("[data-copy-btn]")) return;

      const pre = wrapper.querySelector("pre");
      if (!pre) return;

      const btn = document.createElement("button");
      btn.setAttribute("data-copy-btn", "");
      btn.className = [
        "absolute top-2 right-2 rounded-md px-2 py-1 text-xs",
        "bg-black/5 hover:bg-black/10 text-gray-600 hover:text-gray-900",
        "opacity-0 group-hover:opacity-100 transition-opacity",
        "cursor-pointer select-none",
      ].join(" ");
      btn.textContent = "Copy";

      btn.addEventListener("click", async () => {
        const code = pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = "Copied!";
          setTimeout(() => {
            btn.textContent = "Copy";
          }, 2000);
        } catch {
          btn.textContent = "Failed";
          setTimeout(() => {
            btn.textContent = "Copy";
          }, 2000);
        }
      });

      wrapper.appendChild(btn);
    });
  }, []);

  return null;
}
