// This is the version to use AFTER running the SQL script to add line_number column

import { useCallback, useState } from 'react';
import { supabase } from './client';
import { RecordedDefect } from '@/lib/types';

export function useDefects() {
  const [loading, setLoading] = useState(false);
  const [defects, setDefects] = useState([]);
  
  const fetchDefects = useCallback(async () => {
    // Fetch implementation here
  }, []);

  const addDefect = useCallback(async (defect: RecordedDefect) => {
    setLoading(true);
    try {
      // Now include line_number since it exists in the database after running the SQL script
      const defectData = {
        id: defect.id,
        garment_part: typeof defect.garmentPart === 'object' ? defect.garmentPart.code : defect.garmentPart,
        defect_type: typeof defect.defectType === 'object' ? String(defect.defectType.code) : String(defect.defectType),
        validated: false,
        created_by: defect.operatorId,
        factory_id: defect.factoryId,
        line_number: defect.lineNumber,  // Now including this field
        status: defect.status || 'pending',
        reworked: defect.reworked || false
      };
      
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
  
  return { addDefect, loading };
} 