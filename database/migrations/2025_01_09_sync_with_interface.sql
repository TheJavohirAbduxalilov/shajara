-- ============================================
-- Migration: Sync database with new interface
-- Date: 2025-01-09
-- ============================================

-- ============================================
-- PERSONS TABLE CHANGES
-- ============================================

-- Remove unused approximate date fields
ALTER TABLE persons DROP COLUMN IF EXISTS birth_day_approx;
ALTER TABLE persons DROP COLUMN IF EXISTS birth_month_approx;
ALTER TABLE persons DROP COLUMN IF EXISTS birth_year_approx;

-- Add data accuracy field
ALTER TABLE persons
    ADD COLUMN IF NOT EXISTS data_accuracy ENUM('unknown', 'assumed', 'relative', 'confirmed')
    DEFAULT 'unknown'
    AFTER birth_place;

-- ============================================
-- MARRIAGES TABLE CHANGES
-- ============================================

-- Remove unused marriage date fields
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_day;
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_month;
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_year;
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_day_approx;
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_month_approx;
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_year_approx;

-- Remove unused divorce date fields
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_day;
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_month;
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_year;
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_day_approx;
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_month_approx;
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_year_approx;

-- Remove unused divorce flag
ALTER TABLE marriages DROP COLUMN IF EXISTS is_divorced;
