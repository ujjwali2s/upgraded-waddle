import { getSession } from "@/lib/session"
import pool from "@/lib/db"
import { redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Wallet } from "lucide-react"
import { AddFunds } from "./components/add-funds"

export default async function WalletPage() {
  const session = await getSession()
  if (!session) redirect("/auth/login")

  const client = await pool.connect()
  let wallet = null

  try {
    const { rows } = await client.query('SELECT balance FROM public.users WHERE id = $1', [session.userId])
    wallet = { balance: rows[0]?.balance || 0 }
  } finally {
    client.release()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
        <p className="text-muted-foreground">
          Manage your account balance.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">Current Balance</CardTitle>
            <CardDescription>
              Your wallet balance is used for purchases
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-card-foreground">
            ${Number(wallet?.balance || 0).toFixed(2)}
            <span className="ml-2 text-base font-normal text-muted-foreground">
              USD
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Contact an administrator to add funds to your wallet. Wallet funds
            can be used to purchase any product in the store.
          </p>
        </CardContent>
      </Card>

      <AddFunds />
    </div>
  )
}
