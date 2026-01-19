-- Migration: Add marriage and divorce dates
-- Date: 2025-01-06

ALTER TABLE marriages ADD COLUMN marriage_date DATE NULL;
ALTER TABLE marriages ADD COLUMN divorce_date DATE NULL;
ALTER TABLE marriages ADD COLUMN is_divorced BOOLEAN DEFAULT FALSE;
