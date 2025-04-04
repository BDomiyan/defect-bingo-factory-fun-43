-- Check the actual schema of the defects table
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'defects'
ORDER BY ordinal_position; 