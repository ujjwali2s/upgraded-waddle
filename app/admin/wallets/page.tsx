"use client"

import React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Wallet, Plus, Minus } from "lucide-react"
import { toast } from "sonner"

interface WalletWithProfile {
  id: string
  user_id: string
  balance: number
  profile_name: string
}

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<WalletWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<WalletWithProfile | null>(null)
  const [amount, setAmount] = useState("")
  const [action, setAction] = useState<"add" | "subtract">("add")
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("users")
      .select("id, full_name, email, balance")

    const formatted = (data || []).map((u: any) => ({
      id: u.id, // This is wallet id in interface, but we can use user id
      user_id: u.id,
      balance: Number(u.balance || 0),
      profile_name: u.full_name || u.email || "Unknown"
    }))
    setWallets(formatted)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const openDialog = (wallet: WalletWithProfile, act: "add" | "subtract") => {
    setSelectedWallet(wallet)
    setAction(act)
    setAmount("")
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWallet) return
    setIsSaving(true)

    const supabase = createClient()
    const delta = action === "add" ? Number(amount) : -Number(amount)
    const newBalance = Math.max(0, selectedWallet.balance + delta)

    const { error } = await supabase
      .from("users")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", selectedWallet.user_id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(
        `${action === "add" ? "Added" : "Subtracted"} $${Number(amount).toFixed(2)} ${action === "add" ? "to" : "from"} ${selectedWallet.profile_name}'s wallet`
      )
    }

    setIsSaving(false)
    setDialogOpen(false)
    loadData()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading wallets...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Wallets</h1>
        <p className="text-muted-foreground">
          Manage user wallet balances.
        </p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              {action === "add" ? "Add Funds" : "Subtract Funds"} -{" "}
              {selectedWallet?.profile_name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Current balance: ${selectedWallet?.balance.toFixed(2)}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Processing..." : `${action === "add" ? "Add" : "Subtract"} Funds`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {wallets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
          <Wallet className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            No wallets found
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {wallets.map((wallet) => (
            <Card key={wallet.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-medium text-card-foreground">
                    {wallet.profile_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    ID: {wallet.user_id.slice(0, 8)}...
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-card-foreground">
                    ${wallet.balance.toFixed(2)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => openDialog(wallet, "add")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => openDialog(wallet, "subtract")}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
