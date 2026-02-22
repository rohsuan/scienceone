"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

export default function SpringMass() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const [mass, setMass] = useState(1);
  const [springK, setSpringK] = useState(10);
  const [damping, setDamping] = useState(0.1);
  const [isRunning, setIsRunning] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(600);

  // Physics state
  const stateRef = useRef({ x: 80, v: 0 }); // displacement from equilibrium
  const trailRef = useRef<number[]>([]);

  const canvasHeight = Math.round(canvasWidth * (300 / 600));

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

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const EQUILIBRIUM_Y = canvasHeight / 2;
    const ANCHOR_X = Math.round(canvasWidth * 50 / 600);
    const MAX_TRAIL = Math.min(400, canvasWidth - 100);

    const { x } = stateRef.current;
    const massX = ANCHOR_X + Math.round(canvasWidth * 200 / 600) + x;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Anchor wall
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(ANCHOR_X - 10, EQUILIBRIUM_Y - 40, 10, 80);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    // Hatching
    for (let i = -40; i < 80; i += 8) {
      ctx.beginPath();
      ctx.moveTo(ANCHOR_X - 10, EQUILIBRIUM_Y + i);
      ctx.lineTo(ANCHOR_X, EQUILIBRIUM_Y + i - 8);
      ctx.stroke();
    }

    // Spring (zigzag)
    const springStartX = ANCHOR_X;
    const springEndX = massX - 20;
    const springWidth = springEndX - springStartX;
    const coils = 12;
    const coilWidth = springWidth / coils;
    const springAmplitude = 10;

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(springStartX, EQUILIBRIUM_Y);
    for (let i = 0; i <= coils; i++) {
      const cx = springStartX + i * coilWidth;
      const cy = i % 2 === 0 ? EQUILIBRIUM_Y - springAmplitude : EQUILIBRIUM_Y + springAmplitude;
      if (i === 0 || i === coils) {
        ctx.lineTo(cx, EQUILIBRIUM_Y);
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    ctx.stroke();

    // Mass block
    const blockSize = 30 + mass * 5;
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(
      massX - blockSize / 2,
      EQUILIBRIUM_Y - blockSize / 2,
      blockSize,
      blockSize
    );
    ctx.strokeStyle = "#1e40af";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      massX - blockSize / 2,
      EQUILIBRIUM_Y - blockSize / 2,
      blockSize,
      blockSize
    );

    // Mass label
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`${mass}kg`, massX, EQUILIBRIUM_Y + 4);
    ctx.textAlign = "start";

    // Equilibrium line
    const equilibriumLineX = ANCHOR_X + Math.round(canvasWidth * 200 / 600);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(equilibriumLineX, 20);
    ctx.lineTo(equilibriumLineX, canvasHeight - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Displacement trail (bottom section)
    const trailY = canvasHeight - 60;
    const trail = trailRef.current;
    if (trail.length > 1) {
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const tx = canvasWidth - trail.length + i;
        const ty = trailY - trail[i] * 0.3;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.stroke();
    }

    // Trail axis
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(canvasWidth - MAX_TRAIL, trailY);
    ctx.lineTo(canvasWidth, trailY);
    ctx.stroke();

    // Info
    ctx.fillStyle = "#374151";
    ctx.font = "12px system-ui";
    const omega = Math.sqrt(springK / mass);
    const period = (2 * Math.PI) / omega;
    ctx.fillText(`x = ${x.toFixed(1)} px`, 10, 20);
    ctx.fillText(`f = ${(1 / period).toFixed(2)} Hz`, 10, 36);
    ctx.fillText(`T = ${period.toFixed(2)} s`, 10, 52);
  }, [mass, springK, canvasWidth, canvasHeight]);

  useEffect(() => {
    if (!isRunning) {
      draw();
      return;
    }

    let last = performance.now();

    function animate(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const MAX_TRAIL = Math.min(400, canvasWidth - 100);
      const state = stateRef.current;
      // Verlet-style Euler integration
      const force = -springK * state.x - damping * state.v;
      const acceleration = force / mass;
      state.v += acceleration * dt;
      state.x += state.v * dt;

      // Store trail
      trailRef.current.push(state.x);
      if (trailRef.current.length > MAX_TRAIL) {
        trailRef.current.shift();
      }

      draw();
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning, mass, springK, damping, draw, canvasWidth]);

  function handleReset() {
    stateRef.current = { x: 80, v: 0 };
    trailRef.current = [];
    draw();
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
            Mass: {mass.toFixed(1)} kg
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={mass}
            onChange={(e) => setMass(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Spring k: {springK} N/m
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={springK}
            onChange={(e) => setSpringK(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Damping: {damping.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={damping}
            onChange={(e) => setDamping(Number(e.target.value))}
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
{`# Damped Harmonic Oscillator
# m * x'' + b * x' + k * x = 0

m = ${mass.toFixed(1)}   # mass (kg)
k = ${springK}    # spring constant (N/m)
b = ${damping.toFixed(2)}  # damping coefficient

omega_0 = sqrt(k / m)  # = ${Math.sqrt(springK / mass).toFixed(3)} rad/s (natural frequency)
T = 2 * pi / omega_0   # = ${((2 * Math.PI) / Math.sqrt(springK / mass)).toFixed(3)} s (period)
f = 1 / T               # = ${(Math.sqrt(springK / mass) / (2 * Math.PI)).toFixed(3)} Hz

# Solution (underdamped, b < 2*sqrt(k*m)):
# x(t) = A * exp(-b*t/(2*m)) * cos(omega_d * t + phi)
# where omega_d = sqrt(omega_0^2 - (b/(2*m))^2)

gamma = b / (2 * m)  # = ${(damping / (2 * mass)).toFixed(3)}
omega_d = sqrt(omega_0**2 - gamma**2)  # damped frequency`}
        </pre>
      )}
    </div>
  );
}
