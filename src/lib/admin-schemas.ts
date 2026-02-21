import { z } from "zod";

export const bookUpdateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  authorName: z.string().min(1, "Author name is required"),
  authorBio: z.string().optional().nullable(),
  authorImage: z.string().optional().nullable(),
  synopsis: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  pageCount: z.union([
    z.number().int().positive(),
    z.nan().transform(() => null),
  ]).optional().nullable(),
  publishYear: z.union([
    z.number().int().positive(),
    z.nan().transform(() => null),
  ]).optional().nullable(),
  dimensions: z.string().optional().nullable(),
  printLink: z.string().optional().nullable(),
  isOpenAccess: z.boolean(),
  price: z.union([
    z.number().nonnegative(),
    z.nan().transform(() => null),
  ]).optional().nullable(),
  categoryIds: z.array(z.string()),
  pdfKey: z.string().optional().nullable(),
});

export type BookUpdateData = z.infer<typeof bookUpdateSchema>;

export const chapterContentUpdateSchema = z.object({
  content: z.string().min(1, "Content is required"),
});

export type ChapterContentUpdateData = z.infer<typeof chapterContentUpdateSchema>;
