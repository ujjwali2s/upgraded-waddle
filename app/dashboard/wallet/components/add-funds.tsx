
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Bitcoin } from "lucide-react"
import { toast } from "sonner"

export function AddFunds() {
    const [amount, setAmount] = useState("")
    const [loading, setLoading] = useState(false)

    const handleAddFunds = async () => {
        const val = parseFloat(amount)
        if (isNaN(val) || val <= 0) {
            toast.error("Please enter a valid amount")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/create-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: val,
                    type: "wallet_funding"
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to initiate payment")

            if (data.url) {
                window.location.href = data.url
            } else {
                toast.error("No payment URL returned")
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-primary" />
                    Add Funds
                </CardTitle>
                <CardDescription>
                    Top up your wallet using Cryptocurrency via Plisio.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Amount (USD)
                        </label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            min="1"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleAddFunds} disabled={loading} className="gap-2">
                        {loading ? "Processing..." : (
                            <>
                                <Bitcoin className="h-4 w-4" />
                                Pay with Crypto
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
