-- Add the missing line_number column to the defects table
ALTER TABLE public.defects ADD COLUMN line_number TEXT;

-- This confirms the change was made
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'defects'
ORDER BY ordinal_position; 