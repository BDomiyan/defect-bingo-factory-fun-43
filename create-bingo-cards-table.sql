-- Create the bingo_cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bingo_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER DEFAULT 0,
  board_state JSONB DEFAULT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bingo_cards_user_id ON public.bingo_cards(user_id);

-- Disable Row Level Security for testing
ALTER TABLE public.bingo_cards DISABLE ROW LEVEL SECURITY;

-- Add a default bingo card for testing
INSERT INTO public.bingo_cards (id, user_id, completed, score)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', false, 0)
ON CONFLICT (id) DO NOTHING; 