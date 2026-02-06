import React from "react"
import { redirect } from "next/navigation"

import { SiteHeader } from "@/components/site-header"
import { DashboardNav } from "@/components/dashboard-nav"

import { getSession } from "@/lib/session"
import pool from "@/lib/db"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const client = await pool.connect()
  try {
    const { rows } = await client.query('SELECT is_verified FROM public.users WHERE id = $1', [session.userId])
    const user = rows[0]

    if (user && !user.is_verified) {
      redirect("/auth/verify")
    }
  } finally {
    client.release()
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <DashboardNav />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
