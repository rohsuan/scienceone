import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  // Server-side session check — redirect logged-in users to dashboard
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="relative bg-background px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="heading-serif text-5xl font-bold tracking-tight text-primary sm:text-6xl lg:text-7xl">
            Where mathematics
            <br />
            comes alive
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Read STEM books with beautifully rendered formulas, right in your
            browser. No downloads, no plugins — just clear, elegant
            mathematics.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="w-full bg-primary px-8 text-primary-foreground hover:bg-primary/90 sm:w-auto"
            >
              <Link href="/sign-up">Get Started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full border-border px-8 sm:w-auto"
            >
              <Link href="/catalog">Browse Catalog</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Visual divider */}
      <div className="h-px bg-border mx-auto w-full max-w-7xl" />

      {/* Features section */}
      <section className="bg-muted/20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-14">
            <h2 className="heading-serif text-3xl font-bold text-foreground sm:text-4xl">
              Built for serious readers
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Everything you need to engage with technical literature
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Feature 1: Beautiful Math */}
            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-xl" aria-hidden="true">∑</span>
                </div>
                <CardTitle className="heading-serif text-xl text-foreground">
                  Beautiful Math
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  LaTeX formulas rendered with pixel-perfect precision.
                  Inline expressions and display equations look exactly as
                  the author intended.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2: Read Anywhere */}
            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-xl" aria-hidden="true">◻</span>
                </div>
                <CardTitle className="heading-serif text-xl text-foreground">
                  Read Anywhere
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Works on any device — laptop, tablet, or phone. No
                  downloads, no plugins. Open your book and start reading
                  instantly.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3: Academic Quality */}
            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-xl" aria-hidden="true">★</span>
                </div>
                <CardTitle className="heading-serif text-xl text-foreground">
                  Academic Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Curated, peer-reviewed content from leading STEM authors.
                  Every book meets the standards you expect from academic
                  publishing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-primary px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="heading-serif text-3xl font-bold text-primary-foreground sm:text-4xl">
            Start reading today
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Join scholars who read STEM books the way they were meant to be
            read.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-white px-10 text-primary hover:bg-white/90"
          >
            <Link href="/sign-up">Create your free account</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
