import { createClient } from '@supabase/supabase-js'

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Create a pool-like wrapper for backward compatibility
const pool = {
    async connect() {
        // Return a client-like object that uses Supabase
        return {
            async query(text: string, params?: any[]) {
                try {
                    // Parse the SQL query and convert to Supabase query
                    const lowerText = text.toLowerCase().trim()

                    // Handle SELECT COUNT queries
                    if (lowerText.includes('select count(*)')) {
                        const tableName = extractTableName(text)
                        const { count, error } = await supabase
                            .from(tableName)
                            .select('*', { count: 'exact', head: true })

                        if (error) throw error
                        return { rows: [{ count: count || 0 }] }
                    }

                    // Handle SELECT SUM queries
                    if (lowerText.includes('select sum(')) {
                        const match = text.match(/sum\((\w+)\)/i)
                        const column = match ? match[1] : 'total'
                        const tableName = extractTableName(text)
                        const whereClause = extractWhereClause(text)

                        let query = supabase.from(tableName).select(column)

                        if (whereClause) {
                            query = applyWhereClause(query, whereClause)
                        }

                        const { data, error } = await query
                        if (error) throw error

                        const sum = data?.reduce((acc: number, row: any) => acc + (parseFloat(row[column]) || 0), 0) || 0
                        return { rows: [{ sum }] }
                    }

                    // Handle regular SELECT queries
                    if (lowerText.startsWith('select')) {
                        const tableName = extractTableName(text)
                        const { data, error } = await supabase.from(tableName).select('*')
                        if (error) throw error
                        return { rows: data || [] }
                    }

                    // For other queries, throw an error suggesting to use Supabase client directly
                    throw new Error('This query type is not supported by the pool wrapper. Please use Supabase client directly.')
                } catch (error) {
                    console.error('Query error:', error)
                    throw error
                }
            },
            release() {
                // No-op for Supabase client
            }
        }
    },

    async query(text: string, params?: any[]) {
        const client = await this.connect()
        try {
            return await client.query(text, params)
        } finally {
            client.release()
        }
    }
}

// Helper functions
function extractTableName(sql: string): string {
    const match = sql.match(/from\s+(\w+)/i)
    return match ? match[1] : ''
}

function extractWhereClause(sql: string): string {
    const match = sql.match(/where\s+(.+?)(?:order|group|limit|$)/i)
    return match ? match[1].trim() : ''
}

function applyWhereClause(query: any, whereClause: string): any {
    // Parse simple WHERE clauses like "status = 'completed' OR status = 'delivered'"
    if (whereClause.includes(' or ')) {
        const conditions = whereClause.split(' or ').map(c => c.trim())
        const values = conditions.map(c => {
            const match = c.match(/=\s*'([^']+)'/)
            return match ? match[1] : ''
        }).filter(Boolean)

        if (values.length > 0) {
            const column = conditions[0].split('=')[0].trim()
            return query.in(column, values)
        }
    } else if (whereClause.includes('=')) {
        const [column, value] = whereClause.split('=').map(s => s.trim())
        const cleanValue = value.replace(/'/g, '')
        return query.eq(column, cleanValue)
    }

    return query
}

export default pool

