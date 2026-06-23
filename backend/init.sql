-- ============================================================
-- init.sql — Runs automatically on first postgres container start
-- (placed in /docker-entrypoint-initdb.d/)
-- ============================================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for future fuzzy search

-- Set default timezone for this database
ALTER DATABASE inventory_db SET timezone TO 'Asia/Kolkata';

-- Log that init ran successfully
DO $$
BEGIN
    RAISE NOTICE 'Database inventory_db initialized successfully at %', NOW();
END $$;
