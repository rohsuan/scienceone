import { z } from "zod";

export const blogPostUpdateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  category: z.enum(["TEACHING", "COMPUTATION", "RESOURCES", "AI_IN_EDUCATION"]),
  authorName: z.string().min(1, "Author name is required"),
  authorBio: z.string().optional().nullable(),
  authorImage: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  isPublished: z.boolean(),
  publishedAt: z.string().optional().nullable(),
  subjectIds: z.array(z.string()),
});

export type BlogPostUpdateData = z.infer<typeof blogPostUpdateSchema>;
