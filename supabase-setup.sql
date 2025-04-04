-- Plants table (create this first)
CREATE TABLE IF NOT EXISTS public.plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  lines TEXT[] DEFAULT ARRAY['L1']::TEXT[]
);

-- Users table (create after plants since it references plants)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  epf_number TEXT UNIQUE NOT NULL,
  employee_id TEXT,
  plant_id UUID REFERENCES public.plants(id),
  line_number TEXT,
  avatar_url TEXT
);

-- Operations table
CREATE TABLE IF NOT EXISTS public.operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT UNIQUE NOT NULL
);

-- Defects table
CREATE TABLE IF NOT EXISTS public.defects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  garment_part TEXT NOT NULL,
  defect_type TEXT NOT NULL,
  validated BOOLEAN DEFAULT false,
  validated_by UUID REFERENCES public.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES public.users(id),
  factory_id TEXT NOT NULL,
  line_number TEXT NOT NULL,
  epf_number TEXT,
  operation TEXT,
  supervisor_comment TEXT
);

-- Bingo cards table
CREATE TABLE IF NOT EXISTS public.bingo_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER DEFAULT 0,
  board_state JSONB DEFAULT NULL
);

-- Add default data
-- Add a default plant first
INSERT INTO public.plants (id, name, lines)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Jay Jay Main Factory', ARRAY['L1', 'L2', 'L3'])
ON CONFLICT (id) DO NOTHING;

-- Add default operations
INSERT INTO public.operations (name)
VALUES 
  ('Cutting'),
  ('Sewing'),
  ('Finishing')
ON CONFLICT (name) DO NOTHING;

-- Add default admin user
INSERT INTO public.users (id, name, email, password, role, epf_number, employee_id, plant_id, line_number)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'System Administrator', 'admin@jayjay.com', 'admin123', 'admin', 'EPF001', 'ADMIN-001', '00000000-0000-0000-0000-000000000001', 'L1')
ON CONFLICT (id) DO NOTHING;

-- Disable Row Level Security for testing
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.defects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bingo_cards DISABLE ROW LEVEL SECURITY; 