import { createClient } from "@/lib/supabase/server"
import { CategorySidebar } from "@/components/category-sidebar"
import { ProductGrid } from "@/components/product-grid"
import { Plane } from "lucide-react"

export default async function StorePage() {
  let categories: Array<{
    id: string
    name: string
    slug: string
    description: string | null
  }> = []
  let formattedProducts: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    price: number
    availability: number
    status: string
    category_name?: string
  }> = []

  try {
    const supabase = await createClient()

    const { data: catData, error: catError } = await supabase
      .from("categories")
      .select("*")
      .order("name")



    if (catData) categories = catData

    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("status", "active")
      .order("created_at", { ascending: false })


    formattedProducts = (products || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: p.name as string,
      slug: p.slug as string,
      description: p.description as string | null,
      price: p.price as number,
      availability: p.availability as number,
      status: p.status as string,
      category_name: (p.categories as { name: string } | null)?.name ?? undefined,
    }))
  } catch (error) {

  }

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
