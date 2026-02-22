"use client";

import { useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { togglePublishResource, deleteResource } from "@/lib/resource-admin-actions";
import type { ResourceAdminRow } from "@/lib/resource-admin-queries";

const TYPE_LABELS: Record<string, string> = {
  LESSON_PLAN: "Lesson Plan",
  PROBLEM_SET: "Problem Set",
  COURSE_MODULE: "Course Module",
  LAB_GUIDE: "Lab Guide",
  SIMULATION: "Simulation",
};

const LEVEL_LABELS: Record<string, string> = {
  AP: "AP",
  INTRO_UNIVERSITY: "Intro University",
  ADVANCED_UNIVERSITY: "Advanced University",
};

function ResourceRowActions({ resource }: { resource: ResourceAdminRow }) {
  const [isPending, startTransition] = useTransition();

  function handleTogglePublish() {
    startTransition(async () => {
      try {
        await togglePublishResource(resource.id, !resource.isPublished);
        toast.success(
          resource.isPublished ? "Resource unpublished" : "Resource published"
        );
      } catch {
        toast.error("Failed to update publish status");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteResource(resource.id);
        toast.success("Resource deleted");
      } catch {
        toast.error("Failed to delete resource");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isPending}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/resources/${resource.id}`}>Edit</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTogglePublish} disabled={isPending}>
          {resource.isPublished ? "Unpublish" : "Publish"}
        </DropdownMenuItem>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete resource?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{resource.title}&quot;.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<ResourceAdminRow>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/admin/resources/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {TYPE_LABELS[row.original.type] ?? row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "level",
    header: "Level",
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs">
        {LEVEL_LABELS[row.original.level] ?? row.original.level}
      </Badge>
    ),
  },
  {
    accessorKey: "isPublished",
    header: "Status",
    cell: ({ row }) =>
      row.original.isPublished ? (
        <Badge variant="default">Published</Badge>
      ) : (
        <Badge variant="secondary">Draft</Badge>
      ),
  },
  {
    accessorKey: "isFree",
    header: "Access",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.isFree
          ? "Free"
          : row.original.pricing
            ? `$${row.original.pricing.amount.toFixed(2)}`
            : "Paid"}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Updated
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.updatedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <ResourceRowActions resource={row.original} />,
  },
];
