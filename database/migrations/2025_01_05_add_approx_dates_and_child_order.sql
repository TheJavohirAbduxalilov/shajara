-- Migration: Add approximate date flags and child order
-- Run this migration to add support for approximate dates and child ordering

-- Add approximate flags for birth date components
ALTER TABLE persons
    ADD COLUMN birth_day_approx BOOLEAN DEFAULT FALSE AFTER birth_day,
    ADD COLUMN birth_month_approx BOOLEAN DEFAULT FALSE AFTER birth_month,
    ADD COLUMN birth_year_approx BOOLEAN DEFAULT FALSE AFTER birth_year;

-- Add child order in marriage_children table
ALTER TABLE marriage_children
    ADD COLUMN child_order INT DEFAULT 0 AFTER child_id;

-- Update existing records to have sequential order
SET @row_number = 0;
SET @current_marriage = 0;

UPDATE marriage_children mc
JOIN (
    SELECT
        id,
        marriage_id,
        @row_number := IF(@current_marriage = marriage_id, @row_number + 1, 1) AS new_order,
        @current_marriage := marriage_id
    FROM marriage_children
    ORDER BY marriage_id, id
) AS ordered ON mc.id = ordered.id
SET mc.child_order = ordered.new_order;
