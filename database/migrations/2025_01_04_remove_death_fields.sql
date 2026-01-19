-- Remove death date fields from persons table.

ALTER TABLE persons
    DROP COLUMN death_day,
    DROP COLUMN death_month,
    DROP COLUMN death_year;
