"use client";

import { useState, useEffect, useRef } from "react";

export interface IngestProgress {
  step: string;
  pct: number;
}

export interface IngestStatusData {
  status: string | null;
  progress: IngestProgress | null;
  error: string | null;
}

const TERMINAL_STATUSES = ["success", "error"];
const POLL_INTERVAL_MS = 2000;

export function useIngestStatus(jobId: string | null): IngestStatusData {
  const [data, setData] = useState<IngestStatusData>({
    status: null,
    progress: null,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) {
      setData({ status: null, progress: null, error: null });
      return;
    }

    async function poll() {
      try {
        const res = await fetch(`/api/admin/ingest/${jobId}`);
        if (!res.ok) return;
        const json = await res.json();

        const progress: IngestProgress | null = json.progress
          ? (JSON.parse(json.progress) as IngestProgress)
          : null;

        setData({
          status: json.status ?? null,
          progress,
          error: json.error ?? null,
        });

        // Stop polling once we reach a terminal status
        if (TERMINAL_STATUSES.includes(json.status)) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch {
        // Swallow network errors — will retry on next interval
      }
    }

    // Poll immediately, then every 2 seconds
    void poll();
    intervalRef.current = setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId]);

  return data;
}
