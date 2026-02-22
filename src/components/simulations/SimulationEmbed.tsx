"use client";

import { SIMULATION_REGISTRY } from "@/lib/simulation-registry";

interface SimulationEmbedProps {
  componentKey: string;
}

export default function SimulationEmbed({ componentKey }: SimulationEmbedProps) {
  const SimComponent = SIMULATION_REGISTRY[componentKey];

  if (!SimComponent) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <p>Simulation component &quot;{componentKey}&quot; not found.</p>
      </div>
    );
  }

  return <SimComponent />;
}
