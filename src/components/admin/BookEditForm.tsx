"use client";

import React, { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { FileUp } from "lucide-react";

import { BookAdminDetail } from "@/lib/admin-queries";
import { updateBook } from "@/lib/admin-actions";
import { bookUpdateSchema, type BookUpdateData } from "@/lib/admin-schemas";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import ImageUploadField from "@/components/admin/ImageUploadField";
import PdfUploadField from "@/components/admin/PdfUploadField";
import DownloadFileButton from "@/components/admin/DownloadFileButton";
import CategorySelect from "@/components/admin/CategorySelect";

interface BookEditFormProps {
  book: BookAdminDetail;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export default function BookEditForm({ book, categories }: BookEditFormProps) {
  const [isPending, startTransition] = useTransition();

  const defaultValues: BookUpdateData = {
    title: book.title,
    slug: book.slug,
    authorName: book.authorName,
    authorBio: book.authorBio ?? null,
    authorImage: book.authorImage ?? null,
    synopsis: book.synopsis ?? null,
    coverImage: book.coverImage ?? null,
    isbn: book.isbn ?? null,
    pageCount: book.pageCount ?? null,
    publishYear: book.publishYear ?? null,
    dimensions: book.dimensions ?? null,
    printLink: book.printLink ?? null,
    isOpenAccess: book.isOpenAccess,
    price: book.pricing ? Number(book.pricing.amount) : null,
    categoryIds: book.categories.map((bc) => bc.categoryId),
    pdfKey: book.pdfKey ?? null,
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookUpdateData>({
    resolver: zodResolver(bookUpdateSchema),
    defaultValues,
  });

  const isOpenAccess = watch("isOpenAccess");

  function onSubmit(data: BookUpdateData) {
    startTransition(async () => {
      try {
        await updateBook(book.id, data);
        toast.success("Book saved successfully");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save book");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center gap-3">
        <Badge variant={book.isPublished ? "default" : "secondary"}>
          {book.isPublished ? "Published" : "Draft"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {book._count.chapters} chapter{book._count.chapters !== 1 ? "s" : ""}
          {book._count.chapters > 0 && (
            <>
              {" · "}
              <Link
                href={`/admin/books/${book.id}/ingest`}
                className="underline hover:text-foreground"
              >
                Re-ingest
              </Link>
            </>
          )}
        </span>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
        </TabsList>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} placeholder="Book title" />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register("slug")} placeholder="book-slug" />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="authorName">Author Name</Label>
              <Input
                id="authorName"
                {...register("authorName")}
                placeholder="Full name"
              />
              {errors.authorName && (
                <p className="text-xs text-destructive">{errors.authorName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="isbn">ISBN</Label>
              <Input id="isbn" {...register("isbn")} placeholder="978-..." />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="publishYear">Publication Year</Label>
              <Input
                id="publishYear"
                type="number"
                {...register("publishYear", { valueAsNumber: true })}
                placeholder="e.g. 2024"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pageCount">Page Count</Label>
              <Input
                id="pageCount"
                type="number"
                {...register("pageCount", { valueAsNumber: true })}
                placeholder="e.g. 320"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                {...register("dimensions")}
                placeholder='e.g. 6" × 9"'
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="printLink">Print Purchase Link</Label>
              <Input
                id="printLink"
                {...register("printLink")}
                placeholder="https://..."
              />
            </div>
          </div>
        </TabsContent>

        {/* CONTENT TAB */}
        <TabsContent value="content" className="pt-4 space-y-6">
          <Controller
            control={control}
            name="coverImage"
            render={({ field }) => (
              <ImageUploadField
                label="Cover Image"
                currentUrl={field.value ?? null}
                bookId={book.id}
                type="cover"
                onUpload={(r2Key) => setValue("coverImage", r2Key, { shouldDirty: true })}
              />
            )}
          />

          <div className="space-y-1">
            <p className="text-sm font-medium">Manuscript</p>
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/books/${book.id}/ingest`}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <FileUp className="size-4" />
                Upload Manuscript
              </Link>
              {book.manuscriptKey && (
                <DownloadFileButton r2Key={book.manuscriptKey} label="Download manuscript" />
              )}
            </div>
          </div>

          <PdfUploadField
            currentKey={book.pdfKey ?? null}
            bookId={book.id}
            onUpload={(r2Key) => setValue("pdfKey", r2Key, { shouldDirty: true })}
          />

          <div className="space-y-1.5">
            <Label htmlFor="synopsis">Synopsis</Label>
            <Textarea
              id="synopsis"
              {...register("synopsis")}
              placeholder="Book synopsis (Markdown supported)"
              rows={6}
              className="resize-y"
            />
          </div>

          <Controller
            control={control}
            name="authorImage"
            render={({ field }) => (
              <ImageUploadField
                label="Author Photo"
                currentUrl={field.value ?? null}
                bookId={book.id}
                type="author"
                onUpload={(r2Key) => setValue("authorImage", r2Key, { shouldDirty: true })}
              />
            )}
          />

          <div className="space-y-1.5">
            <Label htmlFor="authorBio">Author Bio</Label>
            <Textarea
              id="authorBio"
              {...register("authorBio")}
              placeholder="Author biography (Markdown supported)"
              rows={4}
              className="resize-y"
            />
          </div>
        </TabsContent>

        {/* PUBLISHING TAB */}
        <TabsContent value="publishing" className="pt-4 space-y-6">
          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="isOpenAccess"
              render={({ field }) => (
                <Switch
                  id="isOpenAccess"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isOpenAccess">Open Access (free for all readers)</Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              {...register("price", { valueAsNumber: true })}
              placeholder="e.g. 29.99"
              disabled={isOpenAccess}
              className="max-w-[200px]"
            />
            {isOpenAccess && (
              <p className="text-xs text-muted-foreground">
                Price is disabled when Open Access is enabled.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <Controller
              control={control}
              name="categoryIds"
              render={({ field }) => (
                <CategorySelect
                  categories={categories}
                  selectedIds={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <div className="pt-2 border-t border-border">
        <Button type="submit" disabled={isPending} className="min-w-[120px]">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
