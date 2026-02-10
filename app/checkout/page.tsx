
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import { Wallet, CreditCard, ShoppingCart, CheckCircle2, AlertCircle, ArrowLeft, Bitcoin, RefreshCw } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

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
    const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<"wallet" | "crypto">("wallet")
    const router = useRouter()

    const loadWallet = useCallback(async (silent = false) => {
        if (!silent) setIsRefreshingBalance(true)
        try {
            const res = await fetch("/api/auth/me")
            const authData = await res.json()
            if (!authData.user) {
                router.push("/auth/login")
                return
            }

            const walletRes = await fetch("/api/wallet/get")
            if (walletRes.ok) {
                const data = await walletRes.json()
                setWalletBalance(data.balance || 0)
                if (!silent) toast.success("Balance updated")
            }
        } catch (error) {
            console.error("Failed to load wallet", error)
            if (!silent) toast.error("Failed to update balance")
        } finally {
            setIsRefreshingBalance(false)
        }
    }, [router])

    useEffect(() => {
        const stored = localStorage.getItem("shipspro-cart")
        if (stored) setCart(JSON.parse(stored))
        loadWallet(true)

        // Expose refresh to local functions
        if (typeof window !== "undefined") {
            (window as any).refreshCheckoutBalance = () => loadWallet(false)
        }
    }, [router])

    const handleRefreshBalance = async (e: React.MouseEvent) => {
        e.stopPropagation()
        await loadWallet(false)
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const hasEnoughBalance = walletBalance >= total

    const handleCheckout = async () => {
        setIsProcessing(true)

        try {
            let endpoint = "/api/checkout" // Default wallet
            if (paymentMethod === "crypto") {
                endpoint = "/api/checkout/crypto"
            }

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cart,
                    paymentMethod: paymentMethod === "wallet" ? "wallet" : undefined, // crypto endpoint implies crypto
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || "Checkout failed")
                setIsProcessing(false)
                return
            }

            // Success
            localStorage.removeItem("shipspro-cart")
            window.dispatchEvent(new Event("cart-updated"))

            if (paymentMethod === "crypto" && data.invoiceUrl) {
                window.location.href = data.invoiceUrl
            } else {
                toast.success("Order placed successfully!")
                router.push(`/dashboard/orders`) // Or maybe a confirmation page?
            }

        } catch {
            toast.error("An error occurred during checkout")
            setIsProcessing(false)
        }
    }

    if (cart.length === 0) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
                <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h2 className="text-2xl font-bold text-foreground">Your cart is empty</h2>
                <p className="mt-2 text-muted-foreground">Add items to your cart to proceed with checkout.</p>
                <Link href="/" className="mt-6">
                    <Button size="lg">Browse Store</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/30 py-10">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/cart">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Checkout</h1>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Left Column: Payment Methods */}
                    <div className="lg:col-span-7">
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Payment Method</CardTitle>
                                <CardDescription>Select how you want to pay.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div
                                    className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-all hover:border-primary ${paymentMethod === "wallet" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"
                                        }`}
                                    onClick={() => setPaymentMethod("wallet")}
                                >
                                    <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                        <Wallet className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-foreground">Pay with Wallet</h3>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn("h-8 w-8", isRefreshingBalance && "animate-spin")}
                                                onClick={handleRefreshBalance}
                                                disabled={isRefreshingBalance}
                                            >
                                                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Balance: ${walletBalance.toFixed(2)} USD
                                        </p>
                                    </div>
                                    {paymentMethod === "wallet" && (
                                        <div className="absolute right-4 top-4">
                                            <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div
                                    className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-all hover:border-primary ${paymentMethod === "crypto" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"
                                        }`}
                                    onClick={() => setPaymentMethod("crypto")}
                                >
                                    <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                                        <Bitcoin className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground">Pay with Crypto</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Bitcoin, Ethereum, USDT, and more via Plisio.
                                        </p>
                                    </div>
                                    {paymentMethod === "crypto" && (
                                        <div className="absolute right-4 top-4">
                                            <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {paymentMethod === "wallet" && !hasEnoughBalance && (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
                                <div className="flex items-center gap-2 font-semibold">
                                    <AlertCircle className="h-5 w-5" />
                                    Insufficient Balance
                                </div>
                                <p className="mt-1 text-sm">
                                    You need <span className="font-bold">${(total - walletBalance).toFixed(2)}</span> more to complete this purchase.
                                    Select "Pay with Crypto" or add funds to your wallet.
                                </p>
                                <Link href="/dashboard/wallet?add_funds=true" target="_blank">
                                    <Button variant="link" className="px-0 text-destructive underline">
                                        Add Funds to Wallet
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-5">
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-md border text-xs font-bold text-muted-foreground">
                                                    x{item.quantity}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                    <div className="border-t border-border pt-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-base font-medium text-muted-foreground">Subtotal</span>
                                            <span className="text-base font-medium text-foreground">${total.toFixed(2)}</span>
                                        </div>
                                        {/* Tax or Shipping could go here */}
                                        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                                            <span className="text-lg font-bold text-foreground">Total</span>
                                            <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full text-lg"
                                    size="lg"
                                    disabled={isProcessing || (paymentMethod === "wallet" && !hasEnoughBalance)}
                                    onClick={handleCheckout}
                                >
                                    {isProcessing ? "Processing..." : (paymentMethod === "wallet" && !hasEnoughBalance ? "Insufficient Balance" : `Pay $${total.toFixed(2)}`)}
                                </Button>
                            </CardFooter>
                        </Card>
                        <p className="mt-4 text-center text-xs text-muted-foreground">
                            Secure checkout powered by ShipsPro.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
