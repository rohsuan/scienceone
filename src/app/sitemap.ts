import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scienceone.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogPosts, resources, simulations] = await Promise.all([
    prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.resource.findMany({
      where: { isPublished: true, type: { not: "SIMULATION" } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.resource.findMany({
      where: { isPublished: true, type: "SIMULATION" },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/resources`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/simulations`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/catalog`, changeFrequency: "weekly", priority: 0.8 },
  ];

  return [
    ...staticRoutes,
    ...blogPosts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...resources.map((r) => ({
      url: `${BASE_URL}/resources/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...simulations.map((s) => ({
      url: `${BASE_URL}/simulations/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
