// setup-database.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    console.log('🔧 Setting up database views for land portal...');
    
    // Create pool connection
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        // Read SQL file
        const sqlPath = path.join(__dirname, 'database-setup.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📄 Executing database setup script...');
        
        // Execute SQL
        const result = await pool.query(sql);
        
        console.log('✅ Database views created successfully!');
        console.log('📊 View counts:');
        
        // Log the verification results (last query in the file)
        if (result.rows && result.rows.length > 0) {
            result.rows.forEach(row => {
                console.log(`   ${row.view_name}: ${row.feature_count} features`);
            });
        }
        
        console.log('🎉 Database setup complete!');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run setup
setupDatabase();