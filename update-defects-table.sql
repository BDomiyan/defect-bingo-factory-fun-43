-- Check the actual schema of the defects table
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'defects';

-- If you want to drop the columns that are causing issues, uncomment these lines:
-- ALTER TABLE public.defects DROP COLUMN IF EXISTS epf_number;
-- ALTER TABLE public.defects DROP COLUMN IF EXISTS operation;

-- Make sure the factory_id column allows UUIDs
ALTER TABLE public.defects ALTER COLUMN factory_id TYPE UUID USING factory_id::UUID;

-- Add missing columns if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'defects'
                  AND column_name = 'status') THEN
        ALTER TABLE public.defects ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'defects'
                  AND column_name = 'reworked') THEN
        ALTER TABLE public.defects ADD COLUMN reworked BOOLEAN DEFAULT false;
    END IF;
END $$; 