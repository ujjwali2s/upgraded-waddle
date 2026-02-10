import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { CategorySidebar } from "@/components/category-sidebar"
import { ProductGrid } from "@/components/product-grid"
import { Plane } from "lucide-react"

// Cache categories for the duration of the request
const getCategories = cache(async () => {
  try {
    const supabase = await createClient()
    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .order("name")

    return catData || []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
})

// Cache products for the duration of the request
const getProducts = cache(async () => {
  try {
    const supabase = await createClient()
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error fetching products:", error)
      return []
    }

    return (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      availability: p.availability,
      status: p.status,
      category_name: "General", // Default category since table might be missing
    }))
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
})

export default async function StorePage() {
  // Execute queries in parallel for better performance
  const [categories, formattedProducts] = await Promise.all([
    getCategories(),
    getProducts()
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* <div className="mb-8 rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Plane className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-balance text-2xl font-bold text-card-foreground md:text-3xl">
              Premium Shipping Accounts & Labels
            </h1>
            <p className="mt-1 text-muted-foreground">
              Get verified FedEx, DHL, UPS, and USPS accounts. All products are
              digital and delivered instantly after purchase.
            </p>
          </div>
        </div>
      </div> */}

      <div className="flex flex-col gap-6 lg:flex-row">
        <CategorySidebar categories={categories} />
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              All Products
            </h2>
            <p className="text-sm text-muted-foreground">
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
