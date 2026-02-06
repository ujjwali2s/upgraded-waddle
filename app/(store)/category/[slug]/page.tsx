import { createClient } from "@/lib/supabase/server"
import { CategorySidebar } from "@/components/category-sidebar"
import { ProductGrid } from "@/components/product-grid"
import { notFound } from "next/navigation"

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!category) {
    notFound()
  }

  const { data: products } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("category_id", category.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const formattedProducts = (products || []).map((p) => ({
    ...p,
    category_name: (p.categories as { name: string } | null)?.name ?? undefined,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <CategorySidebar categories={categories || []} activeSlug={slug} />
        <div className="flex-1">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {category.description}
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {formattedProducts.length} product
              {formattedProducts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <ProductGrid products={formattedProducts} />
        </div>
      </div>
    </div>
  )
}
