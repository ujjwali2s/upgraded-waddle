import React from "react"
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"

import { SiteHeader } from "@/components/site-header"
import { DashboardNav } from "@/components/dashboard-nav"

import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('is_verified')
    .eq('id', session.userId)
    .single()

  if (user && !user.is_verified) {
    redirect("/auth/verify")
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
