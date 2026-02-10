import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            )
        }

        console.log('Attempting to delete product with ID:', id)

        const supabase = await createClient()

        // First check if the product exists
        const { data: existingProduct, error: fetchError } = await supabase
            .from('products')
            .select('id, name')
            .eq('id', id)
            .single()

        if (fetchError) {
            console.error('Error fetching product:', fetchError)
            return NextResponse.json(
                { error: `Product not found: ${fetchError.message}` },
                { status: 404 }
            )
        }

        console.log('Found product:', existingProduct)

        // Soft delete the product since RLS prevents hard delete
        const { data, error } = await supabase
            .from('products')
            .update({ status: 'deleted' })
            .eq('id', id)
            .select()

        console.log('Soft delete result:', { data, error })

        if (error) {
            console.error('Error soft deleting product:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        console.log('Product soft deleted successfully')

        // Invalidate cache
        /* 
        try {
          revalidatePath('/')
          revalidatePath('/admin/products')
        } catch (e) {
          console.error('Revalidate error:', e)
        }
        */

        return NextResponse.json({ success: true, deleted: data })
    } catch (error) {
        console.error('Error in delete product route:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
