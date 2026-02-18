import type { ReactNode } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AuthCardProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="space-y-1 text-center pb-4">
        <CardTitle className="heading-serif text-2xl font-semibold text-primary">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="flex justify-center text-sm text-muted-foreground border-t pt-4">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
