// Simple Node.js script to test Neon database connection
const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

async function testConnection() {
  try {
    console.log('🔍 Testing Neon database connection...')
    console.log('📍 Database URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Not set ❌')
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    
    // Create connection
    const sql = neon(process.env.DATABASE_URL)
    
    // Test basic connection
    console.log('🔌 Attempting to connect...')
    const result = await sql`SELECT 1 as test, NOW() as timestamp`
    
    console.log('✅ Database connection successful!')
    console.log('📊 Test query result:', result[0])
    
    // Test if we can create a simple table (this will help us verify permissions)
    console.log('🔧 Testing table creation permissions...')
    try {
      await sql`CREATE TABLE IF NOT EXISTS connection_test (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())`
      await sql`INSERT INTO connection_test DEFAULT VALUES`
      const testData = await sql`SELECT * FROM connection_test LIMIT 1`
      await sql`DROP TABLE connection_test`
      
      console.log('✅ Table creation/deletion permissions verified!')
      console.log('📝 Test data:', testData[0])
    } catch (permError) {
      console.log('⚠️  Table creation test failed (this might be normal for some setups):', permError.message)
    }
    
    console.log('\n🎉 Database setup is ready!')
    console.log('👉 You can now proceed with implementing Auth.js')
    
  } catch (error) {
    console.error('❌ Database connection failed!')
    console.error('🔍 Error details:', error.message)
    console.error('💡 Please check:')
    console.error('   1. Your DATABASE_URL in .env.local is correct')
    console.error('   2. Your Neon database is running')
    console.error('   3. Your network connection is working')
    console.error('   4. The database credentials are valid')
    
    process.exit(1)
  }
}

testConnection()
