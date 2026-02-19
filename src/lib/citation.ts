export interface CitationData {
  title: string;
  authorName: string;
  isbn: string | null;
  slug: string;
  publishYear: number | null;
  createdAt: Date;
}

export function resolveYear(data: CitationData): number {
  return data.publishYear ?? new Date(data.createdAt).getFullYear();
}

export function buildCitationKey(authorName: string, year: number): string {
  const lastName = authorName.split(" ").at(-1) ?? "unknown";
  const sanitized = lastName.replace(/[^a-zA-Z0-9]/g, "");
  return sanitized.length > 0 ? `${sanitized}${year}` : `unknown${year}`;
}

export function buildBibtex(data: CitationData): string {
  const year = resolveYear(data);
  const key = buildCitationKey(data.authorName, year);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scienceone.com";
  const url = `${appUrl}/catalog/${data.slug}`;

  const lines = [
    `@book{${key},`,
    `  title     = {${data.title}},`,
    `  author    = {${data.authorName}},`,
    `  publisher = {ScienceOne},`,
    `  year      = {${year}},`,
    data.isbn ? `  isbn      = {${data.isbn}},` : null,
    `  url       = {${url}}`,
    `}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return lines;
}

export function buildApa(data: CitationData): string {
  const year = resolveYear(data);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scienceone.com";
  const url = `${appUrl}/catalog/${data.slug}`;
  return `${data.authorName}. (${year}). ${data.title}. ScienceOne. ${url}`;
}
