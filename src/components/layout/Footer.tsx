import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand column */}
          <div className="space-y-3">
            <p className="font-serif text-lg font-semibold text-primary">ScienceOne</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Scholarly books for curious minds
            </p>
          </div>

          {/* Spacer on desktop */}
          <div className="hidden md:block" />

          {/* Links column */}
          <div>
            <p className="text-sm font-medium text-foreground mb-4">Company</p>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <p className="text-sm text-muted-foreground text-center">
          &copy; 2026 ScienceOne. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
