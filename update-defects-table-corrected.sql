-- First check the current schema
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'defects'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add factory_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'defects'
                  AND column_name = 'factory_id') THEN
        ALTER TABLE public.defects ADD COLUMN factory_id UUID;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'defects'
                  AND column_name = 'status') THEN
        ALTER TABLE public.defects ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    
    -- Add reworked column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'defects'
                  AND column_name = 'reworked') THEN
        ALTER TABLE public.defects ADD COLUMN reworked BOOLEAN DEFAULT false;
    END IF;
END $$; 