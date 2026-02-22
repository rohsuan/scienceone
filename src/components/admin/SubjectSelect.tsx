"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

interface Subject {
  id: string;
  name: string;
}

interface SubjectSelectProps {
  subjects: Subject[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function SubjectSelect({
  subjects,
  selectedIds,
  onChange,
}: SubjectSelectProps) {
  function toggleSubject(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const subj = subjects.find((s) => s.id === id);
            if (!subj) return null;
            return (
              <Badge
                key={id}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-white transition-colors"
                onClick={() => toggleSubject(id)}
                title="Click to remove"
              >
                {subj.name} ×
              </Badge>
            );
          })}
        </div>
      )}

      <div className="border border-border rounded-md max-h-40 overflow-y-auto p-2 space-y-1">
        {subjects.length === 0 && (
          <p className="text-sm text-muted-foreground px-1">No subjects available.</p>
        )}
        {subjects.map((subj) => {
          const isSelected = selectedIds.includes(subj.id);
          return (
            <button
              key={subj.id}
              type="button"
              onClick={() => toggleSubject(subj.id)}
              className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {subj.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
