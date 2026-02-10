import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { CategorySidebar } from "@/components/category-sidebar"
import { ProductGrid } from "@/components/product-grid"
import { Plane } from "lucide-react"

export const revalidate = 60


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
      category_name: "General",
    }))
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
})

export default async function StorePage() {

  const [categories, formattedProducts] = await Promise.all([
    getCategories(),
    getProducts()
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">


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
