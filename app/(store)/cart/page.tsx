"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  availability: number
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadCart = () => {
      const stored = localStorage.getItem("shipspro-cart")
      if (stored) setCart(JSON.parse(stored))
    }
    loadCart()
    window.addEventListener("cart-updated", loadCart)
    return () => window.removeEventListener("cart-updated", loadCart)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me")
        const data = await res.json()
        setIsLoggedIn(!!data.user)
      } catch (error) {
        console.error("Auth check failed", error)
        setIsLoggedIn(false)
      }
    }
    checkAuth()
  }, [])

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem("shipspro-cart", JSON.stringify(newCart))
    window.dispatchEvent(new Event("cart-updated"))
  }

  const updateQuantity = (id: string, delta: number) => {
    const newCart = cart.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, Math.min(item.availability, item.quantity + delta))
        return { ...item, quantity: newQty }
      }
      return item
    })
    updateCart(newCart)
  }

  const removeItem = (id: string) => {
    updateCart(cart.filter((item) => item.id !== id))
    toast.success("Item removed from cart")
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card py-20">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-card-foreground">
            Your cart is empty
          </h2>
          <p className="text-sm text-muted-foreground">
            Browse our store and add items to your cart.
          </p>
          <Link href="/">
            <Button>Browse Store</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Shopping Cart</h1>
      <div className="flex flex-col gap-4">
        {cart.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <h3 className="font-medium text-card-foreground">{item.name}</h3>
                <p className="text-sm text-muted-foreground">
                  ${Number(item.price).toFixed(2)} USD each
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-md border border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="min-w-[2rem] text-center text-sm font-medium text-foreground">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="min-w-[5rem] text-right font-semibold text-card-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="mt-2">
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-lg font-semibold text-card-foreground">Total</span>
            <span className="text-2xl font-bold text-card-foreground">
              ${total.toFixed(2)} USD
            </span>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t border-border px-4 pt-4">
            <Link href="/">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
            {isLoggedIn ? (
              <Link href="/checkout">
                <Button className="gap-1.5">
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button className="gap-1.5">
                  Login to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
