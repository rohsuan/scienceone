interface WelcomeSectionProps {
  userName: string;
}

export default function WelcomeSection({ userName }: WelcomeSectionProps) {
  const now = new Date();
  const dateString = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="py-8 sm:py-10">
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
        Welcome back, {userName}
      </h1>
      <p className="mt-2 text-muted-foreground text-base">
        Here&apos;s your reading activity
      </p>
      <p className="mt-1 text-sm text-muted-foreground/70">{dateString}</p>
    </div>
  );
}
