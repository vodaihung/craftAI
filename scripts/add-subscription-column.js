require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function addSubscriptionColumn() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    return;
  }

  console.log('🔗 Connecting to database...');
  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('🔍 Checking if subscription_tier column exists...');

    // Check if column already exists
    const columnExists = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'subscription_tier'
    `;

    if (columnExists.length > 0) {
      console.log('✅ subscription_tier column already exists');
      return;
    }

    console.log('➕ Adding subscription_tier column...');

    // Add the subscription_tier column
    await sql`
      ALTER TABLE users
      ADD COLUMN subscription_tier text DEFAULT 'free' NOT NULL
    `;

    console.log('✅ Successfully added subscription_tier column to users table');

    // Verify the column was added
    const verifyColumn = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'subscription_tier'
    `;

    if (verifyColumn.length > 0) {
      console.log('✅ Column verification successful');

      // Show current users count
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      console.log(`📊 Updated ${userCount[0].count} existing users with default 'free' subscription tier`);
    } else {
      console.log('❌ Column verification failed');
    }

  } catch (error) {
    console.error('❌ Error adding subscription_tier column:', error);
    if (error.message) {
      console.error('Error details:', error.message);
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

console.log('🚀 Starting database migration...');
addSubscriptionColumn().then(() => {
  console.log('🏁 Migration completed');
}).catch((error) => {
  console.error('💥 Migration failed:', error);
});
