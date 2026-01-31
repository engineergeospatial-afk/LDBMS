-- 1. CLEANUP: Remove old versions to fix "already exists" and column errors
DROP VIEW IF EXISTS land.v_web_portal CASCADE;
DROP VIEW IF EXISTS land.v_schools CASCADE;
DROP VIEW IF EXISTS land.v_health_centers CASCADE;
DROP VIEW IF EXISTS land.v_town_centres CASCADE;

-- 2. PARCEL VIEW (v_web_portal)
-- Matches: app.get('/api/parcels') in server.js
CREATE VIEW land.v_web_portal AS
SELECT 
    gid, 
    "plotno_1" AS plot_id, 
    "status" AS status, 
    "hact" AS area_ha,    -- Matches 'area_ha' used in server.js
    "ward" AS ward,
    'Land Parcel' as feature_type,
    -- Transform from Arc 1960 (21037) to WGS84 (4326) for Leaflet
    ST_AsGeoJSON(ST_Transform(ST_SetSRID(geom, 21037), 4326))::json AS geometry 
FROM land.parcel;

-- 3. SCHOOLS VIEW (v_schools)
CREATE VIEW land.v_schools AS
SELECT 
    gid, 
    "name" AS feature_name, 
    'School' as feature_type,
    "amenity" as subtype,
    ST_AsGeoJSON(ST_Transform(ST_SetSRID(geom, 21037), 4326))::json AS geometry 
FROM land.schools;

-- 4. HEALTH CENTERS VIEW (v_health_centers)
-- Note: Table is spelled 'healthcentres' in your DB, view must be 'v_health_centers' for backend
CREATE VIEW land.v_health_centers AS
SELECT 
    gid, 
    "name" AS feature_name, 
    'Health Center' as feature_type,
    "amenity" as subtype,
    ST_AsGeoJSON(ST_Transform(ST_SetSRID(geom, 21037), 4326))::json AS geometry 
FROM land.healthcentres; -- Corrected spelling from your schema

-- 5. TOWN CENTRES VIEW (v_town_centres)
CREATE VIEW land.v_town_centres AS
SELECT 
    gid, 
    "name" AS feature_name, 
    'Town Center' as feature_type,
    "place" as subtype,
    ST_AsGeoJSON(ST_Transform(ST_SetSRID(geom, 21037), 4326))::json AS geometry 
FROM land.townscentres;