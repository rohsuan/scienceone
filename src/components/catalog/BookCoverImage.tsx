import Image from "next/image";

interface BookCoverImageProps {
  coverImage: string | null;
  title: string;
  className?: string;
}

export default function BookCoverImage({
  coverImage,
  title,
  className,
}: BookCoverImageProps) {
  if (coverImage) {
    return (
      <div className={`relative aspect-[2/3] w-full overflow-hidden ${className ?? ""}`}>
        <Image
          src={coverImage}
          alt={`Cover of ${title}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 120px, 200px"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-[2/3] w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center ${className ?? ""}`}
      aria-label={`Cover of ${title}`}
    >
      <span className="font-serif text-6xl font-bold text-primary/30 select-none">
        {title.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
