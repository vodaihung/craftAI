// Script to manually create database tables
const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

async function createTables() {
  try {
    console.log('🔧 Creating database tables...')
    
    const sql = neon(process.env.DATABASE_URL)
    
    // Create users table
    console.log('📝 Creating users table...')
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `
    
    // Create forms table
    console.log('📝 Creating forms table...')
    await sql`
      CREATE TABLE IF NOT EXISTS forms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        schema JSONB NOT NULL,
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `
    
    // Create form_responses table
    console.log('📝 Creating form_responses table...')
    await sql`
      CREATE TABLE IF NOT EXISTS form_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
        data JSONB NOT NULL,
        submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `
    
    // Verify tables were created
    console.log('🔍 Verifying tables...')
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'forms', 'form_responses')
      ORDER BY table_name
    `
    
    console.log('✅ Tables created successfully!')
    console.log('📊 Created tables:', tables.map(t => t.table_name).join(', '))
    
    // Test inserting a sample user
    console.log('🧪 Testing table operations...')
    const testUser = await sql`
      INSERT INTO users (email, name) 
      VALUES ('test@example.com', 'Test User') 
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `
    
    console.log('✅ Test user created/updated:', testUser[0])
    
    console.log('\n🎉 Database schema is ready!')
    console.log('👉 You can now proceed with Auth.js implementation')
    
  } catch (error) {
    console.error('❌ Failed to create tables!')
    console.error('🔍 Error details:', error.message)
    process.exit(1)
  }
}

createTables()
