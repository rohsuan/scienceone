import { z } from "zod";

export const resourceUpdateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  type: z.enum(["LESSON_PLAN", "PROBLEM_SET", "COURSE_MODULE", "LAB_GUIDE", "SIMULATION"]),
  level: z.enum(["AP", "INTRO_UNIVERSITY", "ADVANCED_UNIVERSITY"]),
  isFree: z.boolean(),
  coverImage: z.string().optional().nullable(),
  fileKey: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  price: z
    .union([z.number().nonnegative(), z.nan().transform(() => null)])
    .optional()
    .nullable(),
  subjectIds: z.array(z.string()),
  // Simulation fields
  componentKey: z.string().optional().nullable(),
  teacherGuide: z.string().optional().nullable(),
  parameterDocs: z.string().optional().nullable(),
});

export type ResourceUpdateData = z.infer<typeof resourceUpdateSchema>;
