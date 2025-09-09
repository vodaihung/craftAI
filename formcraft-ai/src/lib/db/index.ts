import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Configure connection with optimized settings
const sql = neon(process.env.DATABASE_URL, {
  // Optimize for performance
  fetchConnectionCache: true,
  // Reduce timeout for faster failures
  connectionTimeoutMillis: 5000,
  // Enable connection pooling
  poolSize: 10,
  // Optimize for serverless
  idleTimeoutMillis: 30000,
})

// Create the database instance with optimized settings
export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery: (query, params) => {
      if (query.includes('SELECT') && params.length > 0) {
        console.log(`🔍 DB Query: ${query.substring(0, 100)}...`)
      }
    }
  } : false
})

// Connection health check
let isHealthy = true
let lastHealthCheck = 0

export async function checkDbHealth(): Promise<boolean> {
  const now = Date.now()

  // Only check health every 30 seconds
  if (now - lastHealthCheck < 30000 && isHealthy) {
    return isHealthy
  }

  try {
    await sql`SELECT 1`
    isHealthy = true
    lastHealthCheck = now
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    isHealthy = false
    return false
  }
}

// Export schema for use in other files
export * from './schema'
