const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors()); //
app.use(express.static(path.join(__dirname, 'public'))); //

// 1. DATABASE CONNECTION (Cloud Ready)
// Using connectionString allows the cloud host to provide all credentials in one URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:muiruri@localhost:5432/Parcels',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false 
    // SSL is required for most cloud providers but disabled for local testing
});

// 2. FETCH MAIN PARCELS (LAND)
app.get('/api/parcels', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM land.v_web_portal'); //
        res.json({ 
            type: "FeatureCollection", 
            features: result.rows.map(r => ({
                type: "Feature", 
                properties: { 
                    id: r.plot_id, 
                    status: r.status, 
                    area: r.area_ha, //
                    type: r.feature_type 
                }, 
                geometry: r.geometry
            }))
        });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 3. FETCH INFRASTRUCTURE LAYERS (Dynamic Route)
app.get('/api/amenities/:layer', async (req, res) => {
    const layer = req.params.layer; 
    try {
        const result = await pool.query(`SELECT * FROM land.v_${layer}`); //
        res.json({ 
            type: "FeatureCollection", 
            features: result.rows.map(r => ({
                type: "Feature", 
                properties: { 
                    name: r.feature_name, 
                    type: r.feature_type,
                    subtype: r.subtype 
                }, 
                geometry: r.geometry
            }))
        });
    } catch (err) { 
        res.status(500).json({ error: "Layer not found or SQL error" }); 
    }
});

// 4. UNIFIED PROXIMITY ANALYSIS
app.get('/api/proximity_analysis', async (req, res) => {
    const { lat, lng } = req.query; //
    const searchRadius = 2000; 

    const sql = `
        SELECT name, type, 
               ST_Distance(ST_GeomFromGeoJSON(geometry)::geography, ST_MakePoint($1, $2)::geography) as distance
        FROM (
            SELECT plot_id as name, feature_type as type, geometry FROM land.v_web_portal
            UNION ALL
            SELECT feature_name as name, feature_type as type, geometry FROM land.v_health_centers
            UNION ALL
            SELECT feature_name as name, feature_type as type, geometry FROM land.v_schools
            UNION ALL
            SELECT feature_name as name, feature_type as type, geometry FROM land.v_town_centres
        ) AS combined_data
        WHERE ST_DWithin(ST_GeomFromGeoJSON(geometry)::geography, ST_MakePoint($1, $2)::geography, $3)
        ORDER BY distance ASC;
    `; //
    
    try {
        const result = await pool.query(sql, [lng, lat, searchRadius]);
        res.json(result.rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 5. START SERVER (Dynamic Port)
const PORT = process.env.PORT || 3000; // Cloud hosts set their own PORT
app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`GIS Portal active on port ${PORT}`);
    console.log(`-----------------------------------------`);
});