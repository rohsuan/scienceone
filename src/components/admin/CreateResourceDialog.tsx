"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createResource } from "@/lib/resource-admin-actions";
import { Plus } from "lucide-react";

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const RESOURCE_TYPES = [
  { value: "LESSON_PLAN", label: "Lesson Plan" },
  { value: "PROBLEM_SET", label: "Problem Set" },
  { value: "COURSE_MODULE", label: "Course Module" },
  { value: "LAB_GUIDE", label: "Lab Guide" },
  { value: "SIMULATION", label: "Simulation" },
] as const;

const RESOURCE_LEVELS = [
  { value: "AP", label: "AP" },
  { value: "INTRO_UNIVERSITY", label: "Intro University" },
  { value: "ADVANCED_UNIVERSITY", label: "Advanced University" },
] as const;

export default function CreateResourceDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<string>("LESSON_PLAN");
  const [level, setLevel] = useState<string>("INTRO_UNIVERSITY");

  function handleTitleChange(value: string) {
    setTitle(value);
    setSlug(slugify(value));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    startTransition(async () => {
      const resourceId = await createResource({
        title,
        slug,
        type: type as "LESSON_PLAN" | "PROBLEM_SET" | "COURSE_MODULE" | "LAB_GUIDE" | "SIMULATION",
        level: level as "AP" | "INTRO_UNIVERSITY" | "ADVANCED_UNIVERSITY",
      });
      setOpen(false);
      setTitle("");
      setSlug("");
      setType("LESSON_PLAN");
      setLevel("INTRO_UNIVERSITY");
      router.push(`/admin/resources/${resourceId}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="res-title">Title</Label>
            <Input
              id="res-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. AP Mechanics Problem Set"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="res-slug">Slug</Label>
            <Input
              id="res-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. ap-mechanics-problem-set"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Resource"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
