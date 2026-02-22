"use client";

import React, { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { ResourceAdminDetail } from "@/lib/resource-admin-queries";
import { updateResource } from "@/lib/resource-admin-actions";
import { resourceUpdateSchema, type ResourceUpdateData } from "@/lib/resource-admin-schemas";

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
import FileUploadField from "@/components/admin/FileUploadField";
import SubjectSelect from "@/components/admin/SubjectSelect";

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

interface ResourceEditFormProps {
  resource: ResourceAdminDetail;
  subjects: Array<{ id: string; name: string; slug: string }>;
  simulationKeys?: string[];
}

export default function ResourceEditForm({
  resource,
  subjects,
  simulationKeys = [],
}: ResourceEditFormProps) {
  const [isPending, startTransition] = useTransition();

  const defaultValues: ResourceUpdateData = {
    title: resource.title,
    slug: resource.slug,
    description: resource.description ?? null,
    content: resource.content ?? null,
    type: resource.type,
    level: resource.level,
    isFree: resource.isFree,
    coverImage: resource.coverImage ?? null,
    fileKey: resource.fileKey ?? null,
    fileName: resource.fileName ?? null,
    price: resource.pricing ? Number(resource.pricing.amount) : null,
    subjectIds: resource.subjects.map((rs) => rs.subjectId),
    componentKey: resource.simulation?.componentKey ?? null,
    teacherGuide: resource.simulation?.teacherGuide ?? null,
    parameterDocs: resource.simulation?.parameterDocs ?? null,
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResourceUpdateData>({
    resolver: zodResolver(resourceUpdateSchema),
    defaultValues,
  });

  const isFree = watch("isFree");
  const resourceType = watch("type");

  function onSubmit(data: ResourceUpdateData) {
    startTransition(async () => {
      try {
        await updateResource(resource.id, data);
        toast.success("Resource saved successfully");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save resource");
      }
    });
  }

  const tabsList = ["details", "content", "publishing"];
  if (resourceType === "SIMULATION") {
    tabsList.push("simulation");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant={resource.isPublished ? "default" : "secondary"}>
          {resource.isPublished ? "Published" : "Draft"}
        </Badge>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
          {resourceType === "SIMULATION" && (
            <TabsTrigger value="simulation">Simulation</TabsTrigger>
          )}
        </TabsList>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} placeholder="Resource title" />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register("slug")} placeholder="resource-slug" />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Level</Label>
              <Controller
                control={control}
                name="level"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Brief description of the resource"
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
                entityId={resource.id}
                uploadType="resource-cover"
                onUpload={(url) => setValue("coverImage", url, { shouldDirty: true })}
              />
            )}
          />

          <div className="space-y-1.5">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              {...register("content")}
              placeholder="Resource content (HTML supported)"
              rows={12}
              className="resize-y font-mono text-sm"
            />
          </div>

          <FileUploadField
            label="Downloadable File"
            currentFileName={resource.fileName ?? null}
            resourceId={resource.id}
            onUpload={(r2Key, fileName) => {
              setValue("fileKey", r2Key, { shouldDirty: true });
              setValue("fileName", fileName, { shouldDirty: true });
            }}
          />
        </TabsContent>

        {/* PUBLISHING TAB */}
        <TabsContent value="publishing" className="pt-4 space-y-6">
          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="isFree"
              render={({ field }) => (
                <Switch
                  id="isFree"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isFree">Free resource</Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              {...register("price", { valueAsNumber: true })}
              placeholder="e.g. 9.99"
              disabled={isFree}
              className="max-w-[200px]"
            />
            {isFree && (
              <p className="text-xs text-muted-foreground">
                Price is disabled for free resources.
              </p>
            )}
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

        {/* SIMULATION TAB */}
        {resourceType === "SIMULATION" && (
          <TabsContent value="simulation" className="pt-4 space-y-6">
            <div className="space-y-1.5">
              <Label>Simulation Component</Label>
              <Controller
                control={control}
                name="componentKey"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a simulation..." />
                    </SelectTrigger>
                    <SelectContent>
                      {simulationKeys.map((key) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="teacherGuide">Teacher Guide</Label>
              <Textarea
                id="teacherGuide"
                {...register("teacherGuide")}
                placeholder="Teacher guide content (HTML supported)"
                rows={8}
                className="resize-y font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="parameterDocs">Parameter Documentation</Label>
              <Textarea
                id="parameterDocs"
                {...register("parameterDocs")}
                placeholder="Document simulation parameters and their effects"
                rows={6}
                className="resize-y font-mono text-sm"
              />
            </div>
          </TabsContent>
        )}
      </Tabs>

      <div className="pt-2 border-t border-border">
        <Button type="submit" disabled={isPending} className="min-w-[120px]">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
