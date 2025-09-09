const { defineConfig } = require('drizzle-kit')
require('dotenv').config({ path: '.env.local' })

module.exports = defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/formcraft_test',
  },
  verbose: true,
  strict: true,
})
