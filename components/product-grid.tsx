import { ProductCard } from "@/components/product-card"

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  availability: number
  status: string
  category_name?: string
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
        <p className="text-lg font-medium text-muted-foreground">
          No products found
        </p>
        <p className="text-sm text-muted-foreground">
          Check back later for new products.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
