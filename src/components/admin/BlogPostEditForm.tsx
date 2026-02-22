"use client";

import React, { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { BlogPostAdminDetail } from "@/lib/blog-admin-queries";
import { updateBlogPost } from "@/lib/blog-admin-actions";
import { blogPostUpdateSchema, type BlogPostUpdateData } from "@/lib/blog-admin-schemas";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageUploadField from "@/components/admin/ImageUploadField";
import SubjectSelect from "@/components/admin/SubjectSelect";

const BLOG_CATEGORIES = [
  { value: "TEACHING", label: "Teaching" },
  { value: "COMPUTATION", label: "Computation" },
  { value: "RESOURCES", label: "Resources" },
  { value: "AI_IN_EDUCATION", label: "AI in Education" },
] as const;

interface BlogPostEditFormProps {
  post: BlogPostAdminDetail;
  subjects: Array<{ id: string; name: string; slug: string }>;
}

export default function BlogPostEditForm({ post, subjects }: BlogPostEditFormProps) {
  const [isPending, startTransition] = useTransition();

  const defaultValues: BlogPostUpdateData = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? null,
    content: post.content ?? null,
    category: post.category,
    authorName: post.authorName,
    authorBio: post.authorBio ?? null,
    authorImage: post.authorImage ?? null,
    coverImage: post.coverImage ?? null,
    isPublished: post.isPublished,
    publishedAt: post.publishedAt
      ? new Date(post.publishedAt).toISOString().split("T")[0]
      : null,
    subjectIds: post.subjects.map((ps) => ps.subjectId),
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<BlogPostUpdateData>({
    resolver: zodResolver(blogPostUpdateSchema),
    defaultValues,
  });

  function onSubmit(data: BlogPostUpdateData) {
    startTransition(async () => {
      try {
        await updateBlogPost(post.id, data);
        toast.success("Post saved successfully");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save post");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant={post.isPublished ? "default" : "secondary"}>
          {post.isPublished ? "Published" : "Draft"}
        </Badge>
        {post.publishedAt && (
          <span className="text-sm text-muted-foreground">
            Published {new Date(post.publishedAt).toLocaleDateString()}
          </span>
        )}
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
              <Input id="title" {...register("title")} placeholder="Post title" />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register("slug")} placeholder="post-slug" />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOG_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                {...register("excerpt")}
                placeholder="Brief excerpt shown on blog listing..."
                rows={3}
                className="resize-y"
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
                entityId={post.id}
                uploadType="blog-cover"
                onUpload={(url) => setValue("coverImage", url, { shouldDirty: true })}
              />
            )}
          />

          <div className="space-y-1.5">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              {...register("content")}
              placeholder="Blog post content (HTML supported)"
              rows={16}
              className="resize-y font-mono text-sm"
            />
          </div>

          <Controller
            control={control}
            name="authorImage"
            render={({ field }) => (
              <ImageUploadField
                label="Author Photo"
                currentUrl={field.value ?? null}
                entityId={post.id}
                uploadType="blog-author"
                onUpload={(url) => setValue("authorImage", url, { shouldDirty: true })}
              />
            )}
          />

          <div className="space-y-1.5">
            <Label htmlFor="authorBio">Author Bio</Label>
            <Textarea
              id="authorBio"
              {...register("authorBio")}
              placeholder="Short author bio..."
              rows={3}
              className="resize-y"
            />
          </div>
        </TabsContent>

        {/* PUBLISHING TAB */}
        <TabsContent value="publishing" className="pt-4 space-y-6">
          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <Switch
                  id="isPublished"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isPublished">Published</Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publishedAt">Publish Date</Label>
            <Input
              id="publishedAt"
              type="date"
              {...register("publishedAt")}
              className="max-w-[200px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Subjects</Label>
            <Controller
              control={control}
              name="subjectIds"
              render={({ field }) => (
                <SubjectSelect
                  subjects={subjects}
                  selectedIds={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-2 border-t border-border">
        <Button type="submit" disabled={isPending} className="min-w-[120px]">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
