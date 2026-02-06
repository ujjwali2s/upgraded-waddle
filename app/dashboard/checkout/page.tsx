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
import { Wallet, ShoppingCart, CheckCircle2, AlertCircle } from "lucide-react"
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

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState("")
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem("shipspro-cart")
    if (stored) setCart(JSON.parse(stored))

    const loadWallet = async () => {
      try {
        const res = await fetch("/api/wallet/get")
        if (res.status === 401) {
          router.push("/auth/login")
          return
        }
        const data = await res.json()
        if (res.ok) {
          setWalletBalance(data.balance || 0)
        }
      } catch (error) {
        console.error("Failed to load wallet")
      }
    }
    loadWallet()
  }, [])

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const hasEnoughBalance = walletBalance >= total

  const handleCheckout = async () => {
    setIsProcessing(true)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          paymentMethod: "wallet",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Checkout failed")
        setIsProcessing(false)
        return
      }

      // Clear cart
      localStorage.removeItem("shipspro-cart")
      window.dispatchEvent(new Event("cart-updated"))
      setOrderId(data.orderId)
      setOrderComplete(true)
      toast.success("Order placed successfully!")
    } catch {
      toast.error("An error occurred during checkout")
    } finally {
      setIsProcessing(false)
    }
  }

  if (orderComplete) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Order Confirmed!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Order #{orderId.slice(0, 8)} has been placed successfully.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/orders">
            <Button>View Orders</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">
          Your cart is empty
        </h2>
        <Link href="/">
          <Button>Browse Store</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
        <p className="text-muted-foreground">Review your order and confirm.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-card-foreground">
                  {item.name}{" "}
                  <span className="text-muted-foreground">
                    x{item.quantity}
                  </span>
                </span>
                <span className="font-medium text-card-foreground">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
              <span className="text-lg font-semibold text-card-foreground">
                Total
              </span>
              <span className="text-2xl font-bold text-card-foreground">
                ${total.toFixed(2)} USD
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Wallet className="h-5 w-5" />
            Pay with Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Wallet Balance
            </span>
            <span className="text-lg font-bold text-card-foreground">
              ${walletBalance.toFixed(2)} USD
            </span>
          </div>
          {!hasEnoughBalance && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 p-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">
                Insufficient balance. You need ${(total - walletBalance).toFixed(2)}{" "}
                more. Contact an administrator to add funds.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
          <Link href="/cart">
            <Button variant="outline">Back to Cart</Button>
          </Link>
          <Button
            onClick={handleCheckout}
            disabled={!hasEnoughBalance || isProcessing}
          >
            {isProcessing ? "Processing..." : `Pay $${total.toFixed(2)}`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
