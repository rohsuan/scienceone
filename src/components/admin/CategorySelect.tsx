"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategory } from "@/lib/admin-actions";

interface Category {
  id: string;
  name: string;
}

interface CategorySelectProps {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function CategorySelect({
  categories: initialCategories,
  selectedIds,
  onChange,
}: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function toggleCategory(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;

    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await createCategory(name);
      setCategories((prev) => [...prev, { id: created.id, name: created.name }]);
      onChange([...selectedIds, created.id]);
      setNewCategoryName("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Selected category badges */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const cat = categories.find((c) => c.id === id);
            if (!cat) return null;
            return (
              <Badge
                key={id}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-white transition-colors"
                onClick={() => toggleCategory(id)}
                title="Click to remove"
              >
                {cat.name} ×
              </Badge>
            );
          })}
        </div>
      )}

      {/* Scrollable category list */}
      <div className="border border-border rounded-md max-h-40 overflow-y-auto p-2 space-y-1">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground px-1">No categories yet. Create one below.</p>
        )}
        {categories.map((cat) => {
          const isSelected = selectedIds.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Inline category creation */}
      <div className="flex gap-2">
        <Input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="New category name..."
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleCreateCategory();
            }
          }}
          disabled={isCreating}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleCreateCategory()}
          disabled={isCreating || !newCategoryName.trim()}
        >
          {isCreating ? "Adding..." : "Add"}
        </Button>
      </div>

      {createError && <p className="text-sm text-destructive">{createError}</p>}
    </div>
  );
}
