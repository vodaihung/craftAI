import { neon } from '@neondatabase/serverless'

interface ConnectionTestResult {
  success: boolean
  connectionString?: string
  testResult?: any
  error?: string
}

export async function testDatabaseConnection(): Promise<ConnectionTestResult> {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return {
        success: false,
        error: 'DATABASE_URL environment variable is not set'
      }
    }

    // Create connection
    const sql = neon(process.env.DATABASE_URL)
    
    // Test basic connection with a simple query
    const result = await sql`SELECT 1 as test, NOW() as timestamp`
    
    // Mask the connection string for security (show only the host)
    const url = new URL(process.env.DATABASE_URL)
    const maskedConnectionString = `postgresql://***:***@${url.host}${url.pathname}`
    
    return {
      success: true,
      connectionString: maskedConnectionString,
      testResult: result[0]
    }
  } catch (error) {
    console.error('Database connection test failed:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export async function testTableCreation(): Promise<ConnectionTestResult> {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        success: false,
        error: 'DATABASE_URL environment variable is not set'
      }
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // Test table creation permissions
    await sql`CREATE TABLE IF NOT EXISTS connection_test (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())`
    await sql`INSERT INTO connection_test DEFAULT VALUES`
    const testData = await sql`SELECT * FROM connection_test LIMIT 1`
    await sql`DROP TABLE connection_test`
    
    return {
      success: true,
      testResult: {
        message: 'Table creation/deletion permissions verified',
        testData: testData[0]
      }
    }
  } catch (error) {
    console.error('Table creation test failed:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Table creation permissions test failed'
    }
  }
}

export async function verifyFormTables(): Promise<ConnectionTestResult> {
  try {
    if (!process.env.DATABASE_URL) {
      return {
        success: false,
        error: 'DATABASE_URL environment variable is not set'
      }
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // Check if our required tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('forms', 'form_responses')
      ORDER BY table_name
    `
    
    const existingTables = tables.map(t => t.table_name)
    const requiredTables = ['forms', 'form_responses']
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))
    
    if (missingTables.length > 0) {
      return {
        success: false,
        error: `Missing required tables: ${missingTables.join(', ')}`
      }
    }
    
    return {
      success: true,
      testResult: {
        message: 'All required tables exist',
        existingTables
      }
    }
  } catch (error) {
    console.error('Table verification failed:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Table verification failed'
    }
  }
}
