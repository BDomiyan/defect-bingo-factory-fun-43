import { useEffect, useState, useCallback } from 'react';
import { supabase } from './client';
import { Database } from './types';
import { RecordedDefect, BingoBoard } from '@/lib/types';

type Tables = Database['public']['Tables'];
type User = Tables['users']['Row'];
type Defect = Tables['defects']['Row'];
type BingoCard = Tables['bingo_cards']['Row'];
type Plant = Tables['plants']['Row'];
type Operation = Tables['operations']['Row'];

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return;
    }

    setUser(data);
    setLoading(false);
  }

  return { user, loading };
}

export function useDefects() {
  const [loading, setLoading] = useState(false);
  const [defects, setDefects] = useState<Database['public']['Tables']['defects']['Row'][]>([]);
  
  const fetchDefects = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('defects')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching defects:', error);
        throw error;
      }
      
      setDefects(data || []);
    } catch (error) {
      console.error('Error in fetchDefects:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchDefects();
  }, [fetchDefects]);
  
  const addDefect = useCallback(async (defect: RecordedDefect) => {
    setLoading(true);
    try {
      // Include all fields from the actual database schema including line_number
      const defectData = {
        id: crypto.randomUUID(),
        garment_part: typeof defect.garmentPart === 'object' ? defect.garmentPart.code : defect.garmentPart,
        defect_type: typeof defect.defectType === 'object' ? String(defect.defectType.code) : String(defect.defectType),
        validated: false,
        created_by: defect.operatorId,
        factory_id: defect.factoryId,
        line_number: defect.lineNumber,
        status: defect.status || 'pending',
        reworked: defect.reworked || false
      };
      
      // Fix for potential invalid UUID format in factory_id
      if (defectData.factory_id === 'A6') {
        defectData.factory_id = '00000000-0000-0000-0000-000000000001';
      } else if (!defectData.factory_id.includes('-')) {
        console.warn(`Converting non-UUID factory_id: ${defectData.factory_id}`);
        try {
          // Attempt to load from localStorage mapping
          const factoryMapping = JSON.parse(localStorage.getItem('factory-id-mapping') || '{}');
          if (factoryMapping[defectData.factory_id.toLowerCase()]) {
            defectData.factory_id = factoryMapping[defectData.factory_id.toLowerCase()];
          } else {
            // Fallback to hardcoded mapping
            defectData.factory_id = '00000000-0000-0000-0000-000000000001';
          }
        } catch (e) {
          // If parsing fails, use default UUID
          defectData.factory_id = '00000000-0000-0000-0000-000000000001';
        }
      }
      
      console.log('Inserting defect into Supabase with complete schema:', defectData);
      
      const { data, error } = await supabase
        .from('defects')
        .insert([defectData])
        .select();
        
      if (error) {
        console.error('Error adding defect:', error);
        throw error;
      }
      
      console.log('Successfully added defect:', data);
      
      // Update local state
      fetchDefects();
      
      return data;
    } catch (error) {
      console.error('Error in addDefect:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchDefects]);

  async function validateDefect(id: string, validate: boolean, comment?: string) {
    try {
      // Default UUID for validation
      const DEFAULT_VALIDATOR_UUID = '00000000-0000-0000-0000-000000000001';
      
      // Create update payload with default UUID
      const updatePayload = {
        validated: validate,
        supervisor_comment: comment || null,
        validated_by: DEFAULT_VALIDATOR_UUID,
        validated_at: new Date().toISOString()
      };
      
      console.log('Update payload:', updatePayload);
      
      const { data, error } = await supabase
        .from('defects')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error validating defect:', error);
        throw error;
      }

      console.log('Successfully validated defect:', data);
      
      // Refresh defects data after successful validation
      await fetchDefects();
      
      return data;
    } catch (error) {
      console.error('Error in validateDefect:', error);
      throw error;
    }
  }

  return {
    defects,
    loading,
    addDefect,
    validateDefect,
    fetchDefects
  };
}

export function useBingoCard(userId: string) {
  const [card, setCard] = useState<BingoCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [boardState, setBoardState] = useState<BingoBoard | null>(null);

  useEffect(() => {
    if (userId) {
      fetchBingoCard();
    }
  }, [userId]);

  async function fetchBingoCard() {
    setLoading(true);
    const { data, error } = await supabase
      .from('bingo_cards')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching bingo card:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setCard(data);
      setBoardState(data.board_state);
    } else {
      // No card found, create one
      await createBingoCard();
    }
    setLoading(false);
  }

  async function createBingoCard() {
    const { data, error } = await supabase
      .from('bingo_cards')
      .insert([{
        user_id: userId,
        completed: false,
        score: 0,
        board_state: null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating bingo card:', error);
      return null;
    }

    setCard(data);
    return data;
  }

  async function updateBingoCard(updates: Partial<BingoCard>) {
    if (!card) return null;

    const { data, error } = await supabase
      .from('bingo_cards')
      .update(updates)
      .eq('id', card.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating bingo card:', error);
      return null;
    }

    setCard(data);
    if (data.board_state) {
      setBoardState(data.board_state);
    }
    return data;
  }

  async function updateBoardState(board: BingoBoard) {
    if (!card) return null;
    
    const { data, error } = await supabase
      .from('bingo_cards')
      .update({
        board_state: board
      })
      .eq('id', card.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating board state:', error);
      return null;
    }

    setCard(data);
    setBoardState(board);
    return data;
  }

  async function updateScore(additionalScore: number) {
    if (!card) return null;
    
    const newScore = (card.score || 0) + additionalScore;
    return updateBingoCard({
      score: newScore
    });
  }

  async function completeBingoCard() {
    if (!card) return null;
    
    return updateBingoCard({
      completed: true,
      completed_at: new Date().toISOString()
    });
  }

  return {
    card,
    boardState,
    loading,
    createBingoCard,
    updateBingoCard,
    updateBoardState,
    updateScore,
    completeBingoCard
  };
}

export function usePlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlants();
  }, []);

  async function fetchPlants() {
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching plants:', error);
      return;
    }

    setPlants(data || []);
    setLoading(false);
  }

  async function addPlant(plant: { name: string; lines: string[] }) {
    const { data, error } = await supabase
      .from('plants')
      .insert([plant])
      .select()
      .single();

    if (error) {
      console.error('Error adding plant:', error);
      throw error;
    }

    setPlants(prev => [...prev, data]);
    return data;
  }

  async function updatePlant(id: string, updates: Partial<Omit<Plant, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('plants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating plant:', error);
      throw error;
    }

    setPlants(prev => prev.map(plant => plant.id === id ? data : plant));
    return data;
  }

  async function deletePlant(id: string) {
    const { error } = await supabase
      .from('plants')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting plant:', error);
      throw error;
    }

    setPlants(prev => prev.filter(plant => plant.id !== id));
    return true;
  }

  return {
    plants,
    loading,
    addPlant,
    updatePlant,
    deletePlant
  };
}

export function useOperations() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperations();
  }, []);

  async function fetchOperations() {
    const { data, error } = await supabase
      .from('operations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching operations:', error);
      return;
    }

    setOperations(data || []);
    setLoading(false);
  }

  async function addOperation(name: string) {
    const { data, error } = await supabase
      .from('operations')
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      console.error('Error adding operation:', error);
      throw error;
    }

    setOperations(prev => [...prev, data]);
    return data;
  }

  async function updateOperation(id: string, name: string) {
    const { data, error } = await supabase
      .from('operations')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating operation:', error);
      throw error;
    }

    setOperations(prev => prev.map(op => op.id === id ? data : op));
    return data;
  }

  async function deleteOperation(id: string) {
    const { error } = await supabase
      .from('operations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting operation:', error);
      throw error;
    }

    setOperations(prev => prev.filter(op => op.id !== id));
    return true;
  }

  return {
    operations,
    loading,
    addOperation,
    updateOperation,
    deleteOperation
  };
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    setUsers(data || []);
    setLoading(false);
  }

  async function addUser(user: Omit<User, 'id' | 'created_at'>) {
    // In a real app, you would handle password hashing properly
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) {
      console.error('Error adding user:', error);
      throw error;
    }

    setUsers(prev => [...prev, data]);
    return data;
  }

  async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    setUsers(prev => prev.map(user => user.id === id ? data : user));
    return data;
  }

  async function deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }

    setUsers(prev => prev.filter(user => user.id !== id));
    return true;
  }

  return {
    users,
    loading,
    addUser,
    updateUser,
    deleteUser
  };
}

export function useOperatorsByFactoryLine() {
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOperatorsByFactoryLine = useCallback(async (factoryId?: string, lineNumber?: string) => {
    setLoading(true);
    try {
      console.log('Fetching operators with factoryId:', factoryId, 'lineNumber:', lineNumber);
      
      // Basic query to get operators
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', 'operator');
      
      // Only add factoryId filter if it's a valid UUID to prevent database errors
      if (factoryId && factoryId.includes('-')) {
        console.log('Using factoryId filter:', factoryId);
        query = query.eq('plant_id', factoryId);
      } else if (factoryId) {
        console.log('Skipping invalid factoryId format:', factoryId);
        // If using non-UUID keys, we could potentially do a text match in a real app
        // For now, just log it but don't filter to avoid errors
      }
      
      // Add filter for line_number if provided
      if (lineNumber) {
        console.log('Using lineNumber filter:', lineNumber);
        query = query.eq('line_number', lineNumber);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching operators:', error);
        throw error;
      }
      
      console.log('Fetched operators:', data);
      setOperators(data || []);
    } catch (error) {
      console.error('Error in fetchOperatorsByFactoryLine:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { operators, loading, fetchOperatorsByFactoryLine };
}

export async function checkDefectsSchema() {
  try {
    // Try a simple query to see what columns are in a sample defect
    const { data, error } = await supabase
      .from('defects')
      .select('*')
      .limit(1);
      
    console.log('Sample defect data:', data);
    
    if (error) {
      console.error('Error fetching sample defect:', error);
      return { error };
    }
    
    // If we got data, extract the column names from the first item
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('Available columns in defects table:', columns);
      return { columns, sample: data[0] };
    }
    
    // No data found, try to query the information schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', 'defects');
      
    if (schemaError) {
      console.error('Error fetching schema info:', schemaError);
      return { schemaError };
    }
    
    return { schema: schemaData };
  } catch (error) {
    console.error('Error checking defects schema:', error);
    return { error };
  }
}

export function useLeaderboard() {
  // Default awards structure
  const defaultAwards = [
    {
      id: 'lightning-spotter',
      name: 'Lightning Spotter',
      description: 'Fastest to achieve Bingo',
      icon: 'zap',
      recipients: []
    },
    {
      id: 'eagle-eye',
      name: 'Eagle Eye',
      description: 'Second fastest Bingo',
      icon: 'eye',
      recipients: []
    },
    {
      id: 'master-detective',
      name: 'Master Detective',
      description: 'Third fastest Bingo',
      icon: 'search',
      recipients: []
    },
    {
      id: 'guardian-of-quality',
      name: 'Guardian of Quality',
      description: 'Most defects identified',
      icon: 'shield',
      recipients: []
    }
  ];

  const [players, setPlayers] = useState<any[]>([]);
  const [plantStats, setPlantStats] = useState<any[]>([]);
  const [lineStats, setLineStats] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>(defaultAwards);
  const [loading, setLoading] = useState(true);

  // Fetch all required data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        await Promise.all([
          fetchPlayers(),
          fetchPlantStats(),
          fetchLineStats()
        ]);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Set up realtime subscription for defects to update stats
    const defectsSubscription = supabase
      .channel('defects-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'defects' 
      }, () => {
        fetchPlayers();
        fetchPlantStats();
        fetchLineStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(defectsSubscription);
    };
  }, []);

  // Fetch players with their stats
  async function fetchPlayers() {
    try {
      // Step 1: Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, role, email, epf_number, line_number, plant_id');

      if (usersError) throw usersError;

      // Step 2: Get bingo cards for each user
      const { data: bingoCards, error: bingoError } = await supabase
        .from('bingo_cards')
        .select('user_id, score, completed');

      if (bingoError) throw bingoError;

      // Step 3: Get defect counts by user
      const { data: defects, error: defectsError } = await supabase
        .from('defects')
        .select('created_by, validated');

      if (defectsError) throw defectsError;

      // Process and combine the data
      const processedPlayers = users.map((user) => {
        // Get user's bingo cards
        const userBingoCards = bingoCards.filter(card => card.user_id === user.id);
        
        // Calculate total score from bingo cards
        const bingoScore = userBingoCards.reduce((sum, card) => sum + (card.score || 0), 0);
        
        // Count completed bingos
        const bingoCount = userBingoCards.filter(card => card.completed).length;
        
        // Count defects found by this user
        const defectsFound = defects.filter(defect => defect.created_by === user.id).length;
        
        // Count validated defects
        const validatedDefects = defects.filter(
          defect => defect.created_by === user.id && defect.validated
        ).length;
        
        // Calculate total score (bingo score + defects score)
        // Formula: bingo score + (5 points per defect) + (3 points per validated defect)
        const totalScore = bingoScore + (defectsFound * 5) + (validatedDefects * 3);

        return {
          id: user.id,
          name: user.name,
          role: user.role,
          score: totalScore,
          bingoCount,
          defectsFound,
          epfNumber: user.epf_number,
          line: user.line_number,
          factory: user.plant_id
        };
      });

      setPlayers(processedPlayers);
      updateAwards(processedPlayers);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  }

  // Fetch plant statistics
  async function fetchPlantStats() {
    try {
      // Get all plants
      const { data: plants, error: plantsError } = await supabase
        .from('plants')
        .select('id, name, lines');

      if (plantsError) throw plantsError;

      // Get defects grouped by factory
      const { data: defects, error: defectsError } = await supabase
        .from('defects')
        .select('factory_id, line_number');

      if (defectsError) throw defectsError;

      // Process plant statistics
      const processedPlants = plants.map(plant => {
        const plantDefects = defects.filter(d => d.factory_id === plant.id);
        const uniqueLines = new Set(plantDefects.map(d => d.line_number)).size;
        const qualityScore = 100 - Math.min(80, plantDefects.length * 2);

        return {
          id: plant.id,
          name: plant.name,
          defects: plantDefects,
          uniqueLines,
          qualityScore
        };
      });

      setPlantStats(processedPlants);
    } catch (error) {
      console.error('Error fetching plant stats:', error);
    }
  }

  // Fetch line statistics
  async function fetchLineStats() {
    try {
      // Get all plants for reference
      const { data: plants, error: plantsError } = await supabase
        .from('plants')
        .select('id, name, lines');

      if (plantsError) throw plantsError;

      // Get defects for line statistics
      const { data: defects, error: defectsError } = await supabase
        .from('defects')
        .select('factory_id, line_number');

      if (defectsError) throw defectsError;

      // Create unique factory+line combinations
      const lineMap = new Map();
      
      defects.forEach(defect => {
        const lineKey = `${defect.factory_id}-${defect.line_number}`;
        
        if (!lineMap.has(lineKey)) {
          lineMap.set(lineKey, {
            id: lineKey,
            factoryId: defect.factory_id,
            lineNumber: defect.line_number,
            defects: []
          });
        }
        
        const lineData = lineMap.get(lineKey);
        lineData.defects.push(defect);
      });

      // Convert to array and calculate quality scores
      const processedLines = Array.from(lineMap.values()).map(line => {
        const qualityScore = 100 - Math.min(80, line.defects.length * 3);
        
        // Find plant name
        const plant = plants.find(p => p.id === line.factoryId);
        const plantName = plant ? plant.name : `Factory ${line.factoryId}`;
        
        return {
          ...line,
          plantName,
          qualityScore
        };
      });

      setLineStats(processedLines);
    } catch (error) {
      console.error('Error fetching line stats:', error);
    }
  }

  // Update awards based on player statistics
  function updateAwards(currentPlayers) {
    if (!currentPlayers || currentPlayers.length <= 1) return;
    
    const playersList = currentPlayers || players;
    const sortedByScore = [...playersList].sort((a, b) => b.score - a.score);
    const sortedByDefects = [...playersList].sort((a, b) => b.defectsFound - a.defectsFound);
    
    const updatedAwards = [...awards];
    
    // Update each award with top players
    if (sortedByScore[0]?.name) {
      updatedAwards[0] = { 
        ...awards[0], 
        recipients: [sortedByScore[0].name] 
      };
    }
    
    if (sortedByScore[1]?.name) {
      updatedAwards[1] = { 
        ...awards[1], 
        recipients: [sortedByScore[1].name] 
      };
    }
    
    if (sortedByScore[2]?.name) {
      updatedAwards[2] = { 
        ...awards[2], 
        recipients: [sortedByScore[2].name]
      };
    }
    
    if (sortedByDefects[0]?.name) {
      updatedAwards[3] = { 
        ...awards[3], 
        recipients: [sortedByDefects[0].name] 
      };
    }
    
    setAwards(updatedAwards);
  }

  return {
    players,
    plantStats,
    lineStats,
    awards,
    loading,
    fetchPlayers,
    fetchPlantStats,
    fetchLineStats,
    updateAwards
  };
}

export function useBingoDefects() {
  const [loading, setLoading] = useState(false);
  const [bingoDefects, setBingoDefects] = useState<any[]>([]);
  
  // Function to ensure a default bingo card exists
  const ensureDefaultBingoCard = useCallback(async () => {
    try {
      // Check if default bingo card exists
      const { data: existingCard, error: checkError } = await supabase
        .from('bingo_cards')
        .select('id')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for default bingo card:', checkError);
        return null;
      }
      
      // If default card doesn't exist, create it
      if (!existingCard) {
        const { data, error } = await supabase
          .from('bingo_cards')
          .insert([{
            id: '00000000-0000-0000-0000-000000000001',
            user_id: '00000000-0000-0000-0000-000000000001',
            completed: false,
            score: 0
          }])
          .select();
          
        if (error) {
          console.error('Error creating default bingo card:', error);
          return null;
        }
        
        console.log('Created default bingo card:', data);
        return data[0];
      }
      
      return existingCard;
    } catch (error) {
      console.error('Error in ensureDefaultBingoCard:', error);
      return null;
    }
  }, []);
  
  const fetchBingoDefects = useCallback(async () => {
    setLoading(true);
    try {
      // Fix the relationship query by being more specific about the join
      const { data, error } = await supabase
        .from('bingo_defects')
        .select(`
          *,
          created_by_user:users!bingo_defects_created_by_fkey(name, epf_number),
          validated_by_user:users!bingo_defects_validated_by_fkey(name, epf_number),
          bingo_cards(*)
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching bingo defects:', error);
        throw error;
      }
      
      setBingoDefects(data || []);
    } catch (error) {
      console.error('Error in fetchBingoDefects:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    // Ensure default bingo card exists when component mounts
    ensureDefaultBingoCard();
    fetchBingoDefects();
  }, [fetchBingoDefects, ensureDefaultBingoCard]);
  
  const addBingoDefect = useCallback(async (defect: any) => {
    setLoading(true);
    try {
      // Ensure default bingo card exists
      await ensureDefaultBingoCard();
      
      // Include all necessary fields from the defect
      const defectData: {
        garment_part: any;
        defect_type: string;
        bingo_card_id?: string; // Make this property optional
        is_bingo_line: boolean;
        bingo_line_type?: string;
        bingo_line_index?: number;
        cell_position?: string;
        validated: boolean;
        created_by: any;
        factory_id: any;
        line_number: any;
        epf_number?: any;
        operation?: any;
        status: string;
        reworked: boolean;
        points_awarded: number;
      } = {
        garment_part: typeof defect.garmentPart === 'object' ? defect.garmentPart.code : defect.garmentPart,
        defect_type: typeof defect.defectType === 'object' ? String(defect.defectType.code) : String(defect.defectType),
        is_bingo_line: defect.isBingoLine || false,
        bingo_line_type: defect.bingoLineType,
        bingo_line_index: defect.bingoLineIndex,
        cell_position: defect.cellPosition,
        validated: false,
        created_by: defect.operatorId || '00000000-0000-0000-0000-000000000001',
        factory_id: defect.factoryId,
        line_number: defect.lineNumber,
        epf_number: defect.epfNumber,
        operation: defect.operation,
        status: defect.status || 'pending',
        reworked: defect.reworked || false,
        points_awarded: defect.pointsAwarded || 0
      };
      
      // Use default bingo card if the provided ID doesn't exist
      defectData.bingo_card_id = '00000000-0000-0000-0000-000000000001';
      
      // Check if the bingo card ID exists - only include it if it's a valid UUID format
      if (defect.bingoCardId && 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(defect.bingoCardId)) {
        // Verify that this is a real bingo card ID by checking if it exists in the bingo_cards table
        try {
          const { data: cardExists } = await supabase
            .from('bingo_cards')
            .select('id')
            .eq('id', defect.bingoCardId)
            .single();
            
          if (cardExists) {
            defectData.bingo_card_id = defect.bingoCardId;
          }
        } catch (e) {
          console.log('Bingo card ID not found in database, using default');
        }
      }
      
      // Fix for potential invalid UUID format in factory_id (same as in useDefects)
      if (defectData.factory_id === 'A6') {
        defectData.factory_id = '00000000-0000-0000-0000-000000000001';
      } else if (!defectData.factory_id.includes('-')) {
        try {
          // Attempt to load from localStorage mapping
          const factoryMapping = JSON.parse(localStorage.getItem('factory-id-mapping') || '{}');
          if (factoryMapping[defectData.factory_id.toLowerCase()]) {
            defectData.factory_id = factoryMapping[defectData.factory_id.toLowerCase()];
          } else {
            // Fallback to hardcoded mapping
            defectData.factory_id = '00000000-0000-0000-0000-000000000001';
          }
        } catch (e) {
          // If parsing fails, use default UUID
          defectData.factory_id = '00000000-0000-0000-0000-000000000001';
        }
      }
      
      console.log('Inserting bingo defect into Supabase:', defectData);
      
      const { data, error } = await supabase
        .from('bingo_defects')
        .insert([defectData])
        .select();
        
      if (error) {
        console.error('Error adding bingo defect:', error);
        throw error;
      }
      
      // Update local state
      fetchBingoDefects();
      
      return data;
    } catch (error) {
      console.error('Error in addBingoDefect:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchBingoDefects, ensureDefaultBingoCard]);

  const validateBingoDefect = useCallback(async (id: string, validate: boolean, comment?: string) => {
    try {
      // Default UUID for validation
      const DEFAULT_VALIDATOR_UUID = '00000000-0000-0000-0000-000000000001';
      
      // Create update payload
      const updatePayload = {
        validated: validate,
        supervisor_comment: comment || null,
        validated_by: DEFAULT_VALIDATOR_UUID,
        validated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('bingo_defects')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error validating bingo defect:', error);
        throw error;
      }
      
      // Refresh data
      await fetchBingoDefects();
      
      return data;
    } catch (error) {
      console.error('Error in validateBingoDefect:', error);
      throw error;
    }
  }, [fetchBingoDefects]);

  const getBingoDefectsStats = useCallback(async () => {
    try {
      // Get total defects
      const { count, error: countError } = await supabase
        .from('bingo_defects')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        throw countError;
      }
      
      // Get defects by status
      const { data: statusData, error: statusError } = await supabase
        .from('bingo_defects')
        .select('status')
        .is('validated', true);
        
      if (statusError) {
        throw statusError;
      }
      
      // Get bingo line defects
      const { data: bingoLineData, error: bingoLineError } = await supabase
        .from('bingo_defects')
        .select('is_bingo_line')
        .eq('is_bingo_line', true);
        
      if (bingoLineError) {
        throw bingoLineError;
      }
      
      // Calculate stats
      const stats = {
        total: count || 0,
        validated: statusData?.length || 0,
        bingoLines: bingoLineData?.length || 0
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting bingo defects stats:', error);
      throw error;
    }
  }, []);

  return {
    bingoDefects,
    loading,
    addBingoDefect,
    validateBingoDefect,
    fetchBingoDefects,
    getBingoDefectsStats,
    ensureDefaultBingoCard
  };
} 