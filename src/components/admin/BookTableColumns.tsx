"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
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
import { togglePublish, deleteBook } from "@/lib/admin-actions";
import type { BookAdminRow } from "@/lib/admin-queries";

export const columns: ColumnDef<BookAdminRow>[] = [
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
        href={`/admin/books/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.title}
      </Link>
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
    accessorKey: "isOpenAccess",
    header: "Access",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.isOpenAccess ? "Open" : "Paid"}
      </span>
    ),
  },
  {
    id: "formats",
    header: "Formats",
    cell: ({ row }) => (
      <div className="flex gap-1">
        {row.original.pdfKey && (
          <Badge variant="outline" className="text-xs">PDF</Badge>
        )}
        {row.original.epubKey && (
          <Badge variant="outline" className="text-xs">EPUB</Badge>
        )}
        {!row.original.pdfKey && !row.original.epubKey && (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    ),
  },
  {
    id: "chapters",
    header: "Chapters",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original._count.chapters}
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
    cell: ({ row }) => {
      const book = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/books/${book.id}`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => togglePublish(book.id, !book.isPublished)}
            >
              {book.isPublished ? "Unpublish" : "Publish"}
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
                  <AlertDialogTitle>Delete book?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{book.title}&quot; and all its
                    chapters. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteBook(book.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
