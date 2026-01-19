-- Migration: Remove legacy DATE fields from marriages table
-- These were replaced by separate day/month/year fields in migration 2025_01_07

-- Remove legacy marriage_date field (replaced by marriage_day, marriage_month, marriage_year)
ALTER TABLE marriages DROP COLUMN IF EXISTS marriage_date;

-- Remove legacy divorce_date field (replaced by divorce_day, divorce_month, divorce_year)
ALTER TABLE marriages DROP COLUMN IF EXISTS divorce_date;
