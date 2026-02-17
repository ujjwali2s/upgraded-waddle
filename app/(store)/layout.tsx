import React from "react"
export const dynamic = "force-dynamic"

import { SiteHeader } from "@/components/site-header"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <img
                src="/images/logo.png"
                alt="ShipsPro Logo"
                className="h-8 w-8 rounded-full"
              />
              <span className="text-sm font-semibold text-foreground">
                ShipsPro Global Air Cargo
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Premium shipping accounts and labels. All products are digital and
              delivered instantly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
