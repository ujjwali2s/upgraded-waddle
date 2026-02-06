import Link from "next/link"
import { cn } from "@/lib/utils"
import { Tag } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

export function CategorySidebar({
  categories,
  activeSlug,
}: {
  categories: Category[]
  activeSlug?: string
}) {
  return (
    <aside className="hidden w-full shrink-0 lg:block lg:w-56">
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Tag className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-card-foreground">
            Categories
          </h2>
        </div>
        <nav className="flex flex-col p-1.5">
          <Link
            href="/"
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors",
              !activeSlug
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                activeSlug === cat.slug
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
