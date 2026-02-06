"use client"

import React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Package2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ProductSearch } from "@/components/admin/product-search"

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  category_id: string | null
  availability: number
  status: string
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    category_id: "",
    availability: "",
    status: "active",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const loadData = async () => {
    const supabase = createClient()
    const [prodRes, catRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ])
    setProducts(prodRes.data || [])
    setCategories(catRes.data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreate = () => {
    setEditingProduct(null)
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: "",
      category_id: "",
      availability: "",
      status: "active",
    })
    setDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: String(product.price),
      category_id: product.category_id || "",
      availability: String(product.availability),
      status: product.status,
    })
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const supabase = createClient()

    const payload = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      price: Number.parseFloat(formData.price),
      category_id: formData.category_id || null,
      availability: Number.parseInt(formData.availability),
      status: formData.status,
      updated_at: new Date().toISOString(),
    }

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingProduct.id)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Product updated")
      }
    } else {
      const { error } = await supabase.from("products").insert(payload)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Product created")
      }
    }

    setIsSaving(false)
    setDialogOpen(false)
    loadData()
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    const supabase = createClient()
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Product deleted")
      loadData()
    }
  }

  const filteredProducts = React.useMemo(() => {
    if (!searchQuery.trim()) return products

    const query = searchQuery.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    )
  }, [products, searchQuery])

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "—"
    return categories.find((c) => c.id === categoryId)?.name || "—"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">
                {editingProduct ? "Edit Product" : "New Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Price (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Availability</Label>
                  <Input
                    type="number"
                    value={formData.availability}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        availability: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(v) =>
                      setFormData({ ...formData, category_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) =>
                      setFormData({ ...formData, status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? "Saving..."
                  : editingProduct
                    ? "Update Product"
                    : "Create Product"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-foreground">All Products</h2>
            <div className="w-full sm:w-80">
              <ProductSearch
                onSearch={setSearchQuery}
                placeholder="Search by name, slug, or description..."
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
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    {searchQuery ? "No products match your search" : "No products yet"}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
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
                      {getCategoryName(product.category_id)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      ${Number(product.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {product.availability} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={product.status === "active" ? "default" : "secondary"}
                        className={
                          product.status === "active"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-600 dark:border-green-400"
                            : ""
                        }
                      >
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
