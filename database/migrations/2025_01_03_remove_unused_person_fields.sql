-- Move name into given_name/surname and drop unused columns.

UPDATE persons
SET
    given_name = CASE
        WHEN (given_name IS NULL OR given_name = '') AND name IS NOT NULL AND TRIM(name) <> ''
            THEN SUBSTRING_INDEX(TRIM(name), ' ', 1)
        ELSE given_name
    END,
    surname = CASE
        WHEN (surname IS NULL OR surname = '') AND name IS NOT NULL AND TRIM(name) <> '' AND name LIKE '% %'
            THEN SUBSTRING_INDEX(SUBSTRING_INDEX(TRIM(name), ' ', 2), ' ', -1)
        ELSE surname
    END;

ALTER TABLE persons
    DROP COLUMN name,
    DROP COLUMN nickname,
    DROP COLUMN prefix,
    DROP COLUMN suffix,
    DROP COLUMN death_place,
    DROP COLUMN burial_place,
    DROP COLUMN education,
    DROP COLUMN religion,
    DROP COLUMN cause_of_death;
