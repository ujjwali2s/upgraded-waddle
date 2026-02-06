"use client"

import * as React from "react"
import Link from "next/link"
import { Package2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProductSearch } from "@/components/admin/product-search"

interface Product {
    id: string
    name: string
    slug: string
    price: number
    availability: number
    status: string
    category_name?: string
}

interface StockTableProps {
    products: Product[]
}

export function StockTable({ products }: StockTableProps) {
    const [searchQuery, setSearchQuery] = React.useState("")

    const filteredProducts = React.useMemo(() => {
        if (!searchQuery.trim()) return products

        const query = searchQuery.toLowerCase()
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(query) ||
                p.slug.toLowerCase().includes(query) ||
                p.category_name?.toLowerCase().includes(query)
        )
    }, [products, searchQuery])

    const lowStock = filteredProducts.filter((p) => p.availability > 0 && p.availability <= 10)
    const outOfStock = filteredProducts.filter((p) => p.availability === 0)
    const inStock = filteredProducts.filter((p) => p.availability > 10)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Stock Management</h1>
                <p className="text-sm text-muted-foreground">
                    Monitor and manage product inventory levels
                </p>
            </div>

            {/* Stock Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">In Stock</p>
                            <p className="text-2xl font-bold text-foreground">{inStock.length}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
                            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                            <p className="text-2xl font-bold text-foreground">{lowStock.length}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                            <p className="text-2xl font-bold text-foreground">{outOfStock.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-6 py-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Product Inventory</h2>
                        <div className="w-full sm:w-80">
                            <ProductSearch
                                onSearch={setSearchQuery}
                                placeholder="Search by name, slug, or category..."
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                                        {searchQuery ? "No products match your search" : "No products found"}
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const stockStatus =
                                        product.availability === 0
                                            ? "out"
                                            : product.availability <= 10
                                                ? "low"
                                                : "in"

                                    return (
                                        <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                        <Package2 className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{product.name}</p>
                                                        <p className="text-xs text-muted-foreground">{product.slug}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {product.category_name || "—"}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-foreground">
                                                ${Number(product.price).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-sm font-semibold ${stockStatus === "out"
                                                                ? "text-red-600 dark:text-red-400"
                                                                : stockStatus === "low"
                                                                    ? "text-yellow-600 dark:text-yellow-400"
                                                                    : "text-green-600 dark:text-green-400"
                                                            }`}
                                                    >
                                                        {product.availability}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">units</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant={
                                                        stockStatus === "out"
                                                            ? "destructive"
                                                            : stockStatus === "low"
                                                                ? "outline"
                                                                : "default"
                                                    }
                                                    className={
                                                        stockStatus === "low"
                                                            ? "border-yellow-600 bg-yellow-500/10 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400"
                                                            : stockStatus === "in"
                                                                ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-600 dark:border-green-400"
                                                                : ""
                                                    }
                                                >
                                                    {stockStatus === "out"
                                                        ? "Out of Stock"
                                                        : stockStatus === "low"
                                                            ? "Low Stock"
                                                            : "In Stock"}
                                                </Badge>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
