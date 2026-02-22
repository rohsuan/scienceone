"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

export default function ProjectileMotion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(50);
  const [gravity, setGravity] = useState(9.8);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [showCode, setShowCode] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const trajectoryRef = useRef<{ x: number; y: number }[]>([]);
  const startTimeRef = useRef(0);

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

      const SCALE = canvasWidth / 150;
      const GROUND_Y = canvasHeight - 40;

      const rad = (angle * Math.PI) / 180;
      const vx = velocity * Math.cos(rad);
      const vy = velocity * Math.sin(rad);

      // Clear
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Ground
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(0, GROUND_Y, canvasWidth, canvasHeight - GROUND_Y);
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(canvasWidth, GROUND_Y);
      ctx.stroke();

      // Grid
      ctx.strokeStyle = "#f3f4f6";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < canvasWidth; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, GROUND_Y);
        ctx.stroke();
      }
      for (let j = 0; j < GROUND_Y; j += 50) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvasWidth, j);
        ctx.stroke();
      }

      // Trajectory trail
      if (trajectoryRef.current.length > 1) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        const pts = trajectoryRef.current;
        ctx.moveTo(30 + pts[0].x * SCALE, GROUND_Y - pts[0].y * SCALE);
        for (let i = 1; i < pts.length; i++) {
          const px = 30 + pts[i].x * SCALE;
          const py = GROUND_Y - pts[i].y * SCALE;
          if (py <= GROUND_Y) {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Current position
      const x = vx * t;
      const y = vy * t - 0.5 * gravity * t * t;

      if (y >= 0) {
        const px = 30 + x * SCALE;
        const py = GROUND_Y - y * SCALE;
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Labels
      ctx.fillStyle = "#374151";
      ctx.font = "12px system-ui";
      ctx.fillText(`t = ${t.toFixed(2)}s`, 10, 20);
      ctx.fillText(`x = ${x.toFixed(1)}m`, 10, 36);
      ctx.fillText(`y = ${Math.max(0, y).toFixed(1)}m`, 10, 52);

      // Launch point
      ctx.fillStyle = "#6b7280";
      ctx.beginPath();
      ctx.arc(30, GROUND_Y, 4, 0, Math.PI * 2);
      ctx.fill();
    },
    [angle, velocity, gravity, canvasWidth, canvasHeight]
  );

  useEffect(() => {
    draw(0);
  }, [draw]);

  useEffect(() => {
    if (!isRunning) return;

    const rad = (angle * Math.PI) / 180;
    const vy = velocity * Math.sin(rad);
    const totalTime = (2 * vy) / gravity;

    startTimeRef.current = performance.now();
    trajectoryRef.current = [];

    function animate(now: number) {
      const elapsed = (now - startTimeRef.current) / 1000;
      const t = Math.min(elapsed, totalTime);

      // Store trajectory
      const vx = velocity * Math.cos((angle * Math.PI) / 180);
      const vyCalc = velocity * Math.sin((angle * Math.PI) / 180);
      trajectoryRef.current.push({
        x: vx * t,
        y: vyCalc * t - 0.5 * gravity * t * t,
      });

      draw(t);
      setTime(t);

      if (t < totalTime) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setIsRunning(false);
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning, angle, velocity, gravity, draw]);

  function handleLaunch() {
    trajectoryRef.current = [];
    setTime(0);
    setIsRunning(true);
  }

  function handleReset() {
    cancelAnimationFrame(animRef.current);
    setIsRunning(false);
    setTime(0);
    trajectoryRef.current = [];
    draw(0);
  }

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="w-full max-w-[600px]">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="border rounded-lg bg-white w-full"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-[600px]">
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Angle: {angle}&deg;
          </label>
          <input
            type="range"
            min="5"
            max="85"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            disabled={isRunning}
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Velocity: {velocity} m/s
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={velocity}
            onChange={(e) => setVelocity(Number(e.target.value))}
            disabled={isRunning}
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Gravity: {gravity.toFixed(1)} m/s&sup2;
          </label>
          <input
            type="range"
            min="1"
            max="20"
            step="0.1"
            value={gravity}
            onChange={(e) => setGravity(Number(e.target.value))}
            disabled={isRunning}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleLaunch}
          disabled={isRunning}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
        >
          Launch
        </button>
        <button
          onClick={handleReset}
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
{`# Projectile Motion Equations
import math

angle = ${angle}  # degrees
v0 = ${velocity}  # m/s
g = ${gravity}  # m/s²

rad = math.radians(angle)
vx = v0 * math.cos(rad)  # = ${(velocity * Math.cos((angle * Math.PI) / 180)).toFixed(2)} m/s
vy = v0 * math.sin(rad)  # = ${(velocity * Math.sin((angle * Math.PI) / 180)).toFixed(2)} m/s

# Position at time t:
# x(t) = vx * t
# y(t) = vy * t - 0.5 * g * t²

# Time of flight:
T = 2 * vy / g  # = ${((2 * velocity * Math.sin((angle * Math.PI) / 180)) / gravity).toFixed(2)} s

# Maximum height:
H = vy**2 / (2 * g)  # = ${(Math.pow(velocity * Math.sin((angle * Math.PI) / 180), 2) / (2 * gravity)).toFixed(2)} m

# Range:
R = vx * T  # = ${((velocity * Math.cos((angle * Math.PI) / 180) * 2 * velocity * Math.sin((angle * Math.PI) / 180)) / gravity).toFixed(2)} m`}
        </pre>
      )}
    </div>
  );
}
