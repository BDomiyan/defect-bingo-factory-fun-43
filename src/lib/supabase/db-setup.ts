import { supabase } from './client';

/**
 * Checks and creates database tables if they don't exist
 */
export async function ensureDatabaseSchema() {
  console.log('Checking database schema...');
  
  try {
    // First check if the users table exists
    const { error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (usersError) {
      console.error('Error checking users table:', usersError);
      await createBaseSchema();
    }
    
    // Then check if bingo_cards table exists
    const { error: bingoCardsError } = await supabase
      .from('bingo_cards')
      .select('id')
      .limit(1);
      
    if (bingoCardsError) {
      console.error('Error checking bingo_cards table:', bingoCardsError);
      await createBingoCardsTable();
    }
    
    // Then check if bingo_defects table exists
    const { error: bingoDefectsError } = await supabase
      .from('bingo_defects')
      .select('id')
      .limit(1);
      
    if (bingoDefectsError) {
      console.error('Error checking bingo_defects table:', bingoDefectsError);
      await createBingoDefectsTable();
    }
    
    // Then check if bingo_analytics table exists
    const { error: bingoAnalyticsError } = await supabase
      .from('bingo_analytics')
      .select('id')
      .limit(1);
      
    if (bingoAnalyticsError) {
      console.error('Error checking bingo_analytics table:', bingoAnalyticsError);
      await createBingoAnalyticsTable();
    }
    
    // Then check if supervisor_validation_log table exists
    const { error: supervisorLogError } = await supabase
      .from('supervisor_validation_log')
      .select('id')
      .limit(1);
      
    if (supervisorLogError) {
      console.error('Error checking supervisor_validation_log table:', supervisorLogError);
      await createSupervisorValidationLogTable();
    }
    
    console.log('Database schema check complete');
  } catch (error) {
    console.error('Error checking database schema:', error);
  }
}

/**
 * Creates the base schema (users, plants, operations)
 */
async function createBaseSchema() {
  const { error } = await supabase.rpc('create_base_schema');
  
  if (error) {
    console.error('Error creating base schema:', error);
  } else {
    console.log('Base schema created successfully');
  }
}

/**
 * Creates the bingo_cards table
 */
async function createBingoCardsTable() {
  const { error } = await supabase.rpc('create_bingo_cards_table');
  
  if (error) {
    console.error('Error creating bingo_cards table:', error);
  } else {
    console.log('Bingo cards table created successfully');
    
    // Add a default bingo card
    const { error: insertError } = await supabase
      .from('bingo_cards')
      .insert([{
        id: '00000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000001',
        completed: false,
        score: 0
      }]);
      
    if (insertError) {
      console.error('Error creating default bingo card:', insertError);
    }
  }
}

/**
 * Creates the bingo_defects table
 */
async function createBingoDefectsTable() {
  const { error } = await supabase.rpc('create_bingo_defects_table');
  
  if (error) {
    console.error('Error creating bingo_defects table:', error);
  } else {
    console.log('Bingo defects table created successfully');
  }
}

/**
 * Creates the bingo_analytics table
 */
async function createBingoAnalyticsTable() {
  const { error } = await supabase.rpc('create_bingo_analytics_table');
  
  if (error) {
    console.error('Error creating bingo_analytics table:', error);
  } else {
    console.log('Bingo analytics table created successfully');
  }
}

/**
 * Creates the supervisor_validation_log table
 */
async function createSupervisorValidationLogTable() {
  const { error } = await supabase.rpc('create_supervisor_validation_log_table');
  
  if (error) {
    console.error('Error creating supervisor_validation_log table:', error);
  } else {
    console.log('Supervisor validation log table created successfully');
  }
} 