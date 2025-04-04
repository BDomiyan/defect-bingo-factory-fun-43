-- First check if factory_id is UUID type
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'defects'
AND column_name = 'factory_id';

-- Option 1: Change factory_id to TEXT type
ALTER TABLE public.defects ALTER COLUMN factory_id TYPE TEXT;

-- Option 2: If you want to maintain UUID type but handle legacy values, add a trigger
-- to convert values like 'A6' to '00000000-0000-0000-0000-000000000001'
DO $$ 
BEGIN
    -- Only run this if the factory_id is UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'defects'
        AND column_name = 'factory_id'
        AND data_type = 'uuid'
    ) THEN
        -- Create a function to convert codes to UUIDs
        CREATE OR REPLACE FUNCTION convert_factory_code_to_uuid()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.factory_id = 'A6' THEN
                NEW.factory_id := '00000000-0000-0000-0000-000000000001'::uuid;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create the trigger
        DROP TRIGGER IF EXISTS convert_factory_id ON public.defects;
        CREATE TRIGGER convert_factory_id
        BEFORE INSERT OR UPDATE ON public.defects
        FOR EACH ROW
        EXECUTE FUNCTION convert_factory_code_to_uuid();
    END IF;
END $$; 