import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// Only import this file from "use client" components
export const SIMULATION_REGISTRY: Record<string, ComponentType> = {
  "projectile-motion": dynamic(
    () => import("@/simulations/ProjectileMotion"),
    { ssr: false, loading: () => <div className="aspect-[3/2] bg-muted animate-pulse rounded-lg" /> }
  ),
  "wave-interference": dynamic(
    () => import("@/simulations/WaveInterference"),
    { ssr: false, loading: () => <div className="aspect-[3/2] bg-muted animate-pulse rounded-lg" /> }
  ),
  "spring-mass": dynamic(
    () => import("@/simulations/SpringMass"),
    { ssr: false, loading: () => <div className="aspect-[3/2] bg-muted animate-pulse rounded-lg" /> }
  ),
};
