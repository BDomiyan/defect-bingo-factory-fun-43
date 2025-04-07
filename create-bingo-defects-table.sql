-- Create a new table to store defects created from Bingo games
CREATE TABLE IF NOT EXISTS public.bingo_defects (
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
  
  -- Factory/operator info
  created_by UUID NOT NULL REFERENCES public.users(id),
  factory_id TEXT NOT NULL,
  line_number TEXT NOT NULL,
  epf_number TEXT,
  operation TEXT,
  
  -- Extra info
  supervisor_comment TEXT,
  status TEXT DEFAULT 'pending',
  reworked BOOLEAN DEFAULT false,
  rework_time INTEGER,
  
  -- Score/points
  points_awarded INTEGER DEFAULT 0
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bingo_defects_bingo_card_id ON public.bingo_defects(bingo_card_id);
CREATE INDEX IF NOT EXISTS idx_bingo_defects_created_by ON public.bingo_defects(created_by);
CREATE INDEX IF NOT EXISTS idx_bingo_defects_validated ON public.bingo_defects(validated);
CREATE INDEX IF NOT EXISTS idx_bingo_defects_created_at ON public.bingo_defects(created_at);

-- Disable Row Level Security for testing
ALTER TABLE public.bingo_defects DISABLE ROW LEVEL SECURITY;

-- Table for storing bingo analytics
CREATE TABLE IF NOT EXISTS public.bingo_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Aggregate data
  total_bingos INTEGER DEFAULT 0,
  total_defects INTEGER DEFAULT 0,
  total_full_boards INTEGER DEFAULT 0,
  
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

-- Disable Row Level Security for testing
ALTER TABLE public.bingo_analytics DISABLE ROW LEVEL SECURITY; 