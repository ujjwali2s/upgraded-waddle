"use client"

import React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Tag } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const loadData = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name")
    setCategories(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreate = () => {
    setEditingCategory(null)
    setFormData({ name: "", slug: "", description: "" })
    setDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
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
      updated_at: new Date().toISOString(),
    }

    if (editingCategory) {
      const { error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", editingCategory.id)
      if (error) toast.error(error.message)
      else toast.success("Category updated")
    } else {
      const { error } = await supabase.from("categories").insert(payload)
      if (error) toast.error(error.message)
      else toast.success("Category created")
    }

    setIsSaving(false)
    setDialogOpen(false)
    loadData()
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) toast.error(error.message)
    else {
      toast.success("Category deleted")
      loadData()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading categories...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground">Manage product categories.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-card-foreground">
                {editingCategory ? "Edit Category" : "New Category"}
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
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? "Saving..."
                  : editingCategory
                    ? "Update"
                    : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
          <Tag className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            No categories yet
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-medium text-card-foreground">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">/{cat.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => openEdit(cat)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive bg-transparent"
                    onClick={() => handleDelete(cat.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
