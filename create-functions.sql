-- Function to create the base schema
CREATE OR REPLACE FUNCTION public.create_base_schema()
RETURNS void AS $$
BEGIN
  -- Plants table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plants') THEN
    CREATE TABLE public.plants (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      name TEXT NOT NULL,
      lines TEXT[] DEFAULT ARRAY['L1']::TEXT[]
    );
    
    ALTER TABLE public.plants DISABLE ROW LEVEL SECURITY;
    
    -- Add default plant
    INSERT INTO public.plants (id, name, lines)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Default Factory', ARRAY['L1', 'L2', 'L3'])
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  -- Users table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    CREATE TABLE public.users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      epf_number TEXT,
      employee_id TEXT,
      plant_id UUID REFERENCES public.plants(id),
      line_number TEXT,
      avatar_url TEXT
    );
    
    ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
    
    -- Add default admin user
    INSERT INTO public.users (id, name, email, role, epf_number)
    VALUES ('00000000-0000-0000-0000-000000000001', 'System Admin', 'admin@example.com', 'admin', 'EPF001')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create the bingo_cards table
CREATE OR REPLACE FUNCTION public.create_bingo_cards_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bingo_cards') THEN
    CREATE TABLE public.bingo_cards (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      user_id UUID NOT NULL REFERENCES public.users(id),
      completed BOOLEAN DEFAULT false,
      completed_at TIMESTAMP WITH TIME ZONE,
      score INTEGER DEFAULT 0,
      board_state JSONB DEFAULT NULL
    );
    
    CREATE INDEX idx_bingo_cards_user_id ON public.bingo_cards(user_id);
    
    ALTER TABLE public.bingo_cards DISABLE ROW LEVEL SECURITY;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create the bingo_defects table
CREATE OR REPLACE FUNCTION public.create_bingo_defects_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bingo_defects') THEN
    CREATE TABLE public.bingo_defects (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Defect details
      garment_part TEXT NOT NULL,
      defect_type TEXT NOT NULL,
      
      -- Bingo game info
      bingo_card_id UUID REFERENCES public.bingo_cards(id),
      is_bingo_line BOOLEAN DEFAULT false,
      bingo_line_type TEXT, -- 'row', 'column', 'diagonal'
      bingo_line_index INTEGER,
      cell_position TEXT, -- Format: 'row-col'
      
      -- Validation info
      validated BOOLEAN DEFAULT false,
      validated_by UUID REFERENCES public.users(id),
      validated_at TIMESTAMP WITH TIME ZONE,
      supervisor_comment TEXT,
      validation_status TEXT DEFAULT 'pending',
      validation_history JSONB,
      review_priority INTEGER DEFAULT 0,
      
      -- Factory/operator info
      created_by UUID NOT NULL REFERENCES public.users(id),
      factory_id TEXT NOT NULL,
      line_number TEXT NOT NULL,
      epf_number TEXT,
      operation TEXT,
      
      -- Extra info
      status TEXT DEFAULT 'pending',
      reworked BOOLEAN DEFAULT false,
      rework_time INTEGER,
      
      -- Score/points
      points_awarded INTEGER DEFAULT 0
    );
    
    CREATE INDEX idx_bingo_defects_bingo_card_id ON public.bingo_defects(bingo_card_id);
    CREATE INDEX idx_bingo_defects_created_by ON public.bingo_defects(created_by);
    CREATE INDEX idx_bingo_defects_validated ON public.bingo_defects(validated);
    CREATE INDEX idx_bingo_defects_created_at ON public.bingo_defects(created_at);
    
    ALTER TABLE public.bingo_defects DISABLE ROW LEVEL SECURITY;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create the bingo_analytics table
CREATE OR REPLACE FUNCTION public.create_bingo_analytics_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bingo_analytics') THEN
    CREATE TABLE public.bingo_analytics (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Aggregate data
      total_bingos INTEGER DEFAULT 0,
      total_defects INTEGER DEFAULT 0,
      total_full_boards INTEGER DEFAULT 0,
      
      -- Quality metrics
      defect_detection_rate DECIMAL(5, 2) DEFAULT 0,
      inspection_efficiency DECIMAL(5, 2) DEFAULT 0,
      first_time_quality DECIMAL(5, 2) DEFAULT 0,
      average_validation_time INTEGER DEFAULT 0,
      supervisor_validation_stats JSONB,
      
      -- Time period (daily, weekly, monthly)
      period_type TEXT NOT NULL,
      period_start TIMESTAMP WITH TIME ZONE NOT NULL,
      period_end TIMESTAMP WITH TIME ZONE NOT NULL,
      
      -- Dimension for slicing
      factory_id TEXT,
      line_number TEXT,
      user_id UUID REFERENCES public.users(id),
      
      -- Top data
      top_defect_type TEXT,
      top_garment_part TEXT,
      
      -- Serialized JSON data for charts
      chart_data JSONB
    );
    
    ALTER TABLE public.bingo_analytics DISABLE ROW LEVEL SECURITY;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create the supervisor_validation_log table
CREATE OR REPLACE FUNCTION public.create_supervisor_validation_log_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'supervisor_validation_log') THEN
    CREATE TABLE public.supervisor_validation_log (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      defect_id UUID REFERENCES public.bingo_defects(id),
      previous_status TEXT,
      new_status TEXT,
      validated_by UUID REFERENCES public.users(id),
      validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      comments TEXT,
      time_to_validate INTEGER
    );
    
    CREATE INDEX idx_supervisor_validation_defect_id ON public.supervisor_validation_log(defect_id);
    
    ALTER TABLE public.supervisor_validation_log DISABLE ROW LEVEL SECURITY;
  END IF;
END;
$$ LANGUAGE plpgsql; 