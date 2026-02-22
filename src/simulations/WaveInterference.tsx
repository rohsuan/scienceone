"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

export default function WaveInterference() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const [frequency, setFrequency] = useState(2);
  const [amplitude, setAmplitude] = useState(30);
  const [separation, setSeparation] = useState(100);
  const [isRunning, setIsRunning] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const timeRef = useRef(0);

  const canvasHeight = Math.round(canvasWidth * (400 / 600));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (w > 0) setCanvasWidth(w);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(
    (t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Background
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const cx = canvasWidth / 2;
      const cy = canvasHeight / 2;
      const s1x = cx - separation / 2;
      const s2x = cx + separation / 2;
      const s1y = cy;
      const s2y = cy;

      // Draw interference pattern
      const imageData = ctx.createImageData(canvasWidth, canvasHeight);
      const wavelength = 30;
      const k = (2 * Math.PI) / wavelength;
      const omega = 2 * Math.PI * frequency;

      for (let py = 0; py < canvasHeight; py++) {
        for (let px = 0; px < canvasWidth; px++) {
          const r1 = Math.sqrt((px - s1x) ** 2 + (py - s1y) ** 2);
          const r2 = Math.sqrt((px - s2x) ** 2 + (py - s2y) ** 2);

          const wave1 = amplitude * Math.sin(k * r1 - omega * t) / Math.max(1, Math.sqrt(r1));
          const wave2 = amplitude * Math.sin(k * r2 - omega * t) / Math.max(1, Math.sqrt(r2));

          const combined = wave1 + wave2;
          const normalized = (combined + amplitude * 2) / (amplitude * 4);

          const idx = (py * canvasWidth + px) * 4;
          // Blue-white-red colormap
          if (normalized < 0.5) {
            const v = normalized * 2;
            imageData.data[idx] = Math.floor(59 * (1 - v) + 255 * v);
            imageData.data[idx + 1] = Math.floor(130 * (1 - v) + 255 * v);
            imageData.data[idx + 2] = Math.floor(246 * (1 - v) + 255 * v);
          } else {
            const v = (normalized - 0.5) * 2;
            imageData.data[idx] = Math.floor(255 * (1 - v) + 239 * v);
            imageData.data[idx + 1] = Math.floor(255 * (1 - v) + 68 * v);
            imageData.data[idx + 2] = Math.floor(255 * (1 - v) + 68 * v);
          }
          imageData.data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Source markers
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(s1x, s1y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s2x, s2y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px system-ui";
      ctx.fillText("S1", s1x - 8, s1y - 10);
      ctx.fillText("S2", s2x - 8, s2y - 10);
    },
    [frequency, amplitude, separation, canvasWidth, canvasHeight]
  );

  useEffect(() => {
    if (!isRunning) {
      draw(timeRef.current);
      return;
    }

    let last = performance.now();

    function animate(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      timeRef.current += dt * 0.5;
      draw(timeRef.current);
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning, draw]);

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="w-full max-w-[600px]">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="border rounded-lg w-full"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-[600px]">
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Frequency: {frequency.toFixed(1)} Hz
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Amplitude: {amplitude}
          </label>
          <input
            type="range"
            min="10"
            max="60"
            value={amplitude}
            onChange={(e) => setAmplitude(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Separation: {separation}px
          </label>
          <input
            type="range"
            min="20"
            max="250"
            value={separation}
            onChange={(e) => setSeparation(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        >
          {isRunning ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => {
            timeRef.current = 0;
            draw(0);
          }}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm"
        >
          Reset
        </button>
        <button
          onClick={() => setShowCode(!showCode)}
          className="px-4 py-2 border rounded-md text-sm ml-auto"
        >
          {showCode ? "Hide Code" : "Show Code"}
        </button>
      </div>

      {showCode && (
        <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`# Two-Source Wave Interference
import numpy as np

frequency = ${frequency.toFixed(1)}  # Hz
wavelength = 30  # pixels
k = 2 * np.pi / wavelength  # wave number
omega = 2 * np.pi * frequency  # angular frequency
separation = ${separation}  # pixels between sources

# For each point (x, y) on the screen:
# r1 = distance from source 1
# r2 = distance from source 2
# wave1 = A * sin(k * r1 - omega * t) / sqrt(r1)
# wave2 = A * sin(k * r2 - omega * t) / sqrt(r2)
# total = wave1 + wave2

# Constructive interference when:
#   |r1 - r2| = n * wavelength  (n = 0, 1, 2, ...)
# Destructive interference when:
#   |r1 - r2| = (n + 0.5) * wavelength`}
        </pre>
      )}
    </div>
  );
}
