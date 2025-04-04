-- Add board_state column to bingo_cards table
ALTER TABLE public.bingo_cards 
ADD COLUMN IF NOT EXISTS board_state JSONB DEFAULT NULL;

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_bingo_cards_user_id ON public.bingo_cards(user_id); 