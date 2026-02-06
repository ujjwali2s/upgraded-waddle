"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package } from "lucide-react"
import { toast } from "sonner"

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

export function ProductCard({ product }: { product: Product }) {
  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem("shipspro-cart") || "[]")
    const existing = cart.find((item: { id: string }) => item.id === product.id)

    if (existing) {
      if (existing.quantity >= product.availability) {
        toast.error("Cannot add more than available quantity")
        return
      }
      existing.quantity += 1
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        availability: product.availability,
      })
    }

    localStorage.setItem("shipspro-cart", JSON.stringify(cart))
    window.dispatchEvent(new Event("cart-updated"))
    toast.success(`${product.name} added to cart`)
  }

  const isOutOfStock = product.availability === 0

  return (
    <Card className="flex flex-col justify-between transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-snug text-card-foreground">
            {product.name}
          </CardTitle>
          <Badge
            variant={isOutOfStock ? "destructive" : "secondary"}
            className="shrink-0 text-xs"
          >
            {isOutOfStock
              ? "Sold Out"
              : `${product.availability} Available`}
          </Badge>
        </div>
        {product.category_name && (
          <p className="text-xs font-medium text-primary">
            {product.category_name}
          </p>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-card-foreground">
            ${Number(product.price).toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">USD</span>
        </div>
        <Button
          size="sm"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="gap-1.5"
        >
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock ? "Sold Out" : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  )
}
