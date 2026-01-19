-- Migration: Separate marriage/divorce date fields into day/month/year
-- Date: 2025-01-07

-- Add separate day/month/year fields for marriage date
ALTER TABLE marriages ADD COLUMN marriage_day TINYINT NULL;
ALTER TABLE marriages ADD COLUMN marriage_month TINYINT NULL;
ALTER TABLE marriages ADD COLUMN marriage_year SMALLINT NULL;
ALTER TABLE marriages ADD COLUMN marriage_day_approx BOOLEAN DEFAULT FALSE;
ALTER TABLE marriages ADD COLUMN marriage_month_approx BOOLEAN DEFAULT FALSE;
ALTER TABLE marriages ADD COLUMN marriage_year_approx BOOLEAN DEFAULT FALSE;

-- Add separate day/month/year fields for divorce date
ALTER TABLE marriages ADD COLUMN divorce_day TINYINT NULL;
ALTER TABLE marriages ADD COLUMN divorce_month TINYINT NULL;
ALTER TABLE marriages ADD COLUMN divorce_year SMALLINT NULL;
ALTER TABLE marriages ADD COLUMN divorce_day_approx BOOLEAN DEFAULT FALSE;
ALTER TABLE marriages ADD COLUMN divorce_month_approx BOOLEAN DEFAULT FALSE;
ALTER TABLE marriages ADD COLUMN divorce_year_approx BOOLEAN DEFAULT FALSE;

-- Migrate existing data from DATE fields to new fields
UPDATE marriages
SET
    marriage_day = DAY(marriage_date),
    marriage_month = MONTH(marriage_date),
    marriage_year = YEAR(marriage_date)
WHERE marriage_date IS NOT NULL;

UPDATE marriages
SET
    divorce_day = DAY(divorce_date),
    divorce_month = MONTH(divorce_date),
    divorce_year = YEAR(divorce_date)
WHERE divorce_date IS NOT NULL;

-- Drop old DATE columns (optional - can keep for backup)
-- ALTER TABLE marriages DROP COLUMN marriage_date;
-- ALTER TABLE marriages DROP COLUMN divorce_date;
