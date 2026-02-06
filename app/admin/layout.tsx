import React from "react"
import { getSession } from "@/lib/session"
import { SiteHeader } from "@/components/site-header"
import { AdminNav } from "@/components/admin-nav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // If no session or not admin, we assume it's the login page (guarded by Middleware otherwise)
  // We strictly render just the children (Page content) without the Admin Shell
  if (!session || session.role !== "admin") {
    return <>{children}</>
  }

  // If Admin, render the full Shell
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <AdminNav />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
