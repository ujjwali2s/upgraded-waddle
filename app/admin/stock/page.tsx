import { createClient } from "@/lib/supabase/server"
import { StockTable } from "@/components/admin/stock-table"

export default async function AdminStockPage() {
    let products: Array<{
        id: string
        name: string
        slug: string
        price: number
        availability: number
        status: string
        category_name?: string
    }> = []

    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("products")
            .select("*, categories(name)")
            .order("availability", { ascending: true })

        if (data) {
            products = data.map((p: any) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                price: p.price,
                availability: p.availability,
                status: p.status,
                category_name: p.categories?.name,
            }))
        }
    } catch (error) {
        console.error("Error fetching products:", error)
    }

    return <StockTable products={products} />
}
